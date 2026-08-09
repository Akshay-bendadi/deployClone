# deployClone

> **Zerops Challenge — August 2026**
> Built for the [Zerops Hackathon](https://zerops.io). Deployed entirely on Zerops infrastructure.

A green CI pipeline proves your code compiled and your tests passed — it does not prove the release behaves the same as production. deployClone catches that gap.

## The problem

You push a commit. CI is green. You deploy. Then something breaks — an API endpoint starts returning 500s, a frontend layout shifts, a page that loaded fine yesterday now crashes. The deployment succeeded — the _release_ didn't.

Traditional pipelines test code in isolation. They never let you see the new release running live, side-by-side with what's already in production, before it ships.

## How deployClone solves it

deployClone deploys a **live twin** of every release commit next to production on Zerops — whether it's a backend API or a frontend app. You get a real, running copy of the new code to test against before merging.

- **Backend / API projects** — deployClone replays your defined HTTP workflows against both production and the twin, compares responses (status, shape, latency), and scores the risk automatically.
- **Frontend projects** — deployClone deploys the twin and gives you a live URL to open side-by-side with production for visual testing. Use a start command like `npx serve dist -p 3000` to serve static builds.

Both project types also get **AI-powered diff analysis** that scans the actual code changes for breaking changes and risk flags.

### 1. Register a project

Point deployClone at a GitHub repository that's already running in production:

- **Repository URL** — e.g. `github.com/acme/payments-api`
- **Production URL** — the live app deployClone compares the twin against
- **Production branch** — e.g. `main`
- **Runtime, build command, start command** — how to build and boot the app (for frontends: `npx serve dist -p 3000`)
- **Root directory** _(optional)_ — for monorepos where the app lives in a subdirectory

### 2. Create a release

Pick a branch to test. deployClone resolves it to its latest commit SHA via the GitHub API:

```
Branch: feat/new-pricing
  └── Commit: a1b2c3d
```

### 3. The twin deploys

The background worker:

1. Downloads the exact commit as a tarball from GitHub
2. Strips to the root directory (if configured) so the twin's file layout matches production
3. Generates a `zerops.yaml` from the project's runtime + build + start commands
4. Creates a temporary service on Zerops and uploads the code
5. Builds, deploys, and health-checks it

The result: two running instances — **production** (your live app) and the **twin** (the release commit, deployed identically).

```
┌──────────────────────┐          ┌──────────────────────┐
│     Production       │          │        Twin          │
│  main @ 9f8e7d6      │          │  feat/new-pricing    │
│  app.acme.com        │          │  @ a1b2c3d           │
│                      │          │  twin-xk2.zerops.app │
│  ■ (live)            │          │  ┊ (twin)            │
└──────────────────────┘          └──────────────────────┘
```

### 4. Test the release

**Backend projects** — you define **Workflows**, ordered sequences of real HTTP requests:

```
Workflow: "Create and fetch order"
  Step 1 → POST /api/orders        {"item": "widget", "qty": 1}
  Step 2 → GET  /api/orders/:id
```

deployClone replays every step against both production and the twin, capturing the full request/response pair from each.

**Frontend projects** — the twin is live and you get a URL to open it, click around, and visually compare it with production.

**Both** — AI diff analysis scans the actual code patches between commits and flags breaking changes and risk areas.

### 5. Compare and score

The comparator diffs production vs. twin across three signals:

| Signal | What it checks | Example failure |
|---|---|---|
| **Status** | HTTP status codes match | Prod returns `200`, twin returns `500` |
| **Shape** | Response body structure matches (keys, types) | Twin drops the `price` field |
| **Latency** | Response time delta is within threshold | Twin is 4x slower than prod |

AI diff analysis adds to the score:

| AI finding | Severity | Score impact |
|---|---|---|
| **Breaking change** | CRITICAL | +40 |
| **Risk flag** | MEDIUM | +10 |

The risk engine (fully deterministic — no AI in the scoring path) produces a verdict:

- **SAFE** — no regressions detected
- **REVIEW** — minor differences worth checking
- **HIGH_RISK** — significant divergence detected
- **BLOCK** — the twin is clearly broken

### 6. Evidence and auto-teardown

Every request, response, diff, and score is stored as auditable evidence. Nothing is thrown away — you can inspect exactly why a release was flagged, down to the raw response body.

An optional AI explanation layer (NVIDIA `meta/llama-3.1-8b-instruct`) turns the evidence into a human-readable summary, but the verdict itself never depends on it.

After testing completes, the twin auto-deletes after 5 minutes to stop Zerops billing. A live countdown shows on the deployment page. You can also tear it down manually at any time.

---

## What you can test

deployClone supports **any single-service repository** — one runtime, one build command, one start command:

- **Backend APIs** (Node.js, Python, Go, Ruby, Java, .NET, etc.) — automated workflow replay + response comparison + AI diff analysis + risk scoring
- **Frontend apps** (React, Vue, Next.js, etc.) — twin deployment + live URL for visual testing + AI diff analysis
- **Monorepo subdirectories** — deploy just one service from a larger repo using the root directory setting

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

- **GitHub API** — branch resolution, commit comparison, exact-commit tarball download, AI diff analysis input.
- **Zerops** — twin deployment platform. Builds and hosts the twin service.
- **NVIDIA Build** — AI-powered diff analysis (`meta/llama-3.1-8b-instruct`) for breaking change detection and risk explanations. No-ops without a key.

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
| `NVIDIA_API_KEY` | No | Enables AI diff analysis and risk explanations (no-ops without it) |

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

- **Single-service only.** The twin is one Zerops service. Multi-service architectures (API + worker + database) aren't provisioned together.
- **Synthetic traffic.** Workflows are manually defined HTTP sequences, not replayed production traffic. They catch structural regressions, not load-dependent ones.
- **Shared database caveat.** The twin can share production's database (via env vars). If workflows write data, both environments mutate the same store — design workflows accordingly.
- **Zerops-coupled.** Twin infrastructure is provisioned on Zerops. There's no pluggable provider abstraction yet.

## License

MIT
