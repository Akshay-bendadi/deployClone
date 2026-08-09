"""Deterministic risk engine.

Converts a set of regression findings into a 0-100 risk score and a verdict.
This runs before, and independently of, any AI explanation step.
"""

from app.config import Settings, get_settings
from app.models.enums import RegressionSeverity, RiskVerdict
from app.services.comparator import RegressionFinding

_SEVERITY_WEIGHT: dict[RegressionSeverity, int] = {
    RegressionSeverity.CRITICAL: 40,
    RegressionSeverity.HIGH: 20,
    RegressionSeverity.MEDIUM: 10,
    RegressionSeverity.LOW: 5,
}


def calculate_risk_score(findings: list[RegressionFinding]) -> int:
    score = sum(_SEVERITY_WEIGHT[finding.severity] for finding in findings)
    return min(score, 100)


def determine_verdict(risk_score: int, settings: Settings | None = None) -> RiskVerdict:
    settings = settings or get_settings()

    if risk_score <= settings.risk_safe_max:
        return RiskVerdict.SAFE
    if risk_score <= settings.risk_review_max:
        return RiskVerdict.REVIEW
    if risk_score <= settings.risk_high_risk_max:
        return RiskVerdict.HIGH_RISK
    return RiskVerdict.BLOCK
