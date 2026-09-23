"""Unit tests for runtime asset state service and endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.api.routes import router
from backend.core.auth import require_auth
from backend.main import app
from backend.services.asset_state_service import (
    clear_memory_store,
    get_all_asset_statuses,
    get_asset_status,
    update_asset_status,
)


@pytest.fixture(autouse=True)
def reset_store():
    clear_memory_store()
    yield
    clear_memory_store()


def test_update_asset_status_structure():
    """Verify update_asset_status returns correct dictionary schema and keys."""
    res = update_asset_status(
        asset_id="OD-SUB-001",
        status="DAMAGED",
        reason="Transformer sub-station submerged under 1.2m surge",
        updated_by="operator@odraf.gov.in",
        metrics={"submerged_depth_m": 1.2, "generator": "offline"},
    )
    assert res["asset_id"] == "OD-SUB-001"
    assert res["status"] == "DAMAGED"
    assert res["current_status"] == "DAMAGED"
    assert res["reason"] == "Transformer sub-station submerged under 1.2m surge"
    assert res["updated_by"] == "operator@odraf.gov.in"
    assert res["metrics"]["generator"] == "offline"
    assert "updated_at" in res
    assert "history" in res
    assert len(res["history"]) == 1


def test_get_asset_status_retrieval():
    """Verify get_asset_status retrieves the updated status and appends history."""
    update_asset_status(
        asset_id="OD-SHEL-001",
        status="EVACUATING",
        reason="Evacuation buses arriving",
    )
    update_asset_status(
        asset_id="OD-SHEL-001",
        status="FULL",
        reason="Shelter reached 100% capacity",
        metrics={"occupancy": 1500, "capacity": 1500},
    )

    current = get_asset_status("OD-SHEL-001")
    assert current is not None
    assert current["status"] == "FULL"
    assert current["reason"] == "Shelter reached 100% capacity"
    assert len(current["history"]) == 2
    assert current["history"][0]["status"] == "EVACUATING"
    assert current["history"][1]["status"] == "FULL"


def test_memory_fallback_when_firestore_unavailable():
    """Verify in-memory fallback works seamlessly when Firestore is not present."""
    # With no Firestore mock or invalid client, functions execute without raising exceptions
    update_asset_status(
        asset_id="WB-HOSP-002",
        status="OFFLINE",
        reason="Grid blackout, generator failed",
    )
    all_statuses = get_all_asset_statuses()
    assert "WB-HOSP-002" in all_statuses
    assert all_statuses["WB-HOSP-002"]["status"] == "OFFLINE"


def test_api_assets_status_endpoints():
    """Verify GET and POST /api/assets status endpoints."""
    # Override auth for test client
    app.dependency_overrides[require_auth] = lambda: {
        "email": "test-dispatcher@cyclone-risk.gov.in",
        "uid": "test-dispatcher-123",
    }
    client = TestClient(app)

    try:
        # 1. Update status via POST
        post_resp = client.post(
            "/api/assets/KL-HOSP-001/status",
            json={
                "asset_id": "KL-HOSP-001",
                "status": "DAMAGED",
                "reason": "Floodwater breach in basement generator room",
                "metrics": {"beds_available": 120},
            },
        )
        assert post_resp.status_code == 200
        data = post_resp.json()
        assert data["asset_id"] == "KL-HOSP-001"
        assert data["current_status"] == "DAMAGED"
        assert data["updated_by"] == "test-dispatcher@cyclone-risk.gov.in"

        # 2. List all statuses via GET
        get_resp = client.get("/api/assets/status")
        assert get_resp.status_code == 200
        all_data = get_resp.json()
        assert "assets" in all_data
        assert "KL-HOSP-001" in all_data["assets"]
        assert all_data["assets"]["KL-HOSP-001"]["status"] == "DAMAGED"
    finally:
        app.dependency_overrides.pop(require_auth, None)
