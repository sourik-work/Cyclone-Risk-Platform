"""Infrastructure triage service — ranks assets by operational criticality in a storm scenario.

Combines: exposure severity x asset criticality x cascade potential.
Higher score = higher priority for pre-landfall operational intervention.
"""

import math
from typing import Any, Dict, List, Optional


def compute_triage_score(asset: Dict[str, Any], storm_data: Dict[str, Any], distance_to_forecast_km: float) -> float:
    """Returns 0-100 triage criticality score. Higher = higher priority for pre-landfall action.

    Factors:
    - Exposure: distance to forecast track/cone (closer = higher)
    - Criticality: asset-level criticality flag (HIGH/MEDIUM/LOW)
    - Type: asset role (hospitals/shelters > substations > arterial roads)
    - Vulnerability amplifier: no generator, close coastal proximity
    """
    # Exposure: inverse distance decay (0 at 200km, 1.0 at 0km)
    exposure_score = max(0.0, 1.0 - (distance_to_forecast_km / 200.0))

    # Criticality weight
    crit_weights = {"HIGH": 1.0, "MEDIUM": 0.6, "LOW": 0.3}
    raw_crit = str(asset.get("criticality") or "MEDIUM").upper()
    crit_score = crit_weights.get(raw_crit, 0.5)

    # Asset type weight — hospitals/shelters > substations > roads
    type_weights = {
        "MEDICAL_COLLEGE": 1.0,
        "DISTRICT_HOSPITAL": 0.9,
        "CYCLONE_SHELTER": 0.85,
        "PHC": 0.7,
        "HOSPITAL": 0.85,
        "SUBSTATION": 0.6,
        "TRANSMISSION_LINE": 0.5,
        "ARTERIAL_ROAD": 0.5,
    }
    raw_type = str(asset.get("asset_type") or asset.get("facility_type") or "").upper()
    type_score = type_weights.get(raw_type, 0.5)

    # Vulnerability amplifier — generator status, coastal proximity
    amplifier = 1.0
    if asset.get("has_generator") is False:
        amplifier += 0.3  # no backup power = higher triage priority
    coastal_dist = asset.get("distance_from_coast_km")
    if coastal_dist is not None and coastal_dist < 5.0:
        amplifier += 0.2  # direct coastal inundation exposure

    score = (exposure_score * 40.0) + (crit_score * 30.0) + (type_score * 20.0) + (amplifier * 10.0)
    return min(100.0, round(score, 1))


def _haversine_to_forecast(lat: float, lon: float, storm_data: Dict[str, Any]) -> float:
    """Calculates distance in km to the nearest forecast point or storm center."""
    track_points = storm_data.get("track_points") or []
    if track_points:
        min_dist = float("inf")
        for pt in track_points:
            p_lat = pt.get("latitude") if isinstance(pt, dict) else getattr(pt, "latitude", None)
            p_lon = pt.get("longitude") if isinstance(pt, dict) else getattr(pt, "longitude", None)
            if p_lat is not None and p_lon is not None:
                dlat = (lat - p_lat) * 111.0
                dlon = (lon - p_lon) * 111.0 * math.cos(math.radians(p_lat))
                d = math.sqrt(dlat**2 + dlon**2)
                if d < min_dist:
                    min_dist = d
        if min_dist != float("inf"):
            return min_dist

    # Center-point fallback
    center_lat = float(storm_data.get("latitude", 20.0))
    center_lon = float(storm_data.get("longitude", 86.0))
    dlat = (lat - center_lat) * 111.0
    dlon = (lon - center_lon) * 111.0 * math.cos(math.radians(center_lat))
    return math.sqrt(dlat**2 + dlon**2)


def rank_assets_for_action(
    storm_data: Dict[str, Any],
    infrastructure_data: List[Dict[str, Any]],
    top_n: int = 10,
) -> List[Dict[str, Any]]:
    """Ranks all infrastructure assets by triage score and returns top N with actionable reasoning."""
    ranked = []
    for asset_raw in infrastructure_data:
        props = asset_raw.get("properties", asset_raw)
        lat = props.get("latitude")
        lon = props.get("longitude")

        # Fallback to GeoJSON geometry coordinates
        if (lat is None or lon is None) and "geometry" in asset_raw:
            coords = asset_raw["geometry"].get("coordinates", [])
            while coords and isinstance(coords, list) and isinstance(coords[0], (list, tuple)):
                coords = coords[0]
            if coords and isinstance(coords, (list, tuple)) and len(coords) >= 2:
                try:
                    lon, lat = float(coords[0]), float(coords[1])
                except (ValueError, TypeError):
                    lat, lon = None, None

        if lat is None or lon is None:
            continue

        try:
            lat, lon = float(lat), float(lon)
        except (ValueError, TypeError):
            continue

        asset = {**props, "latitude": lat, "longitude": lon}
        distance_km = _haversine_to_forecast(lat, lon, storm_data)
        score = compute_triage_score(asset, storm_data, distance_km)

        # Build actionable reason string
        reasons = []
        if distance_km < 50:
            reasons.append(f"Within {distance_km:.0f}km of forecast track")
        if asset.get("has_generator") is False:
            reasons.append("No backup generator")
        if (asset.get("distance_from_coast_km") or 100) < 5:
            reasons.append("Coastal exposure <5km")
        if asset.get("bed_capacity") and asset["bed_capacity"] > 300:
            reasons.append(f"Serves {asset['bed_capacity']} beds")

        ranked.append({
            "asset_id": asset.get("asset_id") or asset.get("facility_id") or "UNKNOWN",
            "name": asset.get("name") or "Critical Infrastructure Facility",
            "type": asset.get("asset_type") or asset.get("facility_type") or "FACILITY",
            "district": asset.get("district"),
            "state": asset.get("state"),
            "triage_score": score,
            "distance_to_forecast_km": round(distance_km, 1),
            "reason": " · ".join(reasons) if reasons else "Standard monitoring",
        })

    ranked.sort(key=lambda x: x["triage_score"], reverse=True)
    return ranked[:top_n]
