"""Tests for Firebase Admin service, Cloud Storage service, and citizen reporting endpoints."""

import base64
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.main import app
from backend.schemas.cyclone import (
    AlertSubscribeRequest,
    AlertSubscribeResponse,
    AuthVerifyRequest,
    AuthVerifyResponse,
    CitizenReportRequest,
    CitizenReportResponse,
    FCMNotificationRequest,
)
from backend.services.cloud_storage_service import (
    get_signed_upload_url,
    upload_citizen_photo,
)
from backend.services.firebase_service import (
    get_recent_advisories,
    send_fcm_notification,
    subscribe_device,
    verify_id_token,
    write_citizen_report,
)

client = TestClient(app)


def test_verify_id_token_invalid():
    """Test verify_id_token with invalid token returns valid=False."""
    with patch("backend.services.firebase_service.auth.verify_id_token") as mock_verify:
        mock_verify.side_effect = Exception("Invalid token signature")
        res = verify_id_token("invalid_expired_token")
        assert res["valid"] is False
        assert res["uid"] == ""
        assert res["email"] is None

    # Empty token test
    res_empty = verify_id_token("")
    assert res_empty["valid"] is False


def test_verify_id_token_valid():
    """Test verify_id_token with valid token claims."""
    with patch("backend.services.firebase_service.auth.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "uid": "usr_998877",
            "email": "field_officer@imd.gov.in",
        }
        res = verify_id_token("valid_jwt_token_payload")
        assert res["valid"] is True
        assert res["uid"] == "usr_998877"
        assert res["email"] == "field_officer@imd.gov.in"


def test_upload_citizen_photo_mock_gcs():
    """Test upload_citizen_photo with mock GCS storage client."""
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.name = "cyclone-risk-platform-citizen-reports"
    mock_bucket.blob.return_value = mock_blob

    with patch("backend.services.cloud_storage_service.get_or_create_bucket", return_value=mock_bucket):
        fake_bytes = b"fake_jpeg_image_binary_data"
        report_id = "CR-TEST-001"
        filename = "photo.jpg"
        url = upload_citizen_photo(fake_bytes, filename, report_id)

        mock_bucket.blob.assert_called_once_with(f"{report_id}/{filename}")
        mock_blob.upload_from_string.assert_called_once_with(fake_bytes, content_type="image/jpeg")
        assert url == f"https://storage.googleapis.com/{mock_bucket.name}/{report_id}/{filename}"


def test_get_signed_upload_url_mock():
    """Test get_signed_upload_url generates signed PUT url."""
    mock_blob = MagicMock()
    mock_blob.generate_signed_url.return_value = "https://storage.googleapis.com/signed-put-target"
    mock_bucket = MagicMock()
    mock_bucket.name = "cyclone-risk-platform-citizen-reports"
    mock_bucket.blob.return_value = mock_blob

    with patch("backend.services.cloud_storage_service.get_or_create_bucket", return_value=mock_bucket):
        res = get_signed_upload_url("CR-TEST-002", "damage.png")
        assert res["upload_url"] == "https://storage.googleapis.com/signed-put-target"
        assert res["blob_path"] == "CR-TEST-002/damage.png"
        assert res["expires_in_minutes"] == 15


def test_write_citizen_report_and_get_advisories():
    """Test write_citizen_report and get_recent_advisories with mock Firestore."""
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "doc-report-123"

    mock_collection = MagicMock()
    mock_collection.document.return_value = mock_doc_ref

    mock_advisory_doc = MagicMock()
    mock_advisory_doc.id = "adv-1"
    mock_advisory_doc.to_dict.return_value = {"cyclone_id": "BOB-02-2019", "headline": "Evacuation alert"}

    mock_adv_query = MagicMock()
    mock_adv_query.stream.return_value = [mock_advisory_doc]
    mock_adv_collection = MagicMock()
    mock_adv_collection.limit.return_value = mock_adv_query

    mock_db = MagicMock()
    def col_side_effect(name):
        if name == "citizen_reports":
            return mock_collection
        if name == "advisories":
            return mock_adv_collection
        return MagicMock()
    mock_db.collection.side_effect = col_side_effect

    with patch("backend.services.firebase_service.get_firestore_client", return_value=mock_db):
        # Test write
        report_data = {
            "description": "Roof collapsed in Kendrapara",
            "state": "Odisha",
            "district": "Kendrapara",
        }
        doc_id = write_citizen_report(report_data)
        assert doc_id == "doc-report-123"
        mock_doc_ref.set.assert_called_once()

        # Test read advisories
        advisories = get_recent_advisories(limit=5)
        assert len(advisories) == 1
        assert advisories[0]["cyclone_id"] == "BOB-02-2019"


def test_subscribe_device_and_send_fcm_notification():
    """Test subscribe_device and send_fcm_notification with mocked Firestore and messaging."""
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "sub-id-abc"
    mock_sub_collection = MagicMock()
    mock_sub_collection.document.return_value = mock_doc_ref

    mock_sub_doc1 = MagicMock()
    mock_sub_doc1.to_dict.return_value = {"fcm_token": "tok_alpha", "active": True}
    mock_sub_doc2 = MagicMock()
    mock_sub_doc2.to_dict.return_value = {"fcm_token": "tok_beta", "active": True}

    mock_where_query = MagicMock()
    mock_where_query.stream.return_value = [mock_sub_doc1, mock_sub_doc2]
    mock_sub_collection.where.return_value = mock_where_query

    mock_db = MagicMock()
    mock_db.collection.return_value = mock_sub_collection

    mock_batch_resp = MagicMock()
    mock_batch_resp.success_count = 2
    mock_batch_resp.failure_count = 0

    with patch("backend.services.firebase_service.get_firestore_client", return_value=mock_db), \
         patch("backend.services.firebase_service.messaging.send_each_for_multicast", return_value=mock_batch_resp) as mock_send:
        # 1. Subscribe
        sub_id = subscribe_device("tok_alpha", "Odisha")
        assert sub_id == "sub-id-abc"
        mock_doc_ref.set.assert_called_once()

        # 2. Send notification
        result = send_fcm_notification("T-12 Cyclone Warning", "Seek concrete shelter immediately", "Odisha")
        assert result["success_count"] == 2
        assert result["tokens_targeted"] == 2
        mock_send.assert_called_once()


def test_api_auth_verify_endpoint():
    """Test POST /api/auth/verify endpoint with mocked token verification."""
    with patch("backend.api.routes.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "uid": "usr_auth_verified_1",
            "email": "collector_puri@odisha.gov.in",
            "valid": True,
        }
        resp = client.post("/api/auth/verify", json={"id_token": "sample-firebase-id-token"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["uid"] == "usr_auth_verified_1"
        assert data["email"] == "collector_puri@odisha.gov.in"

    # Test invalid token through API returns 200 with valid=False
    with patch("backend.api.routes.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "uid": "",
            "email": None,
            "valid": False,
        }
        resp_invalid = client.post("/api/auth/verify", json={"id_token": "bad-token"})
        assert resp_invalid.status_code == 200
        assert resp_invalid.json()["valid"] is False


def test_api_citizen_report_endpoint():
    """Test POST /api/citizen/report endpoint with mocked storage, multimodal AI, and firestore."""
    raw_bytes = b"sample_citizen_damage_photo_bytes"
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    mock_ai_output = {
        "severity": "CRITICAL",
        "description": "Extensive roof collapse, submerged roads, and damaged electrical transmission pylons.",
        "affected_infrastructure": ["power_lines", "roads", "housing"],
    }

    with patch("backend.api.routes.upload_citizen_photo") as mock_upload, \
         patch("backend.api.routes.analyze_damage_photo") as mock_ai, \
         patch("backend.api.routes.write_citizen_report") as mock_write:
        mock_upload.return_value = "https://storage.googleapis.com/cyclone-risk-platform-citizen-reports/CR-TEST/CR-TEST.jpg"
        mock_ai.return_value = mock_ai_output
        mock_write.return_value = "CR-TEST-DOC"

        payload = {
            "description": "High storm surge flooding sea-facing cottages and downed electric lines",
            "latitude": 19.80,
            "longitude": 85.82,
            "image_base64": b64_str,
            "state": "Odisha",
            "district": "Puri",
        }
        resp = client.post("/api/citizen/report", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["report_id"].startswith("CR-")
        assert data["damage_severity"] == "CRITICAL"
        assert "roof collapse" in data["ai_analysis"].lower()
        assert data["image_url"].startswith("https://storage.googleapis.com/")
        assert "created_at" in data

        mock_upload.assert_called_once()
        mock_ai.assert_called_once()
        mock_write.assert_called_once()


def test_api_alerts_subscribe_endpoint():
    """Test POST /api/alerts/subscribe endpoint."""
    with patch("backend.api.routes.subscribe_device") as mock_sub:
        mock_sub.return_value = "sub-uuid-7788"
        payload = {
            "fcm_token": "device_fcm_token_12345",
            "state": "West Bengal",
        }
        resp = client.post("/api/alerts/subscribe", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["subscription_id"] == "sub-uuid-7788"
        assert data["status"] == "subscribed"


def test_api_alerts_broadcast_endpoint():
    """Test POST /api/alerts/broadcast endpoint."""
    with patch("backend.api.routes.send_fcm_notification") as mock_broadcast:
        mock_broadcast.return_value = {
            "success_count": 12,
            "failure_count": 0,
            "tokens_targeted": 12,
            "message": "Sent notifications to 12/12 subscribers.",
        }
        payload = {
            "title": "Severe Cyclone Warning",
            "body": "Gale wind speed reaching 155 kmph expected over coastal Odisha.",
            "state": "Odisha",
        }
        resp = client.post("/api/alerts/broadcast", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["state"] == "Odisha"
        assert data["result"]["success_count"] == 12


def test_schema_validation():
    """Test schema validation for Auth, Citizen Report, and Alert models."""
    # Test valid schemas
    auth_req = AuthVerifyRequest(id_token="valid_token")
    assert auth_req.id_token == "valid_token"

    auth_resp = AuthVerifyResponse(uid="u1", email="a@b.com", valid=True)
    assert auth_resp.valid is True

    report_req = CitizenReportRequest(
        description="Fallen palm tree on Puri-Konark Marine Drive",
        latitude=19.82,
        longitude=85.85,
        image_base64="aGVsbG8=",
        state="Odisha",
        district="Puri",
    )
    assert report_req.latitude == 19.82

    report_resp = CitizenReportResponse(
        report_id="CR-1234",
        damage_severity="HIGH",
        ai_analysis="Substantial highway obstruction.",
        image_url="https://storage.googleapis.com/test/CR-1234.jpg",
        created_at="2026-09-21T18:00:00Z",
    )
    assert report_resp.damage_severity == "HIGH"

    sub_req = AlertSubscribeRequest(fcm_token="tok_1", state="Tamil Nadu")
    assert sub_req.state == "Tamil Nadu"

    sub_resp = AlertSubscribeResponse(subscription_id="s1", status="subscribed")
    assert sub_resp.status == "subscribed"

    notif_req = FCMNotificationRequest(title="Title", body="Body", state="Andhra Pradesh")
    assert notif_req.title == "Title"

    # Test invalid schemas raise ValidationError
    with pytest.raises(ValidationError):
        CitizenReportRequest(
            description="Incomplete without coordinates or image",
            # missing latitude, longitude, image_base64, state, district
        )

    with pytest.raises(ValidationError):
        AuthVerifyRequest()  # missing id_token
