from functools import lru_cache

import redis
from rq import Queue

from app.config import get_settings

RELEASE_QUEUE_NAME = "releases"


@lru_cache
def get_redis_connection() -> redis.Redis:
    return redis.Redis.from_url(get_settings().valkey_url)


def get_release_queue() -> Queue:
    return Queue(RELEASE_QUEUE_NAME, connection=get_redis_connection())
