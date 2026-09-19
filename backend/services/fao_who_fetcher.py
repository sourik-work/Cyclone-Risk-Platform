"""FAO and WHO public health and food security vulnerability indicator fetcher."""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

CACHE_FILE_PATH = Path("data/external/fao_who_indicators.json")

# Default national/coastal baseline fallback indicators
DEFAULT_FOOD_SECURITY = {
    "food_insecurity_percent": 21.5,
    "undernourishment_percent": 14.0,
    "severe_food_insecurity_percent": 5.9,
    "stunting_children_percent": 30.5,
    "wasting_children_percent": 18.0,
    "dietary_diversity_score": 5.9,
    "pds_coverage_percent": 86.0
}

DEFAULT_HEALTH = {
    "infant_mortality_per_1000": 28.0,
    "under_five_mortality_per_1000": 32.5,
    "maternal_mortality_ratio": 98,
    "healthcare_access_index": 68.0,
    "institutional_births_percent": 93.0,
    "immunization_coverage_percent": 90.0,
    "doctor_patient_ratio_per_10k": 8.0,
    "disease_prevalence": {
        "malaria_api": 0.50,
        "diarrheal_disease_percent": 6.8,
        "acute_respiratory_infection_percent": 3.6,
        "waterborne_risk_level": "Moderate"
    }
}


def _load_indicators_cache() -> Dict[str, Any]:
    """Load JSON cache from disk."""
    if CACHE_FILE_PATH.exists():
        try:
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read FAO/WHO cache: {e}")
    return {}


def _save_indicators_cache(data: Dict[str, Any]) -> None:
    """Save updated indicators to disk."""
    try:
        CACHE_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Failed to save FAO/WHO cache: {e}")


def _find_state_data(state: str) -> Optional[Dict[str, Any]]:
    """Lookup state record from cache ignoring case."""
    cache = _load_indicators_cache()
    states = cache.get("states", {})
    clean = state.strip().lower()
    for s_name, s_data in states.items():
        if s_name.lower() == clean:
            return s_data
    return None


def fetch_food_security(state: str) -> Dict[str, Any]:
    """Fetch food insecurity and undernourishment metrics for a state.
    
    Args:
        state: State name (e.g. 'Odisha', 'West Bengal')
        
    Returns:
        Dict of food security metrics based on FAO SOFI reports.
    """
    clean_state = state.strip()
    state_data = _find_state_data(clean_state)
    now_iso = datetime.now(timezone.utc).isoformat()

    if state_data and "food_security" in state_data:
        fs = state_data["food_security"]
        return {
            "state": state_data.get("state", clean_state),
            "food_insecurity_percent": fs.get("food_insecurity_percent", DEFAULT_FOOD_SECURITY["food_insecurity_percent"]),
            "undernourishment_percent": fs.get("undernourishment_percent", DEFAULT_FOOD_SECURITY["undernourishment_percent"]),
            "severe_food_insecurity_percent": fs.get("severe_food_insecurity_percent", DEFAULT_FOOD_SECURITY["severe_food_insecurity_percent"]),
            "stunting_children_percent": fs.get("stunting_children_percent", DEFAULT_FOOD_SECURITY["stunting_children_percent"]),
            "wasting_children_percent": fs.get("wasting_children_percent", DEFAULT_FOOD_SECURITY["wasting_children_percent"]),
            "dietary_diversity_score": fs.get("dietary_diversity_score", DEFAULT_FOOD_SECURITY["dietary_diversity_score"]),
            "pds_coverage_percent": fs.get("pds_coverage_percent", DEFAULT_FOOD_SECURITY["pds_coverage_percent"]),
            "source": "FAO State of Food Security and Nutrition (SOFI) Profile",
            "timestamp": now_iso
        }

    return {
        "state": clean_state,
        **DEFAULT_FOOD_SECURITY,
        "source": "FAO SOFI Regional Baseline Estimate",
        "timestamp": now_iso
    }


def fetch_health_indicators(state: str) -> Dict[str, Any]:
    """Fetch healthcare access, infant mortality, and disease prevalence for a state.
    
    Args:
        state: State name (e.g. 'Odisha', 'West Bengal')
        
    Returns:
        Dict of public health metrics based on WHO and NFHS-5 reports.
    """
    clean_state = state.strip()
    state_data = _find_state_data(clean_state)
    now_iso = datetime.now(timezone.utc).isoformat()

    if state_data and "health_indicators" in state_data:
        hi = state_data["health_indicators"]
        return {
            "state": state_data.get("state", clean_state),
            "infant_mortality_per_1000": hi.get("infant_mortality_per_1000", DEFAULT_HEALTH["infant_mortality_per_1000"]),
            "under_five_mortality_per_1000": hi.get("under_five_mortality_per_1000", DEFAULT_HEALTH["under_five_mortality_per_1000"]),
            "maternal_mortality_ratio": hi.get("maternal_mortality_ratio", DEFAULT_HEALTH["maternal_mortality_ratio"]),
            "healthcare_access_index": hi.get("healthcare_access_index", DEFAULT_HEALTH["healthcare_access_index"]),
            "institutional_births_percent": hi.get("institutional_births_percent", DEFAULT_HEALTH["institutional_births_percent"]),
            "immunization_coverage_percent": hi.get("immunization_coverage_percent", DEFAULT_HEALTH["immunization_coverage_percent"]),
            "doctor_patient_ratio_per_10k": hi.get("doctor_patient_ratio_per_10k", DEFAULT_HEALTH["doctor_patient_ratio_per_10k"]),
            "disease_prevalence": hi.get("disease_prevalence", DEFAULT_HEALTH["disease_prevalence"]),
            "source": "WHO India Health Profile & NFHS-5",
            "timestamp": now_iso
        }

    return {
        "state": clean_state,
        **DEFAULT_HEALTH,
        "source": "WHO / NFHS Regional Baseline Estimate",
        "timestamp": now_iso
    }


def fetch_combined_indicators(state: str) -> Dict[str, Any]:
    """Fetch combined food security and health vulnerability indicators conforming to FAOWHOIndicators schema."""
    fs = fetch_food_security(state)
    hi = fetch_health_indicators(state)

    return {
        "state": fs["state"],
        "food_insecurity_percent": fs["food_insecurity_percent"],
        "undernourishment_percent": fs["undernourishment_percent"],
        "stunting_percent": fs.get("stunting_children_percent"),
        "infant_mortality_per_1000": hi["infant_mortality_per_1000"],
        "healthcare_access_index": hi["healthcare_access_index"],
        "disease_prevalence": hi["disease_prevalence"],
        "source": "FAO / WHO Reports & NFHS-5",
        "timestamp": fs.get("timestamp")
    }
