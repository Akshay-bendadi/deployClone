from datetime import timedelta
from functools import lru_cache

import redis
from rq import Queue
from rq.job import Job

from app.config import get_settings

RELEASE_QUEUE_NAME = "releases"

_RELEASE_JOB_TIMEOUT_S = 1200
AUTO_TEARDOWN_DELAY = timedelta(minutes=5)


@lru_cache
def get_redis_connection() -> redis.Redis:
    return redis.Redis.from_url(get_settings().valkey_url)


def get_release_queue() -> Queue:
    return Queue(RELEASE_QUEUE_NAME, connection=get_redis_connection())


def enqueue_release_test(release_id: str) -> Job:
    return get_release_queue().enqueue(
        "app.worker.tasks.run_release_test", release_id, job_timeout=_RELEASE_JOB_TIMEOUT_S
    )


def enqueue_auto_teardown(release_id: str) -> Job:
    return get_release_queue().enqueue_in(
        AUTO_TEARDOWN_DELAY, "app.worker.tasks.auto_teardown_twin", release_id
    )
