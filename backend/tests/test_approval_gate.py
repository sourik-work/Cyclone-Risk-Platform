"""Unit tests for the Human-in-the-Loop approval gate, audit trails, and dispatcher authorization."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.cyclone import ApprovalState


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_advisory_approval_gate_lifecycle(client: TestClient):
    """Verifies that advisory generation enters PENDING_APPROVAL and requires approval before dispatch."""
    # 1. Generate an advisory with demo dispatcher auth
    resp = client.post(
        "/api/advisories/generate",
        json={"cyclone_id": "BOB-02-2019", "target_districts": ["Puri"]},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert resp.status_code == 200
    adv = resp.json()
    adv_id = adv["advisory_id"]
    assert adv["approval_state"] == ApprovalState.PENDING_APPROVAL.value
    assert adv["approved_by"] is None

    # 2. Check audit trail shows PENDING_APPROVAL
    audit_resp = client.get(f"/api/advisories/{adv_id}/audit")
    assert audit_resp.status_code == 200
    entries = audit_resp.json()
    assert len(entries) >= 1
    assert any(e["state"] == ApprovalState.PENDING_APPROVAL.value for e in entries)

    # 3. Non-dispatcher cannot approve (403 Forbidden)
    forbidden_resp = client.post(
        f"/api/advisories/{adv_id}/approve",
        json={"notes": "Attempt by unprivileged officer"},
        headers={"Authorization": "Bearer demo-token"},
    )
    assert forbidden_resp.status_code == 403

    # 4. Dispatcher approves advisory -> transitions to APPROVED / DISPATCHED
    approve_resp = client.post(
        f"/api/advisories/{adv_id}/approve",
        json={"approved_by": "Senior Officer Das", "notes": "Verified against ground radar. Approved for broadcast."},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert approve_resp.status_code == 200
    approved_adv = approve_resp.json()
    assert approved_adv["approval_state"] in (ApprovalState.APPROVED.value, ApprovalState.DISPATCHED.value)
    assert approved_adv["approved_by"] == "Senior Officer Das"
    assert approved_adv["approved_at"] is not None

    # 5. Audit trail now includes approval event
    final_audit = client.get(f"/api/advisories/{adv_id}/audit").json()
    assert len(final_audit) >= 2
    assert any(e["actor"] == "Senior Officer Das" for e in final_audit)


def test_advisory_rejection_lifecycle(client: TestClient):
    """Verifies that an advisory can be rejected with reason and does not dispatch."""
    resp = client.post(
        "/api/advisories/generate",
        json={"cyclone_id": "BOB-01-2020", "target_districts": ["South 24 Parganas"]},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert resp.status_code == 200
    adv_id = resp.json()["advisory_id"]

    reject_resp = client.post(
        f"/api/advisories/{adv_id}/reject",
        json={"reason": "Overestimated surge elevation; awaiting next IMD bulletin update."},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert reject_resp.status_code == 200
    rejected_adv = reject_resp.json()
    assert rejected_adv["approval_state"] == ApprovalState.REJECTED.value
    assert "Overestimated surge" in rejected_adv["rejection_reason"]


def test_insurance_approval_gate_lifecycle(client: TestClient):
    """Verifies that parametric insurance evaluations enter PENDING_APPROVAL and require approval."""
    # 1. Evaluate insurance for Fani (heavy landfall, active triggers)
    resp = client.post(
        "/api/insurance/evaluate",
        json={"cyclone_id": "BOB-02-2019"},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["triggers_active"] > 0
    assert data["approval_state"] == ApprovalState.PENDING_APPROVAL.value

    # 2. Check insurance audit trail
    audit_resp = client.get("/api/insurance/audit")
    assert audit_resp.status_code == 200
    trail = audit_resp.json()
    assert len(trail) >= 1

    # 3. Non-dispatcher cannot approve liquidity release
    non_disp = client.post(
        "/api/insurance/approve",
        json={"notes": "Unauthorized approval"},
        headers={"Authorization": "Bearer demo-token"},
    )
    assert non_disp.status_code == 403

    # 4. Dispatcher approves payout disbursement
    approved = client.post(
        "/api/insurance/approve",
        json={"approved_by": "Disaster Relief Commissioner", "notes": "Approved emergency liquidity allocation"},
        headers={"Authorization": "Bearer demo-dispatcher-token"},
    )
    assert approved.status_code == 200
    app_data = approved.json()
    assert app_data["approval_state"] in (ApprovalState.APPROVED.value, ApprovalState.DISPATCHED.value)
    assert app_data["approved_by"] == "Disaster Relief Commissioner"
