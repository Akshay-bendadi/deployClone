# deployClone backend

FastAPI + SQLAlchemy + Alembic + Postgres + Valkey-backed worker, implementing the ReleaseTwin
data model and pipeline described in `plan.txt`.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

docker compose up -d          # Postgres on :5544, Valkey on :6380
alembic upgrade head
```

Copy `.env.example` to `.env` if you need to override any defaults (they already match
`docker-compose.yml`).

## Running

```bash
# API
uvicorn app.main:app --reload --port 8000

# Worker (macOS only: OBJC_DISABLE_INITIALIZE_FORK_SAFETY works around a fork-safety
# crash in rq's forking worker caused by the Objective-C runtime; not needed on Linux,
# so not needed in the Zerops deployment)
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES python -m app.worker.worker
```

## Status

- DB schema, migrations, CRUD API, comparator, risk engine, workflow runner, and the
  worker pipeline are real and tested end-to-end.
- `app/services/zerops_client.py`: read endpoints (`list_projects`) work against the real
  Zerops API. Write endpoints (`import_service_stack`, `trigger_deploy`) are stubbed —
  Zerops' Swagger reference is a JS-rendered SPA that couldn't be scraped for exact
  request/response shapes, so they raise `NotImplementedError` rather than guess.
  Needs a live `ZEROPS_API_TOKEN` to verify and finish.
- `app/services/ai_explainer.py`: calls NVIDIA's `meta/llama-3.3-70b-instruct` via their
  OpenAI-compatible endpoint. No-ops (returns `None`) if `NVIDIA_API_KEY` is unset — the
  deterministic risk engine never depends on it, per plan.txt §28.
