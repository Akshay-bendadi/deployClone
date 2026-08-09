"""Worker entrypoint: `python -m app.worker.worker`"""

import logging
import platform

from rq import SimpleWorker, Worker

from app.db import SessionLocal
from app.logging_config import configure_logging
from app.models.deployment import Deployment
from app.models.enums import DeploymentStatus, ReleaseStatus
from app.models.environment import Environment
from app.models.release import Release
from app.worker.queue import RELEASE_QUEUE_NAME, get_redis_connection, get_release_queue
from app.worker.tasks import _cleanup_candidate

configure_logging()
logger = logging.getLogger(__name__)


def _fail_orphaned_releases() -> None:
    """Marks releases stuck in DEPLOYING/TESTING as FAILED on worker startup.

    We run a single worker process. If it's killed mid-job (crash, restart, `pkill`),
    the release it was processing is left in an intermediate status forever — nothing
    will ever move it to a terminal state, so the frontend polls it indefinitely and
    there's no record of what happened. Any release still non-terminal when a *new*
    worker process starts up must be orphaned from a previous run, since this worker
    never queued it itself.

    This also fails any of that release's Deployment step rows still stuck at
    pending/in_progress — otherwise the release shows FAILED while its deployment
    screen shows a step frozen "in progress" forever, since nothing else ever
    updates those rows.

    Also tears down any live candidate Zerops service for the orphaned release: a
    killed worker process never runs its `finally` block, so without this a candidate
    that finished deploying right before the kill would keep running (and billing)
    forever with nothing left to notice or clean it up.
    """
    db = SessionLocal()
    try:
        orphaned = (
            db.query(Release)
            .filter(Release.status.in_([ReleaseStatus.DEPLOYING, ReleaseStatus.TESTING]))
            .all()
        )
        for release in orphaned:
            release.status = ReleaseStatus.FAILED
            logger.warning(
                "Marking release %s as FAILED — orphaned from a previous worker run", release.id
            )

            stuck_steps = (
                db.query(Deployment)
                .join(Environment, Deployment.environment_id == Environment.id)
                .filter(
                    Environment.release_id == release.id,
                    Deployment.status.in_([DeploymentStatus.PENDING, DeploymentStatus.IN_PROGRESS]),
                )
                .all()
            )
            for step in stuck_steps:
                step.status = DeploymentStatus.FAILED
                step.reason = "Worker process restarted mid-deployment — this step's outcome is unknown"

        if orphaned:
            db.commit()

        for release in orphaned:
            _cleanup_candidate(db, release)
    finally:
        db.close()


def _purge_stale_queue() -> None:
    """Empties the release queue on startup — any job still sitting here belongs to a
    run that never started under the previous (now-dead) worker process, so it's stale
    by the same reasoning as _fail_orphaned_releases."""
    queue = get_release_queue()
    purged = queue.empty()
    if purged:
        logger.warning("Purged %d stale job(s) from the %s queue on startup", purged, RELEASE_QUEUE_NAME)


def main() -> None:
    _fail_orphaned_releases()
    _purge_stale_queue()

    # RQ's default Worker forks a work-horse process per job. On macOS that reliably
    # segfaults once native-extension libraries (e.g. PyYAML's C backend) are loaded
    # before the fork — a well-known class of macOS fork-safety issue, not present on
    # Linux. SimpleWorker runs jobs in-process instead (less isolation, but correct)
    # and is only needed for local dev; Zerops' containers run Linux, so production
    # keeps the real forking Worker and its per-job process isolation.
    worker_class = SimpleWorker if platform.system() == "Darwin" else Worker
    worker = worker_class([RELEASE_QUEUE_NAME], connection=get_redis_connection())
    worker.work()


if __name__ == "__main__":
    main()
