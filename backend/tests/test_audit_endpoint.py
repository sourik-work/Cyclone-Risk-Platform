"""Unit tests for unified audit endpoint /api/audit/recent."""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def _mock_doc(data: dict):
    doc = MagicMock()
    doc.to_dict.return_value = data
    return doc


def test_audit_recent_empty(client):
    """Mocks empty Firestore and verifies {"events": [], "total": 0} is returned gracefully."""
    mock_coll = MagicMock()
    mock_coll.order_by.return_value.limit.return_value.stream.return_value = []

    mock_db = MagicMock()
    mock_db.collection.return_value = mock_coll

    with patch("backend.services.firebase_service.get_firestore_client", return_value=mock_db):
        resp = client.get("/api/audit/recent")
        assert resp.status_code == 200
        data = resp.json()
        assert data["events"] == []
        assert data["total"] == 0


def test_audit_recent_with_events(client):
    """Mocks 2 events across Firestore collections and verifies reverse chronological sort."""
    doc_adv = _mock_doc({
        "event_type": "APPROVED",
        "timestamp": "2026-09-23T10:00:00Z",
        "actor": "officer@imd.gov.in",
        "resource_id": "ADV-883921",
        "headline": "Cyclone Fani Red Alert Approved",
    })
    doc_ins = _mock_doc({
        "event_type": "INSURANCE_TRIGGERED",
        "timestamp": "2026-09-23T11:00:00Z",
        "actor": "system",
        "resource_id": "POL-992811",
        "reason": "Storm surge threshold exceeded 3.0m",
    })

    def mock_collection(name: str):
        coll = MagicMock()
        if name == "advisory_audit":
            coll.order_by.return_value.limit.return_value.stream.return_value = [doc_adv]
        elif name == "insurance_audit":
            coll.order_by.return_value.limit.return_value.stream.return_value = [doc_ins]
        else:
            coll.order_by.return_value.limit.return_value.stream.return_value = []
        return coll

    mock_db = MagicMock()
    mock_db.collection.side_effect = mock_collection

    with patch("backend.services.firebase_service.get_firestore_client", return_value=mock_db):
        resp = client.get("/api/audit/recent")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["events"]) == 2
        # Verify sorted reverse-chronologically (11:00:00 before 10:00:00)
        assert data["events"][0]["event_type"] == "INSURANCE_TRIGGERED"
        assert data["events"][1]["event_type"] == "APPROVED"


def test_audit_recent_limit(client):
    """Verifies limit parameter restricts results."""
    doc1 = _mock_doc({
        "event_type": "GENERATED",
        "timestamp": "2026-09-23T08:00:00Z",
        "resource_id": "ADV-001",
    })
    doc2 = _mock_doc({
        "event_type": "APPROVED",
        "timestamp": "2026-09-23T09:00:00Z",
        "resource_id": "ADV-002",
    })
    doc3 = _mock_doc({
        "event_type": "DISPATCHED",
        "timestamp": "2026-09-23T10:00:00Z",
        "resource_id": "ADV-003",
    })

    def mock_collection(name: str):
        coll = MagicMock()
        if name == "advisory_audit":
            coll.order_by.return_value.limit.return_value.stream.return_value = [doc3, doc2, doc1]
        else:
            coll.order_by.return_value.limit.return_value.stream.return_value = []
        return coll

    mock_db = MagicMock()
    mock_db.collection.side_effect = mock_collection

    with patch("backend.services.firebase_service.get_firestore_client", return_value=mock_db):
        resp = client.get("/api/audit/recent?limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["events"]) == 2
        assert data["total"] == 2
        assert data["events"][0]["event_type"] == "DISPATCHED"
        assert data["events"][1]["event_type"] == "APPROVED"
