# deployClone

> **Zerops Challenge — August 2026**
> Built for the [Zerops Hackathon](https://zerops.io). Deployed entirely on Zerops infrastructure.

A green CI pipeline proves your code compiled and your tests passed — it does not prove the release behaves the same as production. deployClone catches that gap.

## The problem

You push a commit. CI is green. You deploy. Users start reporting 500s on an endpoint that worked yesterday. The deployment succeeded — the _release_ didn't.

Traditional deployment pipelines test code in isolation (unit tests, integration tests against mocked services). They never compare the actual HTTP behaviour of the new release against the live system it's replacing.

## How deployClone solves it

deployClone stands a **live twin** of every release next to production, replays real HTTP workflows against both, and diffs the results into a verdict — before your users find the regression for you.

### 1. Register a project

Point deployClone at a GitHub repository that's already running in production:

- **Repository URL** — e.g. `github.com/acme/payments-api`
- **Production URL** — e.g. `https://api.acme.com`
- **Production branch** — e.g. `main`
- **Runtime, build command, start command** — how to build and boot the app
- **Root directory** _(optional)_ — for monorepos where the app lives in a subdirectory (e.g. `backend`). The twin deploys only that directory's contents, matching production's structure.

### 2. Create a release

Pick a branch to test. deployClone resolves it to its latest commit SHA via the GitHub API:

```
Branch: feat/new-pricing
  └── Commit: a1b2c3d
```

### 3. The twin deploys

The background worker takes over:

1. Downloads the exact commit as a tarball from GitHub
2. Strips to the root directory (if configured) so the twin's file layout matches production
3. Generates a `zerops.yaml` from the project's runtime + build + start commands
4. Creates a temporary service on Zerops and uploads the code
5. Builds, deploys, and health-checks it

The result: two running services — **production** (your live app) and the **twin** (the release commit, deployed identically).

```
┌──────────────────────┐          ┌──────────────────────┐
│     Production       │          │        Twin          │
│  main @ 9f8e7d6      │          │  feat/new-pricing    │
│  api.acme.com        │          │  @ a1b2c3d           │
│                      │          │  twin-xk2.zerops.app │
│  ■ (live)            │          │  ┊ (twin)            │
└──────────────────────┘          └──────────────────────┘
```

### 4. Workflows run against both

You define **Workflows** — ordered sequences of real HTTP requests that exercise your API:

```
Workflow: "Create and fetch order"
  Step 1 → POST /api/orders        {"item": "widget", "qty": 1}
  Step 2 → GET  /api/orders/:id
```

deployClone replays every step against **both** production and the twin, capturing the full request/response pair from each.

### 5. Compare and score

For every workflow step, the comparator diffs production vs. twin across three signals:

| Signal | What it checks | Example failure |
|---|---|---|
| **Status** | HTTP status codes match | Prod returns `200`, twin returns `500` |
| **Shape** | Response body structure matches (keys, types) | Twin drops the `price` field |
| **Latency** | Response time delta is within threshold | Twin is 4x slower than prod |

Each diff is scored by a deterministic **risk engine** (no AI in the scoring path) into a verdict:

- **SAFE** — responses are equivalent
- **REVIEW** — minor differences worth checking
- **HIGH_RISK** — significant divergence detected
- **BLOCK** — the twin is clearly broken

### 6. Evidence and auto-teardown

Every request, response, diff, and score is stored as auditable evidence. Nothing is thrown away — you can inspect exactly why a release was blocked, down to the raw response body.

An optional AI explanation layer (NVIDIA `llama-3.1-8b-instruct`) turns the deterministic evidence into a human-readable summary, but the verdict itself never depends on it.

After testing completes, the twin auto-deletes after 5 minutes to stop Zerops billing. You can also tear it down manually at any time from the deployment page.

---

## Current scope

deployClone currently supports **single-service repositories** — one runtime, one build command, one start command. This covers:

- A standalone API (Node.js, Python, Go, etc.)
- A backend service in a monorepo (using the root directory setting)
- Any single-process HTTP application

It does **not** yet handle multi-service architectures (e.g. an API + a separate worker + a database, all deployed together). The twin is always a single Zerops service running the configured start command.

---

## Architecture

```
┌─────────────┐       ┌─────────────┐       ┌──────────┐
│   Frontend  │──────▶│   Backend   │──────▶│  Worker  │
│  React/Vite │ REST  │   FastAPI   │  RQ   │  (jobs)  │
└─────────────┘       └──────┬──────┘       └────┬─────┘
                             │                    │
                  ┌──────────┼──────────┐         │
                  ▼          ▼          ▼         ▼
             Postgres     Valkey     GitHub    Zerops
             (data)      (queue)    (source)  (twin infra)
```

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router v7, React Hook Form + Zod.

**Backend** — FastAPI, SQLAlchemy + Alembic, PostgreSQL, Valkey + RQ, httpx, bcrypt + PyJWT.

**External services:**

- **GitHub API** — branch resolution, exact-commit tarball download.
- **Zerops** — twin deployment platform. Builds and hosts the twin service.
- **NVIDIA Build** — optional AI explanation layer (`meta/llama-3.1-8b-instruct`). No-ops without a key.

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

Copy `.env.example` to `.env` and fill in the required secrets.

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
```

Create a `.env.local` file with the backend URL:

```bash
# Local development
VITE_API_URL=http://localhost:8000

# Or point to the live backend
# VITE_API_URL=https://api-1f9-8000.ny1.zerops.app
```

```bash
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

## Deploying to Zerops

See `zerops.yaml` at the project root for the full deployment configuration:

| Service | Type | What it runs |
|---|---|---|
| `frontend` | Static (Nginx) | React SPA built with Vite |
| `api` | Python 3.12 | FastAPI + Alembic migrations on startup |
| `worker` | Python 3.12 | RQ background worker for twin deploys |
| `db` | PostgreSQL 16 | Application database |
| `valkey` | Valkey 8 | Job queue + cache |

---

## Honest limitations

- **Single-service only.** The twin is one Zerops service. Multi-service architectures (API + worker + database) aren't provisioned together — only the HTTP-serving process is cloned.
- **Synthetic traffic only.** Workflows are manually defined HTTP sequences, not replayed production traffic. They catch structural regressions, not load-dependent ones.
- **Shared database caveat.** The twin typically shares production's database (via env vars). If workflows write data, both production and twin will mutate the same database — design workflows accordingly.
- **Zerops-coupled.** Twin infrastructure is provisioned on Zerops. There's no pluggable provider abstraction yet.

## License

MIT
