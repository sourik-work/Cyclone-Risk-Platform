"""Infrastructure service for loading, caching, and filtering coastal critical infrastructure.

Loads power grid (substations, transmission lines), arterial roads, and
hospitals/cyclone shelters across Odisha, West Bengal, Andhra Pradesh, and Tamil Nadu.
Provides in-memory caching and flexible filtering by state and asset type.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Base path to data/infrastructure directory
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "infrastructure"

# In-memory cached GeoJSON feature collections
_CACHED_FEATURES: Optional[List[Dict[str, Any]]] = None


def _load_all_from_disk() -> List[Dict[str, Any]]:
    """Reads all infrastructure GeoJSON files from disk and returns combined features."""
    all_features: List[Dict[str, Any]] = []

    files = [
        DATA_DIR / "power_grid_4states.geojson",
        DATA_DIR / "arterial_roads_4states.geojson",
        DATA_DIR / "hospitals_shelters_4states.geojson",
        DATA_DIR / "infrastructure_western_ut.geojson",
    ]

    for file_path in files:
        if not file_path.exists():
            logger.warning(f"Infrastructure file not found: {file_path}")
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)
                features = geojson_data.get("features", [])
                all_features.extend(features)
        except Exception as exc:
            logger.error(f"Error reading {file_path}: {exc}")

    logger.info(f"Loaded {len(all_features)} total infrastructure features into cache.")
    return all_features


def clear_cache() -> None:
    """Clears the in-memory cache (primarily for tests)."""
    global _CACHED_FEATURES
    _CACHED_FEATURES = None


def load_infrastructure(
    asset_type: Optional[str] = None,
    state: Optional[str] = None,
    country: str = "india",
) -> Dict[str, Any]:
    """Loads and filters infrastructure features with in-memory caching.

    Args:
        asset_type: Optional filter (e.g. 'SUBSTATION', 'TRANSMISSION_LINE',
                    'ARTERIAL_ROAD', 'HOSPITAL', 'PHC', 'MEDICAL_COLLEGE',
                    'CYCLONE_SHELTER').
        state: Optional state name filter (e.g. 'Odisha', 'West Bengal',
               'Andhra Pradesh', 'Tamil Nadu').
        country: Optional country name ('india' or 'bangladesh'). Defaults to 'india'.

    Returns:
        GeoJSON FeatureCollection dict with filtered features.
    """
    global _CACHED_FEATURES
    if _CACHED_FEATURES is None:
        _CACHED_FEATURES = _load_all_from_disk()

    filtered = _CACHED_FEATURES

    # 1. Country Filter (case-insensitive)
    if country and country.strip().lower() == "bangladesh":
        filtered = [
            f for f in filtered
            if (f.get("properties", {}).get("country") or "").lower() == "bangladesh"
        ]

    # 2. State Filter (case-insensitive)
    if state and state.strip() and state.strip().lower() != "all":
        state_query = state.strip().lower()
        filtered = [
            f for f in filtered
            if _matches_state(f.get("properties", {}), state_query)
        ]

    # 3. Asset Type Filter (case-insensitive)
    if asset_type and asset_type.strip() and asset_type.strip().lower() != "all":
        type_query = asset_type.strip().upper()
        filtered = [
            f for f in filtered
            if _matches_type(f.get("properties", {}), type_query)
        ]

    return {
        "type": "FeatureCollection",
        "name": "coastal_infrastructure",
        "features": filtered,
    }


def _matches_state(props: Dict[str, Any], query: str) -> bool:
    """Checks if feature properties match the queried state."""
    state = props.get("state") or props.get("state_name") or ""
    if query in state.lower():
        return True
    # For roads that list multiple districts or state
    districts = props.get("districts_served", [])
    if isinstance(districts, list):
        for d in districts:
            if query in d.lower():
                return True
    return False


def _matches_type(props: Dict[str, Any], query: str) -> bool:
    """Checks if feature properties match the queried asset type."""
    asset_type = (props.get("asset_type") or "").upper()
    facility_type = (props.get("facility_type") or "").upper()
    road_class = (props.get("road_class") or "").upper()

    # Exact checks
    if query in (asset_type, facility_type, road_class):
        return True

    # Grouped / category aliases
    if query in ("HOSPITAL", "HOSPITALS"):
        return facility_type in ("DISTRICT_HOSPITAL", "MEDICAL_COLLEGE", "PHC")

    if query in ("SHELTER", "SHELTERS", "CYCLONE_SHELTER"):
        return facility_type == "CYCLONE_SHELTER"

    if query in ("ROAD", "ROADS", "ARTERIAL_ROAD"):
        return bool(road_class) or asset_type == "ARTERIAL_ROAD"

    if query in ("POWER", "POWER_GRID", "GRID"):
        return asset_type in ("SUBSTATION", "TRANSMISSION_LINE")

    if query == "SUBSTATION":
        return asset_type == "SUBSTATION"

    if query == "TRANSMISSION_LINE":
        return asset_type == "TRANSMISSION_LINE"

    if query == "MEDICAL_COLLEGE":
        return facility_type == "MEDICAL_COLLEGE"

    if query in ("PHC", "PRIMARY_HEALTH_CENTRE"):
        return facility_type == "PHC"

    return False
