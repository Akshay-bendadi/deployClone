from functools import lru_cache

import redis
from rq import Queue
from rq.job import Job

from app.config import get_settings

RELEASE_QUEUE_NAME = "releases"

# Defense-in-depth against a genuinely hung job (network stall, etc.) — the inner
# candidate-build poll already times out at 600s, so 20 minutes covers that plus every
# other step with real margin. This does NOT protect against the worker process itself
# being killed; see _fail_orphaned_releases in worker.py for that case.
_RELEASE_JOB_TIMEOUT_S = 1200


@lru_cache
def get_redis_connection() -> redis.Redis:
    return redis.Redis.from_url(get_settings().valkey_url)


def get_release_queue() -> Queue:
    return Queue(RELEASE_QUEUE_NAME, connection=get_redis_connection())


def enqueue_release_test(release_id: str) -> Job:
    return get_release_queue().enqueue(
        "app.worker.tasks.run_release_test", release_id, job_timeout=_RELEASE_JOB_TIMEOUT_S
    )
