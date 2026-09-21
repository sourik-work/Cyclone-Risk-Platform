"""Parametric insurance liquidity evaluation service for coastal cyclone risk pools."""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_CONTRACTS_CACHE: Optional[List[Dict[str, Any]]] = None


def load_contracts(force_reload: bool = False) -> List[Dict[str, Any]]:
    """Loads parametric contracts from data/parametric_contracts.json with in-memory caching."""
    global _CONTRACTS_CACHE
    if _CONTRACTS_CACHE is not None and not force_reload:
        return _CONTRACTS_CACHE

    root_dir = Path(__file__).resolve().parent.parent.parent
    file_path = root_dir / "data" / "parametric_contracts.json"
    if not file_path.exists():
        logger.warning(f"Parametric contracts file not found at {file_path}")
        _CONTRACTS_CACHE = []
        return _CONTRACTS_CACHE

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            _CONTRACTS_CACHE = data.get("contracts", [])
            return _CONTRACTS_CACHE
    except Exception as e:
        logger.error(f"Error reading parametric contracts: {e}")
        return []


def evaluate_trigger(
    contract: Dict[str, Any],
    storm_data: Dict[str, Any],
    district_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Evaluates a single parametric insurance contract against storm and district metrics.

    Trigger metrics:
    - STORM_SURGE: compare max_surge_m against threshold
    - WIND_SPEED: compare wind_speed_kmph against threshold
    - RAINFALL: compare rainfall_24h_mm against threshold
    - COMPOSITE: compare composite_risk or vulnerability_score against threshold
    """
    coverage_type = str(contract.get("coverage_type", "COMPOSITE")).upper()
    threshold_info = contract.get("trigger_threshold", {})
    threshold = float(threshold_info.get("value", 1.0))
    operator = threshold_info.get("operator", ">=")

    district_ctx = district_data or {}
    current_value = 0.0

    if coverage_type == "STORM_SURGE":
        # Check district surge, fallback to storm surge or surge summary
        current_value = float(
            district_ctx.get("max_surge_m")
            or district_ctx.get("surge_height_m")
            or storm_data.get("max_surge_m")
            or storm_data.get("surge_height_m")
            or (storm_data.get("surge", {}).get("max_surge_m") if isinstance(storm_data.get("surge"), dict) else 0.0)
            or 0.0
        )
    elif coverage_type == "WIND_SPEED":
        # Check district wind, fallback to storm peak wind
        current_value = float(
            district_ctx.get("wind_kmph")
            or district_ctx.get("wind_speed_kmph")
            or storm_data.get("wind_kmph")
            or storm_data.get("wind_speed_kmph")
            or storm_data.get("max_expected_wind_kmph")
            or 0.0
        )
    elif coverage_type == "RAINFALL":
        # Check district 24h rainfall
        current_value = float(
            district_ctx.get("rainfall_24h_mm")
            or district_ctx.get("forecast_24h_mm")
            or storm_data.get("rainfall_24h_mm")
            or (storm_data.get("rainfall", {}).get("forecast_24h_mm") if isinstance(storm_data.get("rainfall"), dict) else 0.0)
            or 0.0
        )
    elif coverage_type == "COMPOSITE":
        # Check composite risk score or vulnerability score
        current_value = float(
            district_ctx.get("composite_risk")
            or district_ctx.get("cyclone_risk_score")
            or district_ctx.get("vulnerability_score")
            or storm_data.get("composite_risk")
            or storm_data.get("cyclone_risk_score")
            or 0.0
        )
    else:
        current_value = float(district_ctx.get("value", storm_data.get("value", 0.0)))

    insured_pop = int(contract.get("insured_population", 500000))
    payout_per_hh = float(contract.get("payout_per_household_inr", 12000))
    max_payout = float(contract.get("max_payout_inr", 10000000000))

    if current_value <= threshold or threshold <= 0:
        # Below trigger
        affected_households = 0
        payout = 0.0
        status = "BELOW_THRESHOLD"
    else:
        # Scale affected households with exceedance
        exceedance_ratio = current_value / threshold

        # Base affected ratio: 10% of insured pop per 1x exceedance
        # Cap at 60% (realistic max for catastrophic events)
        affected_ratio = min(exceedance_ratio * 0.10, 0.60)

        affected_households = int(insured_pop * affected_ratio)

        # Payout = households × per-household, capped at max
        payout = min(
            affected_households * payout_per_hh,
            max_payout
        )

        status = "TRIGGER_ACTIVE" if exceedance_ratio >= 1.2 else "APPROACHING"

    trigger_met = (status == "TRIGGER_ACTIVE")

    return {
        "contract_id": contract.get("contract_id", "PC-UNKNOWN"),
        "state": contract.get("state", "Unknown"),
        "districts": contract.get("districts", []),
        "trigger_met": trigger_met,
        "current_value": round(current_value, 2),
        "threshold": round(threshold, 2),
        "payout_estimate_inr": float(payout),
        "households_affected": int(affected_households),
        "status": status,
    }


def evaluate_all_contracts(storm_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Evaluates all registered parametric contracts against storm and district data."""
    contracts = load_contracts()
    districts_map = storm_data.get("district_metrics", {})
    state_metrics = storm_data.get("state_metrics", {})

    results: List[Dict[str, Any]] = []
    for c in contracts:
        contract_state = c.get("state", "")
        # Aggregate metrics for the contract's state / districts
        district_ctx = {}
        if contract_state in state_metrics:
            district_ctx.update(state_metrics[contract_state])

        # If district metrics exist for any contract district, take maximum intensity
        for d in c.get("districts", []):
            if d in districts_map:
                dm = districts_map[d]
                for k, v in dm.items():
                    if isinstance(v, (int, float)):
                        district_ctx[k] = max(district_ctx.get(k, 0.0), float(v))

        res = evaluate_trigger(c, storm_data, district_ctx)
        results.append(res)

    return results


def log_trigger_to_firestore(trigger_result: Dict[str, Any]) -> str:
    """Uses existing firebase_service to write trigger events to Firestore collection insurance_triggers."""
    try:
        from backend.services.firebase_service import get_firestore_client
        db = get_firestore_client()
        doc_ref = db.collection("insurance_triggers").document()
        record = dict(trigger_result)
        record["logged_at"] = datetime.now(timezone.utc).isoformat()
        record["event_id"] = doc_ref.id
        doc_ref.set(record)
        return doc_ref.id
    except Exception as e:
        logger.warning(f"Failed to log insurance trigger to Firestore ({e}). Using generated ID.")
        import uuid
        return f"trig-{uuid.uuid4().hex[:10]}"
