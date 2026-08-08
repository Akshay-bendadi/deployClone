# Resources & Acknowledgements

This document tracks the external tools, packages, platforms, and AI assistants used while
building and researching this project.

## Scaffolding

- **Frontend scaffold** — generated with [`create-firstbase-app`](https://www.npmjs.com/package/create-firstbase-app).

## Tech stack

### Frontend

- React, TypeScript, Vite
- Tailwind CSS + shadcn/ui-style components
- TanStack Query (`@tanstack/react-query`)
- React Router (`react-router-dom`)

### Backend

- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- Valkey + `rq` (background worker / job queue)
- httpx

## Infrastructure

- **Zerops** — deployment platform for the frontend, API, worker, database, and cache.
- **Docker / docker-compose** — local Postgres + Valkey for development.

## AI

- **NVIDIA Build** (`meta/llama-3.1-8b-instruct`, via the NVIDIA API) — AI explanation layer
  that turns deterministic risk-engine evidence into a human-readable summary.

## Development

- **[Claude Code](https://claude.com/claude-code)** — used for development of this project.

## Research

The following tools were used for research and reference while planning and building this project:

- **ChatGPT**
- **Gemini**
- **Zerops deployment documentation**
