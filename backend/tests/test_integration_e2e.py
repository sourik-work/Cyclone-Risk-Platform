"""End-to-end integration tests for full operational workflows and insurance pipelines."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.forecast_service import predict_track
from backend.services.insurance_service import evaluate_trigger, evaluate_all_contracts
from backend.services.dispatch_service import LastMileDispatchService
from backend.services.audit_service import AUDIT_SERVICE

client = TestClient(app)


def test_e2e_forecasting_to_insurance_to_dispatch_pipeline():
    """E2E Test: Cyclone warning ingestion -> Track forecast -> Advisory creation -> Approval -> Dispatch -> Audit."""
    # 1. Generate Track Forecast
    history = [
        {"lat": 17.5, "lon": 84.0, "wind_kmph": 140.0, "pressure_hpa": 965.0},
        {"lat": 18.2, "lon": 84.8, "wind_kmph": 165.0, "pressure_hpa": 950.0},
        {"lat": 18.9, "lon": 85.3, "wind_kmph": 190.0, "pressure_hpa": 938.0},
        {"lat": 19.4, "lon": 85.8, "wind_kmph": 215.0, "pressure_hpa": 926.0},
    ]
    forecast_points = predict_track(history)
    assert len(forecast_points) >= 8
    assert forecast_points[0]["lat"] > 17.0

    # 2. Evaluate Parametric Insurance Trigger
    contract = {
        "contract_id": "INS-OD-001",
        "state": "Odisha",
        "insured_party": "Puri Coastal Community & Fisherfolk Welfare Pool",
        "coverage_type": "WIND_SPEED",
        "max_payout_inr": 1000000000,
        "insured_population": 450000,
        "payout_per_household_inr": 25000,
        "trigger_threshold": {"value": 150.0},
        "k_state": 0.12,
        "cap_state": 0.55,
        "calibration_provenance": {
            "calibration_source": "Kerala SDMA 2026",
            "k_state": 0.12,
            "cap_state": 0.55,
        },
    }
    storm_data = {"wind_kmph": 215.0, "max_surge_m": 2.5, "rainfall_24h_mm": 250.0}
    ins_eval = evaluate_trigger(contract, storm_data)
    assert ins_eval["trigger_met"] is True
    assert ins_eval["payout_estimate_inr"] > 0
    assert ins_eval["payout_estimate_inr"] <= 1000000000

    # 3. Create Draft Advisory & Operator Approval Gate
    adv_id = "ADV-E2E-FANI-01"
    AUDIT_SERVICE.record_draft_created(
        advisory_id=adv_id,
        cyclone_id="BOB-01-2026",
    )
    
    appr_metric = AUDIT_SERVICE.record_approval(
        advisory_id=adv_id,
        operator_uid="SRC_OFFICER_ODISHA",
        operator_role="STATE_RELIEF_COMMISSIONER",
        operator_confidence=5,
        modification_required=False,
    )
    assert appr_metric.review_latency_seconds is not None
    assert appr_metric.review_latency_seconds >= 0
    assert appr_metric.status == "APPROVED"

    # 4. Multi-Channel Last-Mile Dispatch
    dispatcher = LastMileDispatchService()
    recipients = [
        {"phone": "+919876543210", "role": "DISTRICT_COLLECTOR_PURI", "enable_ivr": True},
        {"phone": "+919876543211", "role": "ODRAF_COMMANDER", "enable_ivr": False},
    ]
    dispatch_res = dispatcher.dispatch_alert(
        advisory_id=adv_id,
        approval_status=appr_metric.status,
        recipients=recipients,
        cyclone_context={"cyclone_name": "Cyclone Fani", "wind_speed": "215 km/h", "action": "Evacuate Puri & Brahmagiri to shelters."},
        operator_uid="SRC_OFFICER_ODISHA",
    )
    assert dispatch_res["sms_sent"] == 2
    assert dispatch_res["ivr_calls_initiated"] == 1
    assert dispatch_res["radio_broadcasts_queued"] >= 1

    # 5. Verify Operator Metrics & Audit Trail
    metric = AUDIT_SERVICE.get_advisory_metrics(adv_id)
    assert metric is not None
    assert metric["operator_role"] == "STATE_RELIEF_COMMISSIONER"
    assert metric["operator_confidence"] == 5


def test_e2e_insurance_sub_threshold_zero_payout():
    """E2E Test: Sub-threshold depression returns ₹0 payout without triggering audit alerts."""
    contract = {
        "contract_id": "INS-WB-001",
        "state": "West Bengal",
        "insured_party": "Sundarbans Embankment Risk Pool",
        "coverage_type": "WIND_SPEED",
        "max_payout_inr": 800000000,
        "insured_population": 300000,
        "payout_per_household_inr": 20000,
        "trigger_threshold": {"value": 130.0},
        "k_state": 0.10,
        "cap_state": 0.50,
        "calibration_provenance": {
            "calibration_source": "Nagaland DRTPS 2024",
            "k_state": 0.10,
            "cap_state": 0.50,
        },
    }
    # Weak depression with wind 65 km/h
    storm_data = {"wind_kmph": 65.0, "max_surge_m": 0.5, "rainfall_24h_mm": 40.0}
    ins_eval = evaluate_trigger(contract, storm_data)
    assert ins_eval["trigger_met"] is False
    assert ins_eval["payout_estimate_inr"] == 0.0
    assert ins_eval["status"] == "BELOW_THRESHOLD"
