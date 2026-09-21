"""Unit tests for parametric insurance service, dynamic exceedance scaling, and API routes."""

from backend.api.routes import (
    evaluate_insurance_contracts,
    get_insurance_contracts,
)
from backend.schemas.cyclone import InsuranceEvaluateRequest, InsuranceEvaluateResponse
from backend.services.insurance_service import (
    evaluate_all_contracts,
    evaluate_trigger,
    load_contracts,
    log_trigger_to_firestore,
)


def test_load_contracts_and_caching():
    """Tests loading contracts from data/parametric_contracts.json with caching."""
    contracts = load_contracts(force_reload=True)
    assert isinstance(contracts, list)
    assert len(contracts) >= 4

    # Verify key fields on contracts
    contract_ids = [c["contract_id"] for c in contracts]
    assert "PC-OD-001" in contract_ids
    assert "PC-WB-002" in contract_ids
    assert "PC-AP-003" in contract_ids
    assert "PC-TN-004" in contract_ids

    # Verify cached return identity
    cached_contracts = load_contracts()
    assert cached_contracts is contracts


def test_evaluate_trigger_storm_surge():
    """Tests STORM_SURGE trigger conditions: TRIGGER_ACTIVE, APPROACHING, and BELOW_THRESHOLD."""
    contract = {
        "contract_id": "PC-OD-001",
        "state": "Odisha",
        "districts": ["Puri"],
        "insured_population": 850000,
        "coverage_type": "STORM_SURGE",
        "trigger_threshold": {"metric": "surge_height_m", "operator": ">=", "value": 1.5},
        "payout_per_household_inr": 15000,
        "max_payout_inr": 12750000000,
    }

    # Case 1: Trigger Active (surge = 2.2m, exceedance_ratio = 1.467 >= 1.2)
    res_active = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 2.2})
    assert res_active["trigger_met"] is True
    assert res_active["status"] == "TRIGGER_ACTIVE"
    assert res_active["current_value"] == 2.2
    assert res_active["payout_estimate_inr"] > 0
    assert res_active["households_affected"] > 0

    # Case 2: Approaching (surge = 1.6m, exceedance_ratio = 1.067 < 1.2)
    res_approaching = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 1.6})
    assert res_approaching["trigger_met"] is False
    assert res_approaching["status"] == "APPROACHING"
    assert res_approaching["current_value"] == 1.6
    assert res_approaching["payout_estimate_inr"] > 0

    # Case 3: Below Threshold (surge = 1.3m <= 1.5m)
    res_below = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 1.3})
    assert res_below["trigger_met"] is False
    assert res_below["status"] == "BELOW_THRESHOLD"
    assert res_below["payout_estimate_inr"] == 0.0
    assert res_below["households_affected"] == 0


def test_evaluate_trigger_wind_speed():
    """Tests WIND_SPEED trigger conditions."""
    contract = {
        "contract_id": "PC-WB-002",
        "state": "West Bengal",
        "districts": ["South 24 Parganas"],
        "insured_population": 1200000,
        "coverage_type": "WIND_SPEED",
        "trigger_threshold": {"metric": "wind_speed_kmph", "operator": ">=", "value": 100},
        "payout_per_household_inr": 12000,
        "max_payout_inr": 14400000000,
    }

    # Trigger Active (exceedance_ratio = 1.35 >= 1.2)
    res_active = evaluate_trigger(contract, storm_data={"wind_kmph": 135.0})
    assert res_active["trigger_met"] is True
    assert res_active["status"] == "TRIGGER_ACTIVE"
    assert res_active["current_value"] == 135.0

    # Approaching (110 / 100 = 1.10 < 1.2)
    res_approaching = evaluate_trigger(contract, storm_data={"wind_kmph": 110.0})
    assert res_approaching["trigger_met"] is False
    assert res_approaching["status"] == "APPROACHING"

    # Below Threshold (85.0 <= 100)
    res_below = evaluate_trigger(contract, storm_data={"wind_kmph": 85.0})
    assert res_below["trigger_met"] is False
    assert res_below["status"] == "BELOW_THRESHOLD"
    assert res_below["payout_estimate_inr"] == 0.0


def test_evaluate_trigger_rainfall():
    """Tests RAINFALL trigger conditions."""
    contract = {
        "contract_id": "PC-TN-004",
        "state": "Tamil Nadu",
        "districts": ["Chennai"],
        "insured_population": 410000,
        "coverage_type": "RAINFALL",
        "trigger_threshold": {"metric": "rainfall_24h_mm", "operator": ">=", "value": 150},
        "payout_per_household_inr": 10000,
        "max_payout_inr": 4100000000,
    }

    # Trigger Active (195 / 150 = 1.30 >= 1.2)
    res_active = evaluate_trigger(contract, storm_data={}, district_data={"rainfall_24h_mm": 195.0})
    assert res_active["trigger_met"] is True
    assert res_active["status"] == "TRIGGER_ACTIVE"
    assert res_active["current_value"] == 195.0

    # Approaching (165 / 150 = 1.10 < 1.2)
    res_approaching = evaluate_trigger(contract, storm_data={}, district_data={"rainfall_24h_mm": 165.0})
    assert res_approaching["trigger_met"] is False
    assert res_approaching["status"] == "APPROACHING"

    # Below Threshold (125.0 <= 150)
    res_below = evaluate_trigger(contract, storm_data={}, district_data={"rainfall_24h_mm": 125.0})
    assert res_below["trigger_met"] is False
    assert res_below["status"] == "BELOW_THRESHOLD"
    assert res_below["payout_estimate_inr"] == 0.0


def test_evaluate_trigger_composite():
    """Tests COMPOSITE risk scoring trigger conditions."""
    contract = {
        "contract_id": "PC-AP-003",
        "state": "Andhra Pradesh",
        "districts": ["Visakhapatnam"],
        "insured_population": 620000,
        "coverage_type": "COMPOSITE",
        "trigger_threshold": {"metric": "composite_risk", "operator": ">=", "value": 0.75},
        "payout_per_household_inr": 18000,
        "max_payout_inr": 11160000000,
    }

    # Trigger Active (0.95 / 0.75 = 1.267 >= 1.2)
    res_active = evaluate_trigger(contract, storm_data={}, district_data={"composite_risk": 0.95})
    assert res_active["trigger_met"] is True
    assert res_active["status"] == "TRIGGER_ACTIVE"
    assert res_active["current_value"] == 0.95

    # Approaching (0.82 / 0.75 = 1.093 < 1.2)
    res_approaching = evaluate_trigger(contract, storm_data={}, district_data={"composite_risk": 0.82})
    assert res_approaching["trigger_met"] is False
    assert res_approaching["status"] == "APPROACHING"

    # Below Threshold (0.65 <= 0.75)
    res_below = evaluate_trigger(contract, storm_data={}, district_data={"composite_risk": 0.65})
    assert res_below["trigger_met"] is False
    assert res_below["status"] == "BELOW_THRESHOLD"
    assert res_below["payout_estimate_inr"] == 0.0


def test_intensity_scaling_and_determinism():
    """Asserts that larger storm intensity yields larger payout, below threshold is 0, and output is deterministic."""
    contract = {
        "contract_id": "PC-OD-001",
        "state": "Odisha",
        "districts": ["Puri"],
        "insured_population": 850000,
        "coverage_type": "STORM_SURGE",
        "trigger_threshold": {"metric": "surge_height_m", "operator": ">=", "value": 1.5},
        "payout_per_household_inr": 15000,
        "max_payout_inr": 12750000000,
    }

    # 1. Storm with surge 3.0m produces LARGER payout than surge 1.6m
    res_severe = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 3.0})
    res_weak = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 1.6})
    assert res_severe["payout_estimate_inr"] > res_weak["payout_estimate_inr"]
    assert res_severe["households_affected"] > res_weak["households_affected"]

    # 2. Storm below threshold produces INR 0
    res_below = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 1.4})
    assert res_below["payout_estimate_inr"] == 0.0
    assert res_below["households_affected"] == 0
    assert res_below["status"] == "BELOW_THRESHOLD"

    # 3. Same storm evaluated twice produces identical results (deterministic)
    res_run1 = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 2.5})
    res_run2 = evaluate_trigger(contract, storm_data={}, district_data={"max_surge_m": 2.5})
    assert res_run1 == res_run2


def test_evaluate_all_contracts():
    """Tests evaluating all contracts with simulated storm metrics."""
    storm_data = {
        "cyclone_id": "BOB-02-2019",
        "wind_kmph": 215.0,
        "district_metrics": {
            "Puri": {"max_surge_m": 2.8, "wind_kmph": 215.0, "composite_risk": 0.88, "rainfall_24h_mm": 180.0},
            "South 24 Parganas": {"max_surge_m": 1.2, "wind_kmph": 115.0, "composite_risk": 0.72, "rainfall_24h_mm": 90.0},
            "Visakhapatnam": {"max_surge_m": 0.8, "wind_kmph": 75.0, "composite_risk": 0.58, "rainfall_24h_mm": 40.0},
            "Chennai": {"max_surge_m": 0.3, "wind_kmph": 45.0, "composite_risk": 0.30, "rainfall_24h_mm": 25.0},
        },
    }

    results = evaluate_all_contracts(storm_data)
    assert len(results) >= 4
    for r in results:
        assert "contract_id" in r
        assert "state" in r
        assert "districts" in r
        assert "trigger_met" in r
        assert "current_value" in r
        assert "threshold" in r
        assert "payout_estimate_inr" in r
        assert "households_affected" in r
        assert r["status"] in ("TRIGGER_ACTIVE", "APPROACHING", "BELOW_THRESHOLD")


def test_log_trigger_to_firestore_resilience():
    """Tests writing trigger record to Firestore or falling back gracefully without crash."""
    trigger_record = {
        "contract_id": "PC-OD-001",
        "state": "Odisha",
        "trigger_met": True,
        "status": "TRIGGER_ACTIVE",
        "current_value": 2.8,
        "threshold": 1.5,
        "payout_estimate_inr": 2813500000.0,
    }
    event_id = log_trigger_to_firestore(trigger_record)
    assert isinstance(event_id, str)
    assert len(event_id) > 0


def test_api_get_insurance_contracts():
    """Tests GET /api/insurance/contracts endpoint."""
    contracts = get_insurance_contracts()
    assert isinstance(contracts, list)
    assert len(contracts) >= 4


def test_api_evaluate_insurance_contracts_fani_vs_amphan():
    """Tests POST /api/insurance/evaluate endpoint for Fani vs Amphan produces different payouts."""
    req_fani = InsuranceEvaluateRequest(cyclone_id="BOB-02-2019")
    resp_fani = evaluate_insurance_contracts(req_fani)

    req_amphan = InsuranceEvaluateRequest(cyclone_id="BOB-01-2020")
    resp_amphan = evaluate_insurance_contracts(req_amphan)

    assert isinstance(resp_fani, InsuranceEvaluateResponse)
    assert isinstance(resp_amphan, InsuranceEvaluateResponse)

    # Both should evaluate contracts
    assert resp_fani.total_contracts >= 4
    assert resp_amphan.total_contracts >= 4

    # Fani and Amphan MUST produce different payout totals because of different intensities
    assert resp_fani.total_payout_inr != resp_amphan.total_payout_inr
    assert resp_amphan.total_payout_inr > resp_fani.total_payout_inr


def test_compute_uncertainty_buffer_and_response_integration():
    """Tests uncertainty buffer calculation and presence in InsuranceEvaluateResponse."""
    from backend.services.insurance_service import compute_uncertainty_buffer

    # Fani agreement < 100 km -> HIGH confidence
    unc_fani = compute_uncertainty_buffer("BOB-02-2019")
    assert unc_fani["trigger_confidence"] == "HIGH"
    assert unc_fani["trigger_buffer_pct"] == 0.05
    assert unc_fani["model_agreement_km"] == 20.6

    # Unknown storm -> confidence derived from RMSE
    unc_unknown = compute_uncertainty_buffer("UNKNOWN-STORM")
    assert unc_unknown["model_agreement_km"] is None
    assert unc_unknown["trigger_confidence"] in ("MEDIUM", "LOW")

    # API response includes uncertainty assessment
    req = InsuranceEvaluateRequest(cyclone_id="BOB-02-2019")
    resp = evaluate_insurance_contracts(req)
    assert resp.uncertainty_assessment is not None
    assert resp.uncertainty_assessment.trigger_confidence == "HIGH"
    assert resp.uncertainty_assessment.trigger_buffer_pct == 0.05
    assert resp.uncertainty_assessment.model_agreement_km == 20.6
