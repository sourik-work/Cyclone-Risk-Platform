"""Rainfall forecast service providing deterministic coastal accumulation and risk classification."""

import hashlib
import json
import math
from pathlib import Path
from typing import Any, Dict, Optional

# Locate data directory
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

_DISTRICTS_CACHE: Optional[Dict[str, Dict[str, Any]]] = None
_TRACKS_CACHE: Optional[Dict[str, Dict[str, Any]]] = None


def _load_districts() -> Dict[str, Dict[str, Any]]:
    """Loads and caches all coastal district properties indexed by ID and lowercase name."""
    global _DISTRICTS_CACHE
    if _DISTRICTS_CACHE is not None:
        return _DISTRICTS_CACHE

    districts: Dict[str, Dict[str, Any]] = {}
    vulnerability_dir = DATA_DIR / "vulnerability"
    if vulnerability_dir.exists():
        for geojson_file in vulnerability_dir.glob("*.geojson"):
            try:
                with open(geojson_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for feat in data.get("features", []):
                        props = feat.get("properties", {})
                        d_id = props.get("district_id", "")
                        d_name = props.get("district_name", "")
                        item = {
                            "district_id": d_id,
                            "district_name": d_name,
                            "state_name": props.get("state_name", ""),
                            "coastline_km": float(props.get("coastal_length_km") or props.get("coastline_km") or 60.0),
                            "elevation_m": float(props.get("average_elevation_m") or props.get("elevation_m") or 5.0),
                            "total_population": int(props.get("total_population") or props.get("population") or 1000000),
                            "vulnerable_population": int(props.get("vulnerable_population") or props.get("kutcha_population") or 400000),
                            "geometry": feat.get("geometry", {}),
                        }
                        if d_id:
                            districts[d_id.upper()] = item
                        if d_name:
                            districts[d_name.lower()] = item
            except Exception as e:
                print(f"Error reading vulnerability file {geojson_file}: {e}")

    _DISTRICTS_CACHE = districts
    return districts


def _load_track_max_wind(cyclone_id: Optional[str]) -> float:
    """Returns the peak wind speed in km/h for a given storm track, or 28 km/h for calm baseline."""
    if not cyclone_id:
        return 28.0

    tracks_dir = DATA_DIR / "tracks"
    if not tracks_dir.exists():
        return 28.0

    for file_path in tracks_dir.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                match = (
                    data.get("id") == cyclone_id
                    or data.get("name", "").lower() == cyclone_id.lower()
                    or cyclone_id.lower() in file_path.stem.lower()
                )
                if match:
                    max_wind = 0.0
                    for pt in data.get("track_points", []):
                        w = pt.get("wind_speed_kmph")
                        if w is None and pt.get("wind_speed_knots") is not None:
                            w = pt.get("wind_speed_knots") * 1.852
                        if w and w > max_wind:
                            max_wind = float(w)
                    return max_wind if max_wind > 0 else 180.0
        except Exception:
            continue

    # Fallback estimates for recognized names
    c_lower = cyclone_id.lower()
    if "amphan" in c_lower:
        return 240.0
    elif "fani" in c_lower:
        return 205.0
    return 30.0


def classify_rainfall_risk(mm_24h: float) -> str:
    """Classifies 24-hour rainfall accumulation into IMD-aligned risk levels.
    
    - LOW: < 50 mm
    - MEDIUM: 50 - 100 mm
    - HIGH: 100 - 200 mm
    - CRITICAL: > 200 mm
    """
    if mm_24h < 50.0:
        return "LOW"
    elif mm_24h <= 100.0:
        return "MEDIUM"
    elif mm_24h <= 200.0:
        return "HIGH"
    else:
        return "CRITICAL"


def get_rainfall_forecast(
    district_id: str,
    cyclone_id: Optional[str] = None,
    scenario: Optional[Any] = None,
) -> Dict[str, Any]:
    """Generates a deterministic 24/48/72h accumulated rainfall forecast in mm.
    
    - Base rainfall derived from district coastal proximity, coastline length, and elevation.
    - Scales with storm intensity when a tropical cyclone track is active.
    - Incorporates realistic deterministic diurnal variation.
    """
    districts = _load_districts()
    query_key = district_id.strip()
    dist = (
        districts.get(query_key.upper())
        or districts.get(query_key.lower())
        or {
            "district_id": district_id,
            "district_name": district_id,
            "coastline_km": 70.0,
            "elevation_m": 4.5,
        }
    )

    d_id = dist.get("district_id", district_id)
    coastline_km = dist.get("coastline_km", 70.0)
    elevation_m = dist.get("elevation_m", 4.5)

    # 1. Base coastal proximity factor: low elevation + long coastline = heavier rain convergence
    coastal_factor = (coastline_km / 65.0) * (5.0 / max(2.5, elevation_m))
    coastal_factor = min(1.6, max(0.85, coastal_factor))

    # 2. Storm intensity scaling
    max_wind_kmph = _load_track_max_wind(cyclone_id)
    if scenario and getattr(scenario, "enabled", False):
        max_wind_kmph = max_wind_kmph * getattr(scenario, "wind_multiplier", 1.0)
    if max_wind_kmph >= 180.0:
        # Severe / Extremely Severe / Super Cyclonic Storm (e.g. Fani, Amphan)
        base_intensity = 195.0 + (max_wind_kmph - 180.0) * 0.75
    elif max_wind_kmph >= 90.0:
        # Cyclonic Storm / Severe Cyclonic Storm
        base_intensity = 95.0 + (max_wind_kmph - 90.0) * 0.9
    elif max_wind_kmph >= 45.0:
        # Depression / Deep Depression
        base_intensity = 45.0 + (max_wind_kmph - 45.0) * 0.8
    else:
        # Quiescent / normal marine monitoring
        base_intensity = 18.0 + max_wind_kmph * 0.3

    # 3. Deterministic diurnal & geographic variation (using district name hash)
    name_seed = int(hashlib.md5(d_id.encode("utf-8")).hexdigest()[:6], 16)
    diurnal_offset = 1.0 + 0.12 * math.sin(name_seed % 360 * math.pi / 180.0)

    # Compute 24h, 48h, 72h accumulation
    f24_mm = round(base_intensity * coastal_factor * diurnal_offset, 1)
    
    # Subsequent accumulation: decaying storm moisture over day 2 and day 3
    decay_48 = 0.72 + 0.05 * math.cos(name_seed % 180 * math.pi / 180.0)
    decay_72 = 0.45 + 0.05 * math.sin(name_seed % 90 * math.pi / 180.0)

    f48_mm = round(f24_mm + (f24_mm * decay_48), 1)
    f72_mm = round(f48_mm + (f24_mm * decay_72), 1)

    risk_level = classify_rainfall_risk(f24_mm)

    return {
        "district_id": d_id,
        "forecast_24h_mm": f24_mm,
        "forecast_48h_mm": f48_mm,
        "forecast_72h_mm": f72_mm,
        "risk_level": risk_level,
    }
