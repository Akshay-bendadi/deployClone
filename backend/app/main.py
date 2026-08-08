from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import environments, health, projects, releases, workflows

app = FastAPI(title="deployClone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(projects.router)
app.include_router(workflows.router)
app.include_router(releases.projects_router)
app.include_router(releases.releases_router)
app.include_router(environments.router)
