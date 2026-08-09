import json
import logging
from dataclasses import dataclass

import httpx

from app.config import get_settings
from app.services.github_client import BranchDiff

logger = logging.getLogger(__name__)

_NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

_MAX_PATCH_CHARS = 12000

_SYSTEM_PROMPT = (
    "You are a senior release analyst reviewing code changes between a production branch "
    "and a release branch. You will be given the actual diff patches. Analyze them carefully "
    "and produce a JSON analysis with these fields:\n"
    '  "summary": 2-3 sentence overview of what this release changes and its impact,\n'
    '  "new_endpoints": list of NEW API endpoints added (include HTTP method and path, e.g. "POST /api/issues"),\n'
    '  "removed_endpoints": list of API endpoints that were REMOVED or disabled,\n'
    '  "new_dependencies": list of new packages/libraries added (from requirements.txt, package.json, go.mod, etc.),\n'
    '  "removed_dependencies": list of packages that were removed,\n'
    '  "new_pages": list of new UI pages or views added,\n'
    '  "breaking_changes": list of specific breaking changes (e.g. "renamed /users to /accounts", '
    '"changed response schema for GET /issues to return array instead of object", '
    '"removed required field \'email\' from User model"),\n'
    '  "risk_flags": list of things a reviewer should watch (e.g. "database migration added", '
    '"auth middleware modified", "error handling removed from payment flow")\n\n'
    "Be specific and precise — cite actual function names, routes, and field names from the diff. "
    "Don't guess or speculate about changes not visible in the patches. "
    "If a category has nothing, use an empty list. Return ONLY valid JSON, no markdown fences."
)


@dataclass
class AnalysisResult:
    data: dict | None = None
    error: str | None = None
    no_key: bool = False


def _build_patch_context(diff: BranchDiff) -> str:
    parts = []
    total_chars = 0
    for f in diff.files:
        header = f"--- {f.status.upper()} {f.filename} (+{f.additions} -{f.deletions})"
        if f.patch and total_chars + len(f.patch) < _MAX_PATCH_CHARS:
            parts.append(f"{header}\n{f.patch}")
            total_chars += len(header) + len(f.patch)
        else:
            parts.append(f"{header}  [patch truncated]" if f.patch else header)
    return "\n\n".join(parts)


def analyze_diff(diff: BranchDiff) -> AnalysisResult:
    settings = get_settings()
    if not settings.nvidia_api_key:
        return AnalysisResult(no_key=True)

    if not diff.files:
        return AnalysisResult(data=None)

    patch_context = _build_patch_context(diff)
    user_prompt = (
        f"{diff.total_commits} commit(s), {len(diff.files)} file(s) changed.\n\n"
        f"Diff patches:\n{patch_context}"
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
                "max_tokens": 1200,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()
        return AnalysisResult(data=json.loads(content))
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        logger.warning("Diff analysis failed: %s", exc)
        return AnalysisResult(error=str(exc))
