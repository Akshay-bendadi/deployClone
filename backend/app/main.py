import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, environments, health, projects, releases, workflows
from app.logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="deployClone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):  # type: ignore[no-untyped-def]
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "Unhandled error on %s %s (%.1fms)", request.method, request.url.path, duration_ms
        )
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    duration_ms = (time.perf_counter() - start) * 1000
    if response.status_code >= 500:
        log_level = logging.ERROR
    elif response.status_code >= 400:
        log_level = logging.WARNING
    else:
        log_level = logging.INFO
    logger.log(
        log_level,
        "%s %s -> %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(workflows.router)
app.include_router(workflows.workflow_router)
app.include_router(releases.projects_router)
app.include_router(releases.releases_router)
app.include_router(environments.router)
