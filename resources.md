# Resources & Acknowledgements

> **Zerops Challenge — August 2026**
> This project was built for the Zerops Hackathon. Deployed entirely on Zerops infrastructure.

This document tracks the external tools, packages, platforms, and AI assistants used while
building and researching this project.

## Scaffolding

- **Frontend scaffold** — generated with [`create-firstbase-app`](https://www.npmjs.com/package/create-firstbase-app).

## Tech stack

### Frontend

- React 19, TypeScript, Vite
- Tailwind CSS + shadcn/ui-style components
- TanStack Query (`@tanstack/react-query`)
- React Router v7 (`react-router-dom`)
- React Hook Form + Zod validation
- lucide-react icons

### Backend

- FastAPI
- SQLAlchemy + Alembic
- PostgreSQL
- Valkey + `rq` (background worker / job queue)
- httpx

## Infrastructure

- **Zerops** — deployment platform for the frontend, API, worker, database, and cache.
- **Docker / docker-compose** — local Postgres + Valkey for development.

### Zerops resources (shared by Michel)

- [Zerops documentation](https://docs.zerops.io/)
- [Zerops LLM-friendly docs](https://docs.zerops.io/llms.txt) — structured reference for AI agents
- [Zerops API specification](https://api.app-prg1.zerops.io/api/rest/public/swagger/) — REST API swagger
- [Zerops routing config](https://app.zerops.io/service-stack/8jCK9QAVTlee347661GG8w/routing) — project routing panel
- **ZCP MCP server** — recommended for AI agents working with Zerops; provides richer context than the raw API

## AI

- **NVIDIA Build** (`meta/llama-3.1-8b-instruct`, via the NVIDIA API) — AI explanation layer
  that turns deterministic risk-engine evidence into a human-readable summary.

## Development

- **[Claude Code](https://claude.com/claude-code)** — used for development of this project.

## Zerops Challenge

- [Challenge livestream](https://zerops.io) — walkthrough of the challenge, rules, and a live build+deploy demo with ZCP
- [Rules & resources page](https://zerops.io) — quickstart, docs, and submission instructions
- Project submissions are open for early finishers

## Research

The following tools were used for research and reference while planning and building this project:

- **ChatGPT**
- **Gemini**
- **Zerops deployment documentation**
