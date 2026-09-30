"""Tests for Human-in-the-Loop Validation, Operator Metrics, and Review Latency."""

from fastapi.testclient import TestClient
import pytest

from backend.main import app
from backend.services.audit_service import AUDIT_SERVICE, OperatorAuditService


@pytest.fixture
def client():
    return TestClient(app)


def test_record_approval_calculates_review_latency():
    """Verify that approval computes review_latency_seconds and saves operator metadata."""
    service = OperatorAuditService()
    adv_id = "ADV-TEST-001"
    service.record_draft_created(adv_id, "BOB-02-2019")

    metric = service.record_approval(
        advisory_id=adv_id,
        operator_uid="collector_puri@odisha.gov.in",
        operator_role="District Collector",
        operator_confidence=5,
        modification_required=True,
        modification_diff="Added Marine Drive road closure alert",
    )

    assert metric.status == "APPROVED"
    assert metric.approved_at is not None
    assert metric.review_latency_seconds is not None
    assert metric.review_latency_seconds >= 0.0
    assert metric.operator_uid == "collector_puri@odisha.gov.in"
    assert metric.operator_confidence == 5
    assert metric.modification_required is True


def test_record_rejection_logs_reason():
    """Verify rejection logs reason and computes review latency."""
    service = OperatorAuditService()
    adv_id = "ADV-TEST-002"
    service.record_draft_created(adv_id, "BOB-01-2020")

    metric = service.record_rejection(
        advisory_id=adv_id,
        operator_uid="duty_officer@wb.gov.in",
        reason="Awaiting next radar scan to confirm Kakdwip surge height",
    )

    assert metric.status == "REJECTED"
    assert metric.rejected_at is not None
    assert "Kakdwip" in metric.modification_diff


def test_record_feedback_captures_survey_responses():
    """Verify 3-question survey is captured and recorded."""
    service = OperatorAuditService()
    adv_id = "ADV-TEST-003"
    service.record_draft_created(adv_id, "BOB-02-2019")
    service.record_approval(adv_id, "officer_1")

    updated = service.record_feedback(
        advisory_id=adv_id,
        clarity_score=5,
        modified=True,
        modification_diff="Replaced technical surge term with local Odia phrasing",
        trust_score=5,
    )

    assert updated is not None
    assert updated.feedback is not None
    assert updated.feedback.clarity_score == 5
    assert updated.feedback.modified_before_approval is True
    assert updated.feedback.trust_score == 5
    assert updated.modification_required is True


def test_aggregate_metrics_calculation():
    """Verify aggregate stats (median, p95, modification rate, approval rate) across seeded advisories."""
    service = OperatorAuditService()
    agg = service.get_aggregate_metrics(window="7d")

    assert agg["total_advisories"] >= 10
    assert agg["median_review_latency_seconds"] > 0.0
    assert agg["p95_review_latency_seconds"] >= agg["median_review_latency_seconds"]
    assert 0.0 <= agg["modification_rate"] <= 1.0
    assert 1.0 <= agg["mean_operator_confidence"] <= 5.0
    assert agg["approval_rate"] > 0.5


def test_api_advisory_metrics_endpoint(client):
    """Verify GET /api/advisories/{id}/metrics endpoint."""
    resp = client.get("/api/advisories/ADV-SEED-001/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "advisory_id" in data
    assert "review_latency_seconds" in data
    assert data["review_latency_seconds"] is not None


def test_api_aggregate_metrics_endpoint(client):
    """Verify GET /api/advisories/metrics/aggregate endpoint."""
    resp = client.get("/api/advisories/metrics/aggregate?window=7d")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_advisories"] >= 10
    assert "median_review_latency_seconds" in data
    assert "p95_review_latency_seconds" in data
    assert "modification_rate" in data
    assert "approval_rate" in data


def test_api_submit_feedback_endpoint(client):
    """Verify POST /api/advisories/{id}/feedback endpoint."""
    resp = client.post(
        "/api/advisories/ADV-SEED-001/feedback",
        json={
            "clarity_score": 4,
            "modified": False,
            "trust_score": 5,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["recorded"] is True
