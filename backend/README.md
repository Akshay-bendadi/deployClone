# deployClone backend

FastAPI + SQLAlchemy + Alembic + Postgres + Valkey-backed worker, implementing the deployClone
data model and pipeline described in `plan.txt`.

## Setup

```bash
python3.12 -m venv .venv   # 3.12 specifically — pydantic-core/psycopg don't have wheels for 3.14 yet
source .venv/bin/activate
pip install -r requirements-dev.txt

docker compose up -d          # Postgres on :5544, Valkey on :6380
alembic upgrade head
```

Copy `.env.example` to `.env` and fill in `JWT_SECRET_KEY` (generate with
`python3 -c "import secrets; print(secrets.token_hex(32))"`), `ZEROPS_API_TOKEN`,
`ZEROPS_PROJECT_ID`, and `NVIDIA_API_KEY` as needed — see the "Status" section below for what
each one gates.

## Running

```bash
# API
uvicorn app.main:app --reload --port 8000

# Worker
python -m app.worker.worker
```

Swagger UI is at `http://localhost:8000/docs`.

## Status

Everything below is real and tested end-to-end against live services (not stubs):

- DB schema, migrations, CRUD API, auth (JWT, per-user project ownership), comparator, risk
  engine, workflow runner.
- **Zerops** (`app/services/zerops_client.py`): the full candidate lifecycle — create a
  code-less service, download the release's exact commit as a tarball from GitHub, upload it,
  build-and-deploy using a `zerops.yaml` generated server-side from the project's
  `build_command`/`start_command`/`zerops_runtime` (see `deployment_service._generate_zerops_yaml`),
  poll until live, record its public URL. We deliberately never read a `zerops.yaml` from the
  target repo — most repos being tested won't have one; the tool takes a build+start command the
  same way Render/Railway do. Verified against a real Zerops project including a full build that
  reached `ACTIVE` with a working public URL. Requires `ZEROPS_API_TOKEN` + `ZEROPS_PROJECT_ID`;
  without them, release testing fails cleanly at "Create candidate service" instead of pretending
  to provision infrastructure.
- **GitHub** (`app/services/github_client.py`): branch → commit resolution and exact-commit
  tarball download, both via the real GitHub API. `buildFromGit` (Zerops' one-shot git-clone
  option) was deliberately *not* used for deploys — it only supports a repo's default branch,
  with no way to pin a specific commit.
- **AI explainer** (`app/services/ai_explainer.py`): calls NVIDIA's `meta/llama-3.1-8b-instruct`
  via their OpenAI-compatible endpoint (the `3.3-70b` model hangs indefinitely rather than
  erroring for keys without access to it — confirmed live, so avoid it). No-ops (returns `None`)
  if `NVIDIA_API_KEY` is unset — the deterministic risk engine never depends on it, per
  plan.txt §28.

## Known gaps

- No teardown/cleanup for candidate services after a release finishes — they stay running on
  Zerops (consuming real credits) until manually deleted. Worth fixing before this sees
  meaningful use.
- Candidate provisioning is single-service only (matches `Project.zerops_runtime`); it doesn't
  parse a target repo's own service topology (e.g. separate DB/worker services).
- Local worker uses `SimpleWorker` (in-process, no fork) on macOS specifically — RQ's default
  forking `Worker` reliably segfaults on macOS once native-extension libraries like PyYAML's C
  backend are loaded before `fork()`. Linux (i.e. the actual Zerops deployment) is unaffected
  and uses the real forking `Worker` for proper per-job process isolation.
