"""Workflow runner: executes a workflow's steps against a base URL.

Steps may reference prior step responses via "{step_name.field.path}" placeholders,
e.g. a "close_issue" step's path can be "/issues/{create_issue.id}".
"""

import re
import time
from dataclasses import dataclass
from functools import reduce
from typing import Any

import httpx

_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\}")


@dataclass
class StepExecution:
    step_name: str
    http_status: int | None
    latency_ms: float | None
    response_body: dict | list | None
    error: str | None


def _lookup(context: dict[str, Any], path: str) -> Any:
    return reduce(lambda value, key: value[key] if isinstance(value, dict) else getattr(value, key), path.split("."), context)


def _resolve(value: Any, context: dict[str, Any]) -> Any:
    if isinstance(value, str):
        full_match = _PLACEHOLDER_RE.fullmatch(value)
        if full_match:
            return _lookup(context, full_match.group(1))
        return _PLACEHOLDER_RE.sub(lambda m: str(_lookup(context, m.group(1))), value)
    if isinstance(value, dict):
        return {key: _resolve(item, context) for key, item in value.items()}
    if isinstance(value, list):
        return [_resolve(item, context) for item in value]
    return value


def run_workflow(
    *,
    base_url: str,
    steps: list[dict],
    client: httpx.Client | None = None,
    timeout_s: float = 15.0,
) -> list[StepExecution]:
    owns_client = client is None
    http_client = client or httpx.Client(base_url=base_url, timeout=timeout_s)

    executions: list[StepExecution] = []
    context: dict[str, Any] = {}

    try:
        for step in steps:
            name = step["name"]
            method = step["method"]
            path = _resolve(step["path"], context)
            body = _resolve(step.get("body"), context)

            start = time.perf_counter()
            try:
                response = http_client.request(method, path, json=body)
            except httpx.HTTPError as exc:
                executions.append(
                    StepExecution(step_name=name, http_status=None, latency_ms=None, response_body=None, error=str(exc))
                )
                context[name] = {}
                continue

            latency_ms = (time.perf_counter() - start) * 1000
            try:
                response_body = response.json()
            except ValueError:
                response_body = None

            executions.append(
                StepExecution(
                    step_name=name,
                    http_status=response.status_code,
                    latency_ms=latency_ms,
                    response_body=response_body,
                    error=None,
                )
            )
            context[name] = response_body if response_body is not None else {}
    finally:
        if owns_client:
            http_client.close()

    return executions
