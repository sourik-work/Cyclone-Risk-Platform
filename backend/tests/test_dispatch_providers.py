"""Tests for last-mile delivery providers (SMS, IVR, Radio) and dispatch orchestration."""

import pytest
from backend.services.providers.sms_provider import (
    MSG91SMSProvider,
    TwilioSMSProvider,
    CompositeSMSProvider,
)
from backend.services.providers.ivr_provider import (
    ExotelIVRProvider,
    TwilioIVRProvider,
)
from backend.services.providers.radio_provider import (
    CommunityRadioProvider,
    AIRPrasarBharatiProvider,
)
from backend.services.dispatch_service import LastMileDispatchService


def test_msg91_sms_provider_mock():
    """Verify MSG91 provider correctly handles DLT template params."""
    provider = MSG91SMSProvider(mock_mode=True)
    res = provider.send(
        phone="+919876543210",
        template_id="CYC_ALERT_V1",
        params={"cyclone_name": "Fani", "wind_speed": "180 km/h", "action": "Evacuate"},
    )
    assert res["status"] == "sent"
    assert res["provider"] == "MSG91"
    assert res["dlt_compliant"] is True
    assert res["recipient"] == "919876543210"


def test_twilio_sms_provider_mock():
    """Verify Twilio provider formats international payload."""
    provider = TwilioSMSProvider(mock_mode=True)
    res = provider.send(
        phone="+919876543210",
        template_id="CYC_ALERT_V1",
        params={"cyclone_name": "Amphan", "wind_speed": "160 km/h"},
    )
    assert res["status"] == "sent"
    assert res["provider"] == "Twilio"
    assert res["recipient"] == "+919876543210"


def test_composite_sms_provider_fallback():
    """Verify composite SMS provider falls back to Twilio if primary fails."""
    class FailingSMSProvider(MSG91SMSProvider):
        def send(self, phone, template_id, params):
            return {"status": "failed", "error": "Gateway timeout", "provider": "MSG91"}

    composite = CompositeSMSProvider(primary=FailingSMSProvider(), fallback=TwilioSMSProvider(mock_mode=True))
    res = composite.send(phone="+919876543210", template_id="CYC_ALERT_V1", params={})
    assert res["status"] == "sent"
    assert res["provider"] == "Twilio"
    assert res.get("fallback_triggered") is True


def test_exotel_ivr_provider_mock():
    """Verify Exotel IVR outbound call payload and retry policy."""
    provider = ExotelIVRProvider(mock_mode=True)
    res = provider.call(
        phone="+919876543210",
        audio_url="https://example.com/audio/odia_alert.mp3",
    )
    assert res["status"] == "initiated"
    assert res["provider"] == "Exotel"
    assert res["retry_policy"]["max_retries"] == 3


def test_community_radio_broadcast_queue():
    """Verify community radio provider enqueues broadcasts with audio link and script."""
    provider = CommunityRadioProvider()
    res = provider.queue_broadcast(
        station_id="CR-OD-01",
        station_name="Radio Namaskar 90.4 FM",
        language="Odia",
        script_text="Emergency cyclone warning for Puri coast",
        audio_url="https://example.com/audio/puri_broadcast.mp3",
    )
    assert res["channel"] == "COMMUNITY_RADIO"
    assert res["status"] == "QUEUED_FOR_BROADCAST"
    assert "broadcast_id" in res
    assert len(provider.get_queue()) == 1


def test_dispatch_service_enforces_approval_gate():
    """Verify dispatch service raises an error if advisory is in draft status."""
    service = LastMileDispatchService()
    with pytest.raises(ValueError, match="must be APPROVED"):
        service.dispatch_alert(
            advisory_id="ADV-TEST-01",
            approval_status="draft",
            recipients=[{"phone": "+919876543210", "role": "DISTRICT_COLLECTOR"}],
            cyclone_context={"cyclone_name": "Fani"},
        )


def test_dispatch_service_parallel_fanout_approved():
    """Verify dispatch service fans out to SMS, IVR, and Radio when approved."""
    service = LastMileDispatchService()
    recipients = [
        {"phone": "+919876543210", "role": "DISTRICT_COLLECTOR", "enable_ivr": True},
        {"phone": "+919876543211", "role": "ODRAF_COMMANDER", "enable_ivr": False},
        {"phone": "+919876543212", "role": "DISCOM_DISPATCHER", "enable_ivr": True},
    ]
    cyclone_ctx = {
        "cyclone_name": "Cyclone Fani",
        "wind_speed": "215 km/h",
        "action": "Immediate evacuation to reinforced shelters.",
    }
    
    summary = service.dispatch_alert(
        advisory_id="ADV-ODISHA-001",
        approval_status="APPROVED",
        recipients=recipients,
        cyclone_context=cyclone_ctx,
        operator_uid="SRC_ODISHA_01",
    )
    
    assert summary["advisory_id"] == "ADV-ODISHA-001"
    assert summary["sms_sent"] == 3
    assert summary["ivr_calls_initiated"] == 2
    assert summary["radio_broadcasts_queued"] == 2
    assert len(summary["receipts"]) == 5
    assert len(service.get_receipts()) == 1
