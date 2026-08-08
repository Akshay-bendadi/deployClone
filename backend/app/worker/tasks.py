"""Worker task handlers (plan.txt §11, §16, §19-29): deploy -> test -> compare -> risk -> explain."""

import logging

from app.db import SessionLocal
from app.models.enums import (
    ComparisonCategory,
    EnvironmentKind,
    ReleaseStatus,
    RiskVerdict,
    TestRunStatus,
)
from app.models.comparison import Comparison
from app.models.environment import Environment
from app.models.regression import Regression
from app.models.release import Release
from app.models.risk_report import RiskReport
from app.models.test_result import TestResult
from app.models.test_run import TestRun
from app.models.workflow import Workflow
from app.services.ai_explainer import generate_explanation
from app.services.comparator import RegressionFinding, compare_functional, compare_performance
from app.services.deployment_service import DeploymentError, run_candidate_deployment
from app.services.risk_engine import calculate_risk_score, determine_verdict
from app.services.workflow_runner import StepExecution, run_workflow

logger = logging.getLogger(__name__)

_VERDICT_TO_RELEASE_STATUS = {
    RiskVerdict.SAFE: ReleaseStatus.SAFE,
    RiskVerdict.REVIEW: ReleaseStatus.REVIEW,
    RiskVerdict.HIGH_RISK: ReleaseStatus.REVIEW,
    RiskVerdict.BLOCK: ReleaseStatus.BLOCKED,
}


def _run_and_persist(db, *, release: Release, workflow: Workflow, environment: Environment) -> list[StepExecution]:
    executions = run_workflow(base_url=environment.api_url, steps=workflow.steps)

    test_run = TestRun(
        release_id=release.id,
        workflow_id=workflow.id,
        environment_id=environment.id,
        status=(
            TestRunStatus.PASSED
            if all(e.error is None and (e.http_status or 0) < 400 for e in executions)
            else TestRunStatus.FAILED
        ),
    )
    db.add(test_run)
    db.flush()

    for execution in executions:
        db.add(
            TestResult(
                test_run_id=test_run.id,
                step_name=execution.step_name,
                http_status=execution.http_status,
                latency_ms=execution.latency_ms,
                response_body=execution.response_body,
                error=execution.error,
            )
        )
    db.commit()
    return executions


def run_release_test(release_id: str) -> None:
    db = SessionLocal()
    try:
        release = db.get(Release, release_id)
        if release is None:
            logger.error("run_release_test: release %s not found", release_id)
            return

        production = Environment(
            release_id=release.id,
            kind=EnvironmentKind.PRODUCTION,
            api_url=release.project.production_url,
        )
        db.add(production)
        db.commit()

        try:
            candidate = run_candidate_deployment(db, release)
        except DeploymentError as exc:
            logger.warning("Candidate deployment failed for release %s at %s: %s", release.id, exc.step, exc.reason)
            release.status = ReleaseStatus.FAILED
            db.commit()
            return

        release.status = ReleaseStatus.TESTING
        db.commit()

        all_findings: list[RegressionFinding] = []
        for workflow in release.project.workflows:
            production_steps = _run_and_persist(db, release=release, workflow=workflow, environment=production)
            candidate_steps = _run_and_persist(db, release=release, workflow=workflow, environment=candidate)

            candidate_by_name = {step.step_name: step for step in candidate_steps}
            for production_step in production_steps:
                candidate_step = candidate_by_name.get(production_step.step_name)
                if candidate_step is None:
                    continue

                findings = compare_functional(
                    production_status=production_step.http_status,
                    candidate_status=candidate_step.http_status,
                    production_body=production_step.response_body,
                    candidate_body=candidate_step.response_body,
                    production_error=production_step.error,
                    candidate_error=candidate_step.error,
                )
                if findings:
                    comparison = Comparison(
                        release_id=release.id,
                        category=ComparisonCategory.FUNCTIONAL,
                        production_value={
                            "step": production_step.step_name,
                            "status": production_step.http_status,
                            "body": production_step.response_body,
                        },
                        candidate_value={
                            "step": candidate_step.step_name,
                            "status": candidate_step.http_status,
                            "body": candidate_step.response_body,
                        },
                    )
                    db.add(comparison)
                    db.flush()
                    for finding in findings:
                        db.add(Regression(comparison_id=comparison.id, severity=finding.severity, summary=finding.summary))
                    all_findings.extend(findings)

            production_latencies = [s.latency_ms for s in production_steps if s.latency_ms is not None]
            candidate_latencies = [s.latency_ms for s in candidate_steps if s.latency_ms is not None]
            if production_latencies and candidate_latencies:
                findings = compare_performance(
                    production_p95_ms=max(production_latencies),
                    candidate_p95_ms=max(candidate_latencies),
                )
                if findings:
                    comparison = Comparison(
                        release_id=release.id,
                        category=ComparisonCategory.PERFORMANCE,
                        production_value={"max_latency_ms": max(production_latencies)},
                        candidate_value={"max_latency_ms": max(candidate_latencies)},
                    )
                    db.add(comparison)
                    db.flush()
                    for finding in findings:
                        db.add(Regression(comparison_id=comparison.id, severity=finding.severity, summary=finding.summary))
                    all_findings.extend(findings)

        db.commit()

        risk_score = calculate_risk_score(all_findings)
        verdict = determine_verdict(risk_score)
        ai_explanation = generate_explanation(
            {
                "release": release.version,
                "risk_score": risk_score,
                "verdict": verdict.value,
                "regressions": [{"severity": f.severity.value, "summary": f.summary} for f in all_findings],
            }
        )

        db.add(RiskReport(release_id=release.id, risk_score=risk_score, verdict=verdict, ai_explanation=ai_explanation))
        release.status = _VERDICT_TO_RELEASE_STATUS[verdict]
        db.commit()
    finally:
        db.close()
