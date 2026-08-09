# deployClone

Modern deployments can be successful while the release itself is broken.

A green CI pipeline proves your code compiled and your tests passed — it does not prove the release behaves the same as production. deployClone catches that gap.

---

## The problem

You push a commit. CI is green. You deploy. Users start reporting 500s on an endpoint that worked yesterday. The deployment succeeded — the _release_ didn't.

Traditional deployment pipelines test the code in isolation (unit tests, integration tests against mocked services). They never compare the actual HTTP behaviour of the new release against the live system it's replacing.

## How deployClone solves it

deployClone stands a **live twin** of every release next to production, replays real HTTP workflows against both, and turns the diff into a verdict — before your users find the regression for you.

### Step 1. Register a project

Point deployClone at a GitHub repository that's already running in production. You provide:

- The repository URL (e.g. `github.com/acme/payments-api`)
- The production URL (e.g. `https://api.acme.com`)
- The production branch (e.g. `main`)
- A runtime, build command, and start command

deployClone stores this as a **Project**. Think of it as: "here's what's live, and here's how to build it."

### Step 2. Create a release

Pick a branch to test. deployClone resolves the branch to its latest commit SHA via the GitHub API:

```
Branch: feat/new-pricing
  └─▶ Commit: a1b2c3d
```

This becomes a **Release** — a snapshot of exactly what you want to evaluate before merging.

### Step 3. The twin deploys

The background worker takes over. It:

1. Downloads the exact commit as a tarball from GitHub
2. Generates a `zerops.yaml` from the project's runtime + build + start commands
3. Creates a temporary service on Zerops and uploads the tarball
4. Builds and deploys it — a live, reachable copy of the release

The result: two running services — **production** (your live app) and the **twin** (the release commit, deployed identically).

```
┌──────────────────────┐          ┌──────────────────────┐
│     Production       │          │        Twin          │
│  main @ 9f8e7d6      │          │  feat/new-pricing    │
│  api.acme.com        │          │  @ a1b2c3d           │
│                      │          │  twin-xk2.zerops.app │
│  ■ (solid = live)    │          │  ┊ (dashed = twin)   │
└──────────────────────┘          └──────────────────────┘
```

### Step 4. Workflows run against both

You define **Workflows** — ordered sequences of real HTTP requests that exercise your API:

```
Workflow: "Create and fetch order"
  Step 1 → POST /api/orders        {"item": "widget", "qty": 1}
  Step 2 → GET  /api/orders/:id
```

deployClone replays every step against **both** production and the twin, capturing the full request/response pair from each.

```
          Production                          Twin
POST /api/orders ──▶ 201 Created    POST /api/orders ──▶ 201 Created
GET  /api/orders/42 ──▶ 200 OK      GET  /api/orders/42 ──▶ 200 OK
```

### Step 5. Compare and score

For every workflow step, the **comparator** diffs production vs. twin across three signals:

| Signal | What it checks | Example failure |
|---|---|---|
| **Status** | HTTP status codes match | Prod returns `200`, twin returns `500` |
| **Shape** | Response body structure matches (keys, types) | Twin drops the `price` field |
| **Latency** | Response time delta is within threshold | Twin is 4× slower than prod |

Each diff is scored by a deterministic **risk engine** (no AI in the scoring path) into a verdict:

- `SAFE` — responses are equivalent
- `REVIEW` — minor differences worth checking
- `HIGH_RISK` — significant divergence detected
- `BLOCK` — the twin is clearly broken

```
Risk score: 82 / 100
Verdict:    BLOCK
Reason:     Status mismatch on POST /api/orders (201 vs 500)
```

### Step 6. Evidence

Every request, response, diff, and score is stored as auditable **Evidence**. Nothing is thrown away — you can inspect exactly why a release was blocked, down to the raw headers and body.

An optional AI explanation layer (NVIDIA `llama-3.1-8b-instruct`) can turn the deterministic evidence into a human-readable summary, but the verdict itself never depends on it.

---

## Architecture

```
┌─────────────┐       ┌─────────────┐       ┌──────────┐
│   Frontend   │──────▶│   Backend   │──────▶│  Worker  │
│  React/Vite  │ REST  │   FastAPI   │  RQ   │  (jobs)  │
└─────────────┘       └──────┬──────┘       └────┬─────┘
                             │                    │
                  ┌──────────┼──────────┐         │
                  ▼          ▼          ▼         ▼
             Postgres     Valkey     GitHub    Zerops
             (data)      (queue)    (source)  (twin infra)
```

### Frontend

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui components, TanStack Query, React Router v7, React Hook Form + Zod validation, lucide-react icons.

### Backend

FastAPI, SQLAlchemy + Alembic (migrations), PostgreSQL, Valkey + RQ (background job queue), httpx (HTTP client for workflow replay), bcrypt + PyJWT (auth).

### External services

- **GitHub API** — branch → commit resolution, exact-commit tarball download.
- **Zerops** — twin deployment platform. Builds and hosts the twin service.
- **NVIDIA Build** — optional AI explanation layer (`meta/llama-3.1-8b-instruct`).

---

## Getting started

### Prerequisites

- Node.js 22+ and pnpm
- Python 3.12 (pydantic-core/psycopg don't have wheels for 3.14 yet)
- Docker (for local Postgres + Valkey)

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

# Start Postgres (port 5544) and Valkey (port 6380)
docker compose up -d
alembic upgrade head
```

Copy `.env.example` to `.env` and fill in the required secrets (see the environment variables table below, or `backend/README.md` for details).

```bash
# API server
uvicorn app.main:app --reload --port 8000

# Worker (separate terminal)
python -m app.worker.worker
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `VALKEY_URL` | Yes | Valkey/Redis connection string |
| `JWT_SECRET_KEY` | Yes | Secret for JWT auth tokens |
| `FIELD_ENCRYPTION_KEY` | Yes | Fernet key for encrypting sensitive fields at rest |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to `http://localhost:5173`) |
| `ZEROPS_API_TOKEN` | For deploys | Zerops personal access token |
| `ZEROPS_PROJECT_ID` | For deploys | Zerops project to deploy twins into |
| `NVIDIA_API_KEY` | No | Enables AI risk explanations (no-ops without it) |

## Deployment

See `zerops.yaml` at the project root for the full Zerops deployment configuration covering all five services:

| Service | Type | What it runs |
|---|---|---|
| `frontend` | Static (Nginx) | React SPA built with Vite |
| `api` | Python 3.12 | FastAPI + Alembic migrations on startup |
| `worker` | Python 3.12 | RQ background worker for twin deploys |
| `db` | PostgreSQL 16 | Application database |
| `valkey` | Valkey 8 | Job queue + cache |
