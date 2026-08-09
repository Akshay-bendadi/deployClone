import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

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
from app.services.zerops_client import get_zerops_client

logger = logging.getLogger(__name__)

_VERDICT_TO_RELEASE_STATUS = {
    RiskVerdict.SAFE: ReleaseStatus.SAFE,
    RiskVerdict.REVIEW: ReleaseStatus.REVIEW,
    RiskVerdict.HIGH_RISK: ReleaseStatus.REVIEW,
    RiskVerdict.BLOCK: ReleaseStatus.BLOCKED,
}


def _run_and_persist(
    db: Session, *, release: Release, workflow: Workflow, environment: Environment
) -> list[StepExecution]:
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

        # trigger_test_release sets DEPLOYING right before enqueueing — anything else
        # means this job is stale (e.g. a leftover queue entry from a worker that died
        # before starting it, already reconciled to FAILED on the next worker startup).
        if release.status != ReleaseStatus.DEPLOYING:
            logger.warning(
                "run_release_test: skipping release %s, not in DEPLOYING status (got %s)",
                release_id,
                release.status,
            )
            return

        try:
            _run_release_test(db, release)
        except Exception:
            logger.exception("run_release_test crashed for release %s", release_id)
            release.status = ReleaseStatus.FAILED
            db.commit()
            _cleanup_candidate(db, release)
            raise
    finally:
        db.close()


def _cleanup_candidate(db: Session, release: Release) -> None:
    """Deletes the candidate's Zerops service(s).

    Only called for outcomes where there's nothing useful left to inspect: the candidate
    deployment itself failed (DeploymentError — no live app was ever reached), or the job
    crashed outright (unknown state, safety net). A release that finishes testing with a
    real verdict (SAFE/REVIEW/BLOCKED) deliberately does *not* call this — the whole point
    of testing a candidate is to be able to look at it, so it's left running until the
    user tears it down themselves (see the manual teardown endpoint) or retests the
    release (which reconciles/cleans up prior attempts).

    A release can be retried multiple times (each retry creates a new CANDIDATE
    Environment), so this must clean up every candidate tied to the release, not just
    one — a `.one_or_none()` here would blow up as soon as a release has been tested
    more than once.
    """
    candidates = (
        db.query(Environment)
        .filter(Environment.release_id == release.id, Environment.kind == EnvironmentKind.CANDIDATE)
        .all()
    )

    zerops = get_zerops_client()
    if zerops is None:
        return

    for candidate in candidates:
        if not candidate.zerops_service_stack_id:
            continue
        try:
            zerops.delete_service_stack(candidate.zerops_service_stack_id)
            logger.info(
                "Deleted candidate Zerops service %s for release %s", candidate.zerops_service_stack_id, release.id
            )
            candidate.zerops_service_stack_id = None
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (400, 404):
                # Already deleted — expected when a release with multiple retries has more
                # than one candidate and an earlier run already tore this one down.
                logger.info(
                    "Candidate Zerops service %s for release %s was already gone",
                    candidate.zerops_service_stack_id,
                    release.id,
                )
                candidate.zerops_service_stack_id = None
            else:
                logger.exception(
                    "Failed to delete candidate Zerops service %s for release %s — check Zerops manually",
                    candidate.zerops_service_stack_id,
                    release.id,
                )
        except Exception:
            logger.exception(
                "Failed to delete candidate Zerops service %s for release %s — check Zerops manually",
                candidate.zerops_service_stack_id,
                release.id,
            )
    db.commit()


def _reset_previous_test_data(db: Session, release: Release) -> None:
    """Clears a prior attempt's test evidence before a retest starts.

    Without this, retesting the same release crashes outright: RiskReport has a
    one-per-release unique constraint, so a second INSERT for the same release_id
    raises a UniqueViolation that leaves the release stuck at TESTING forever (nothing
    ever moves it to a terminal status again). It also left stale TestRun/Comparison
    rows from earlier attempts mixed in with the current one, making Test Run/Evidence
    show confusing leftover results instead of just the latest attempt.
    """
    db.query(TestResult).filter(
        TestResult.test_run_id.in_(db.query(TestRun.id).filter(TestRun.release_id == release.id))
    ).delete(synchronize_session=False)
    db.query(TestRun).filter(TestRun.release_id == release.id).delete(synchronize_session=False)

    db.query(Regression).filter(
        Regression.comparison_id.in_(db.query(Comparison.id).filter(Comparison.release_id == release.id))
    ).delete(synchronize_session=False)
    db.query(Comparison).filter(Comparison.release_id == release.id).delete(synchronize_session=False)

    db.query(RiskReport).filter(RiskReport.release_id == release.id).delete(synchronize_session=False)
    db.commit()


def _run_release_test(db: Session, release: Release) -> None:
    _reset_previous_test_data(db, release)

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
        _cleanup_candidate(db, release)
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

    from app.worker.queue import AUTO_TEARDOWN_DELAY, enqueue_auto_teardown

    teardown_at = datetime.now(timezone.utc) + AUTO_TEARDOWN_DELAY
    candidate.auto_teardown_at = teardown_at
    db.commit()

    enqueue_auto_teardown(str(release.id))
    logger.info("Release %s finished testing: %s (risk score %d), auto-teardown at %s", release.id, verdict.value, risk_score, teardown_at)


def auto_teardown_twin(release_id: str) -> None:
    db = SessionLocal()
    try:
        release = db.get(Release, release_id)
        if release is None:
            return
        _cleanup_candidate(db, release)
        logger.info("Auto-teardown completed for release %s", release_id)
    finally:
        db.close()
