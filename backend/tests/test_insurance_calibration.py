"""Tests for Actuarially Calibrated Parametric Insurance Service."""

import pytest
from backend.services.insurance_service import evaluate_all_contracts, evaluate_trigger, load_contracts


def test_every_contract_has_calibration_provenance():
    """Verify that every contract contains verified calibration provenance and source citations."""
    contracts = load_contracts(force_reload=True)
    assert len(contracts) >= 4

    for contract in contracts:
        prov = contract.get("calibration_provenance")
        assert prov is not None, f"Contract {contract.get('contract_id')} lacks calibration_provenance"
        assert "calibration_source" in prov
        assert "trigger_basis" in prov
        assert "last_validated" in prov
        assert "k_state" in prov
        assert "cap_state" in prov
        assert prov["k_state"] > 0
        assert prov["cap_state"] > 0
        assert contract.get("k_state") is not None
        assert contract.get("cap_state") is not None


def test_kerala_sdma_hand_computed_case():
    """Hand-computed case: Kerala SDMA parametric wind product.

    Insured pop: 350,000
    Threshold: 120 km/h wind
    k_state: 0.12, cap_state: 0.55
    Current wind: 140 km/h
    Exceedance: 140 / 120 = 1.166667
    Affected ratio: min(1.166667 * 0.12, 0.55) = 0.14
    Households: 350,000 * 0.14 = 49,000
    Payout per HH: ₹12,000
    Expected Payout: 49,000 * 12,000 = ₹588,000,000 (₹58.8 Cr)
    """
    contract = {
        "contract_id": "PC-KL-TEST",
        "state": "Kerala",
        "coverage_type": "WIND_SPEED",
        "insured_population": 350000,
        "trigger_threshold": {"value": 120},
        "k_state": 0.12,
        "cap_state": 0.55,
        "payout_per_household_inr": 12000,
        "max_payout_inr": 1000000000,
        "calibration_provenance": {
            "calibration_source": "Kerala SDMA 2026",
            "trigger_basis": "IMD wind >= 120 km/h",
            "last_validated": "2026-09-30",
            "k_state": 0.12,
            "cap_state": 0.55,
        }
    }
    storm_data = {"wind_kmph": 140.0}
    res = evaluate_trigger(contract, storm_data)

    assert res["trigger_met"] is True
    assert res["status"] == "TRIGGER_ACTIVE"
    assert res["households_affected"] == 49000
    assert res["payout_estimate_inr"] == 588000000.0
    assert res["k_state"] == 0.12
    assert res["calibration_provenance"]["calibration_source"] == "Kerala SDMA 2026"


def test_odisha_surge_hand_computed_case():
    """Hand-computed case: Odisha surge contract.

    Insured pop: 850,000
    Threshold: 1.5m surge
    k_state: 0.14, cap_state: 0.55
    Current surge: 3.0m
    Exceedance: 3.0 / 1.5 = 2.0
    Affected ratio: min(2.0 * 0.14, 0.55) = 0.28
    Households: 850,000 * 0.28 = 238,000
    Payout per HH: ₹15,000
    Theoretical Payout: 238,000 * 15,000 = ₹3,570,000,000 (₹357 Cr)
    Capped at max_payout_inr: ₹1,275,000,000 (₹127.5 Cr)
    """
    contract = {
        "contract_id": "PC-OD-TEST",
        "state": "Odisha",
        "coverage_type": "STORM_SURGE",
        "insured_population": 850000,
        "trigger_threshold": {"value": 1.5},
        "k_state": 0.14,
        "cap_state": 0.55,
        "payout_per_household_inr": 15000,
        "max_payout_inr": 1275000000,
        "calibration_provenance": {
            "calibration_source": "Odisha State Disaster Management Authority (OSDMA)",
            "trigger_basis": "Surge >= 1.5m",
            "last_validated": "2026-09-30",
            "k_state": 0.14,
            "cap_state": 0.55,
        }
    }
    storm_data = {"max_surge_m": 3.0}
    res = evaluate_trigger(contract, storm_data)

    assert res["trigger_met"] is True
    assert res["households_affected"] == 238000
    assert res["payout_estimate_inr"] == 1275000000.0  # Capped at sum insured


def test_tamil_nadu_rainfall_hand_computed_case():
    """Hand-computed case: Tamil Nadu excess rainfall product.

    Insured pop: 410,000
    Threshold: 150mm rainfall
    k_state: 0.10, cap_state: 0.40
    Current rainfall: 225mm
    Exceedance: 225 / 150 = 1.5
    Affected ratio: min(1.5 * 0.10, 0.40) = 0.15
    Households: 410,000 * 0.15 = 61,500
    Payout per HH: ₹10,000
    Expected Payout: 61,500 * 10,000 = ₹615,000,000 (₹61.5 Cr)
    Capped at max_payout_inr: ₹410,000,000 (₹41.0 Cr)
    """
    contract = {
        "contract_id": "PC-TN-TEST",
        "state": "Tamil Nadu",
        "coverage_type": "RAINFALL",
        "insured_population": 410000,
        "trigger_threshold": {"value": 150},
        "k_state": 0.10,
        "cap_state": 0.40,
        "payout_per_household_inr": 10000,
        "max_payout_inr": 410000000,
        "calibration_provenance": {
            "calibration_source": "Nagaland DRTPS 2024",
            "trigger_basis": "AWS rainfall >= 150mm",
            "last_validated": "2026-09-30",
            "k_state": 0.10,
            "cap_state": 0.40,
        }
    }
    storm_data = {"rainfall_24h_mm": 225.0}
    res = evaluate_trigger(contract, storm_data)

    assert res["trigger_met"] is True
    assert res["households_affected"] == 61500
    assert res["payout_estimate_inr"] == 410000000.0  # Capped at ₹41 Cr


def test_weak_depression_returns_strictly_zero_payout():
    """Verify that a weak depression below all trigger thresholds yields ₹0 and BELOW_THRESHOLD status."""
    weak_depression_data = {
        "cyclone_id": "BOB-TEST-DEPRESSION",
        "wind_kmph": 45.0,
        "max_surge_m": 0.4,
        "rainfall_24h_mm": 35.0,
        "composite_risk": 0.25,
    }
    evaluations = evaluate_all_contracts(weak_depression_data)
    for contract_res in evaluations:
        assert contract_res["trigger_met"] is False
        assert contract_res["status"] == "BELOW_THRESHOLD"
        assert contract_res["payout_estimate_inr"] == 0.0
        assert contract_res["households_affected"] == 0


def test_catastrophic_surge_respects_cap_state():
    """Verify that extreme events saturate at cap_state and do not exceed mathematical bounds."""
    contract = {
        "contract_id": "PC-CAP-TEST",
        "state": "Odisha",
        "coverage_type": "STORM_SURGE",
        "insured_population": 1000000,
        "trigger_threshold": {"value": 1.5},
        "k_state": 0.14,
        "cap_state": 0.55,
        "payout_per_household_inr": 10000,
        "max_payout_inr": 10000000000,
    }
    extreme_storm = {"max_surge_m": 12.0}  # Exceedance = 8.0, 8.0 * 0.14 = 1.12 -> capped at 0.55
    res = evaluate_trigger(contract, extreme_storm)

    assert res["households_affected"] == 550000  # Exactly 55% cap of 1,000,000
    assert res["payout_estimate_inr"] == 5500000000.0
