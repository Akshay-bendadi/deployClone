"""AI explanation layer.

Deterministic first, AI second: this only turns already-decided evidence into
prose. It never influences the risk score or verdict, and returns None
(no-op) if NVIDIA_API_KEY isn't configured — the rest of the system must
work without it.
"""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

_SYSTEM_PROMPT = (
    "You are explaining a release-safety verdict that a deterministic rule-based engine has "
    "already decided. Given structured evidence (regressions found, risk score, verdict), write "
    "a concise 2-4 sentence explanation in plain language for a developer. Cite the concrete "
    "regressions by name. Do not change, second-guess, or contradict the verdict you were given."
)


def generate_explanation(evidence: dict) -> str | None:
    settings = get_settings()
    if not settings.nvidia_api_key:
        logger.info("NVIDIA_API_KEY not set; skipping AI explanation (deterministic verdict stands alone).")
        return None

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
                    {"role": "user", "content": str(evidence)},
                ],
                "temperature": 0.2,
                "max_tokens": 400,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError) as exc:
        logger.warning("NVIDIA explanation request failed, continuing without it: %s", exc)
        return None
