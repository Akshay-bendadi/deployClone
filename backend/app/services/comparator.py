"""Deterministic comparison engine (plan.txt §23-26).

Pure functions: given production and candidate evidence, return regression
findings. No DB or network access here — callers persist the results.
"""

from dataclasses import dataclass

from app.models.enums import RegressionSeverity


@dataclass(frozen=True)
class RegressionFinding:
    severity: RegressionSeverity
    summary: str


def _flatten_keys(value: object, prefix: str = "") -> set[str]:
    if not isinstance(value, dict):
        return set()

    keys: set[str] = set()
    for key, nested in value.items():
        path = f"{prefix}.{key}" if prefix else key
        keys.add(path)
        keys |= _flatten_keys(nested, path)
    return keys


def compare_functional(
    *,
    production_status: int | None,
    candidate_status: int | None,
    production_body: dict | list | None,
    candidate_body: dict | list | None,
    production_error: str | None = None,
    candidate_error: str | None = None,
) -> list[RegressionFinding]:
    """Compares HTTP status, response schema, and errors (plan.txt §23-24)."""
    findings: list[RegressionFinding] = []

    production_ok = production_status is not None and 200 <= production_status < 300
    candidate_ok = candidate_status is not None and 200 <= candidate_status < 300

    if production_ok and not candidate_ok:
        findings.append(
            RegressionFinding(
                RegressionSeverity.CRITICAL,
                f"HTTP status regressed: {production_status} -> {candidate_status}",
            )
        )
    elif production_status != candidate_status:
        findings.append(
            RegressionFinding(
                RegressionSeverity.MEDIUM,
                f"HTTP status changed: {production_status} -> {candidate_status}",
            )
        )

    if candidate_error and not production_error:
        findings.append(RegressionFinding(RegressionSeverity.HIGH, f"New error on twin: {candidate_error}"))

    if isinstance(production_body, dict) and isinstance(candidate_body, dict):
        production_keys = _flatten_keys(production_body)
        candidate_keys = _flatten_keys(candidate_body)
        removed = sorted(production_keys - candidate_keys)
        added = sorted(candidate_keys - production_keys)

        if removed or added:
            parts = []
            if removed:
                parts.append(f"removed: {', '.join(removed)}")
            if added:
                parts.append(f"added: {', '.join(added)}")
            findings.append(
                RegressionFinding(RegressionSeverity.CRITICAL, f"Response schema changed ({'; '.join(parts)})")
            )

    return findings


def compare_performance(*, production_p95_ms: float, candidate_p95_ms: float) -> list[RegressionFinding]:
    """Compares P95 latency (plan.txt §25)."""
    if production_p95_ms <= 0:
        return []

    increase_pct = ((candidate_p95_ms - production_p95_ms) / production_p95_ms) * 100
    if increase_pct < 20:
        return []

    summary = f"P95 latency increased {increase_pct:.0f}% ({production_p95_ms:.0f}ms -> {candidate_p95_ms:.0f}ms)"
    if increase_pct >= 100:
        severity = RegressionSeverity.CRITICAL
    elif increase_pct >= 50:
        severity = RegressionSeverity.HIGH
    else:
        severity = RegressionSeverity.MEDIUM

    return [RegressionFinding(severity, summary)]


def compare_worker(
    *,
    production_success: int,
    production_total: int,
    candidate_success: int,
    candidate_total: int,
) -> list[RegressionFinding]:
    """Compares background job success/failure rate (plan.txt §26)."""
    if production_total <= 0 or candidate_total <= 0:
        return []

    production_failure_rate = 1 - (production_success / production_total)
    candidate_failure_rate = 1 - (candidate_success / candidate_total)

    if candidate_failure_rate <= production_failure_rate:
        return []

    summary = (
        f"Worker failure rate increased {production_failure_rate:.0%} -> {candidate_failure_rate:.0%}"
    )
    if candidate_failure_rate >= 0.20:
        severity = RegressionSeverity.CRITICAL
    elif candidate_failure_rate >= 0.10:
        severity = RegressionSeverity.HIGH
    elif candidate_failure_rate >= 0.05:
        severity = RegressionSeverity.MEDIUM
    else:
        severity = RegressionSeverity.LOW

    return [RegressionFinding(severity, summary)]
