"""Worker entrypoint: `python -m app.worker.worker`"""

import logging

from rq import Worker

from app.worker.queue import RELEASE_QUEUE_NAME, get_redis_connection

logging.basicConfig(level=logging.INFO)


def main() -> None:
    worker = Worker([RELEASE_QUEUE_NAME], connection=get_redis_connection())
    worker.work()


if __name__ == "__main__":
    main()
