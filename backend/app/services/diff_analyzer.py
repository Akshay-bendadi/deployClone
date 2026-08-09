import logging

import httpx

from app.config import get_settings
from app.services.github_client import BranchDiff

logger = logging.getLogger(__name__)

_NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

_SYSTEM_PROMPT = (
    "You are a release analyst. Given a list of changed files between a production branch and a "
    "release branch, produce a concise JSON analysis with these fields:\n"
    '  "summary": one-sentence overview of what this release changes,\n'
    '  "new_endpoints": list of likely new API endpoints (inferred from new route/controller files),\n'
    '  "removed_endpoints": list of likely removed endpoints,\n'
    '  "new_dependencies": list of new packages (inferred from package.json/requirements.txt/go.mod changes),\n'
    '  "removed_dependencies": list of removed packages,\n'
    '  "new_pages": list of new UI pages or views (inferred from new page/view component files),\n'
    '  "breaking_changes": list of potential breaking changes (renamed files, deleted public APIs),\n'
    '  "risk_flags": list of things a reviewer should pay attention to (e.g. migration files, env changes, auth changes)\n'
    "Return ONLY valid JSON, no markdown fences. Empty lists for categories with nothing detected."
)


def analyze_diff(diff: BranchDiff) -> dict | None:
    settings = get_settings()
    if not settings.nvidia_api_key:
        return None

    if not diff.files:
        return None

    file_summary = "\n".join(
        f"  {f.status.upper():10} {f.filename}  (+{f.additions} -{f.deletions})"
        for f in diff.files
    )
    user_prompt = (
        f"{diff.total_commits} commits, {len(diff.files)} files changed:\n{file_summary}"
    )

    try:
        response = httpx.post(
            _NVIDIA_CHAT_URL,
            headers={
                "Authorization": f"Bearer {settings.nvidia_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.nvidia_model,
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 800,
            },
            timeout=25.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        import json
        return json.loads(content)
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        logger.warning("Diff analysis failed: %s", exc)
        return None
