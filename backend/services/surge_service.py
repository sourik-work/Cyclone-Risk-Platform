"""Storm surge modeling service providing hydrodynamic surge height and coastal inundation simulation."""

import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.services.rainfall_service import _load_districts, _load_track_max_wind

# Base path to data directory
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# Bathymetry factors by coastal state (continental shelf width & slope)
BATHYMETRY_FACTORS: Dict[str, float] = {
    "west bengal": 1.55,       # Shallow shelf, funnel effect at Sundarbans
    "odisha": 1.35,            # Wide shallow shelf along Bay of Bengal
    "andhra pradesh": 1.15,     # Moderate shelf width
    "tamil nadu": 1.05,        # Steeper shelf slope
}

_INFRASTRUCTURE_CACHE: Optional[Dict[str, Any]] = None


def _load_infrastructure_data() -> Dict[str, Any]:
    """Loads and caches infrastructure features for exposure calculations."""
    global _INFRASTRUCTURE_CACHE
    if _INFRASTRUCTURE_CACHE is not None:
        return _INFRASTRUCTURE_CACHE

    infra_dir = DATA_DIR / "infrastructure"
    combined: Dict[str, List[Dict[str, Any]]] = {
        "hospitals_shelters": [],
        "power_grid": [],
        "roads": [],
    }

    if infra_dir.exists():
        files = {
            "hospitals_shelters": infra_dir / "hospitals_shelters_4states.geojson",
            "power_grid": infra_dir / "power_grid_4states.geojson",
            "roads": infra_dir / "arterial_roads_4states.geojson",
        }
        for category, path in files.items():
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        combined[category] = data.get("features", [])
                except Exception as exc:
                    print(f"Error loading {path}: {exc}")

    _INFRASTRUCTURE_CACHE = combined
    return combined


def _compute_polygon_area_km2(coords: List[List[float]]) -> float:
    """Calculates approximate surface area in square kilometers for a lat/lon polygon."""
    if len(coords) < 4:
        return 0.0
    lat_mean = sum(p[1] for p in coords) / len(coords)
    cos_lat = math.cos(math.radians(lat_mean))
    xs = [p[0] * 111.0 * cos_lat for p in coords]
    ys = [p[1] * 111.0 for p in coords]
    area = 0.0
    for i in range(len(coords) - 1):
        area += xs[i] * ys[i + 1] - xs[i + 1] * ys[i]
    return abs(area) / 2.0


def _generate_inundation_polygon(
    base_coords: List[List[float]],
    surge_height_m: float,
    buffer_km: float,
) -> Dict[str, Any]:
    """Buffers the seaward coastal boundary inland by (surge_height * 2) km.
    
    Generates a valid closed GeoJSON Polygon geometry extending inland from the coastline.
    """
    pts = base_coords[:-1] if (len(base_coords) > 1 and base_coords[0] == base_coords[-1]) else base_coords
    n = len(pts)
    if n < 3:
        # Fallback to simple envelope if insufficient coordinates
        return {
            "type": "Polygon",
            "coordinates": [base_coords],
        }

    # In all coastal district definitions, the first half of points represent the seaward coastline
    k = (n // 2) + (1 if n % 2 != 0 else 0)
    coast_pts = pts[:k]

    # District geometric centroid
    cx = sum(p[0] for p in pts) / n
    cy = sum(p[1] for p in pts) / n

    buffer_deg = buffer_km / 111.0

    inland_pts: List[List[float]] = []
    for p in reversed(coast_pts):
        dx = cx - p[0]
        dy = cy - p[1]
        dist = math.hypot(dx, dy)
        if dist > 0:
            nx = dx / dist
            ny = dy / dist
        else:
            nx, ny = 0.0, 0.0

        # Offset inward towards district interior, capped at 75% of distance to centroid
        step = min(buffer_deg, dist * 0.75)
        inland_pts.append([round(p[0] + nx * step, 5), round(p[1] + ny * step, 5)])

    # Construct closed loop: along coastline -> inland buffer line reversed -> back to start
    poly_coords = [list(p) for p in coast_pts] + inland_pts
    if poly_coords[0] != poly_coords[-1]:
        poly_coords.append(list(poly_coords[0]))

    return {
        "type": "Polygon",
        "coordinates": [poly_coords],
    }


def simulate_surge(cyclone_id: str, district_id: str, scenario: Optional[Any] = None) -> Dict[str, Any]:
    """Simulates storm surge height, inundation extent, and affected population/infrastructure.
    
    Uses the physics-lite formulation:
        surge_height = (wind_kmph / 100) * bathymetry_factor * coastal_slope_factor
    and buffers the seaward coastline by (surge_height * 2) km.
    """
    districts = _load_districts()
    query_key = district_id.strip()
    dist = (
        districts.get(query_key.upper())
        or districts.get(query_key.lower())
        or {
            "district_id": district_id,
            "district_name": district_id,
            "state_name": "Odisha",
            "coastline_km": 75.0,
            "elevation_m": 4.5,
            "total_population": 1500000,
            "vulnerable_population": 400000,
            "geometry": {
                "coordinates": [
                    [[85.12, 19.65], [85.45, 19.78], [85.83, 19.80], [86.25, 19.95],
                     [86.15, 20.15], [85.75, 20.10], [85.35, 19.90], [85.12, 19.65]]
                ]
            },
        }
    )

    d_id = dist.get("district_id", district_id)
    d_name = dist.get("district_name", district_id)
    state_name = dist.get("state_name", "Odisha")
    elevation_m = float(dist.get("elevation_m", 4.5))
    coastline_km = float(dist.get("coastline_km", 75.0))
    vulnerable_pop = int(dist.get("vulnerable_population", 400000))

    # 1. Physics-lite surge calculation
    # wind_kmph from active cyclone track or baseline
    wind_kmph = _load_track_max_wind(cyclone_id)
    if scenario and getattr(scenario, "enabled", False):
        wind_kmph = wind_kmph * getattr(scenario, "wind_multiplier", 1.0)
    bathymetry_factor = BATHYMETRY_FACTORS.get(state_name.lower(), 1.25)
    
    # Low-elevation districts suffer greater onshore surge run-up
    coastal_slope_factor = round(1.0 + max(-0.25, min(0.35, (6.0 - elevation_m) * 0.05)), 3)
    
    calc_surge = (wind_kmph / 100.0) * bathymetry_factor * coastal_slope_factor
    max_surge_m = round(max(0.6, calc_surge), 2)

    # 2. Inundation buffer: (surge_height * 2) km
    buffer_km = round(max_surge_m * 2.0, 2)

    # 3. Generate inundation polygon
    raw_coords = dist.get("geometry", {}).get("coordinates", [])
    base_ring = raw_coords[0] if raw_coords else []
    if not base_ring:
        base_ring = [
            [85.12, 19.65], [85.45, 19.78], [85.83, 19.80], [86.25, 19.95],
            [86.15, 20.15], [85.75, 20.10], [85.35, 19.90], [85.12, 19.65],
        ]

    inundation_geom = _generate_inundation_polygon(base_ring, max_surge_m, buffer_km)
    poly_ring = inundation_geom["coordinates"][0]

    # Inundation area in km2
    inundation_area_km2 = round(_compute_polygon_area_km2(poly_ring), 1)
    if inundation_area_km2 <= 0.0:
        inundation_area_km2 = round(coastline_km * buffer_km * 0.72, 1)

    # GeoJSON Feature wrapper for inundation polygon
    inundation_polygon_geojson = {
        "type": "Feature",
        "properties": {
            "cyclone_id": cyclone_id,
            "district_id": d_id,
            "district_name": d_name,
            "max_surge_m": max_surge_m,
            "buffer_km": buffer_km,
            "inundation_area_km2": inundation_area_km2,
        },
        "geometry": inundation_geom,
    }

    # 4. Affected population
    pop_scaling = min(0.70, max(0.10, (max_surge_m / 6.0) * 0.50))
    affected_population = int(round(vulnerable_pop * pop_scaling))

    # 5. Affected assets calculation
    infra_data = _load_infrastructure_data()
    d_name_lower = d_name.lower()
    d_id_lower = d_id.lower()

    hospitals_at_risk = 0
    shelters_activated = 0
    for feat in infra_data.get("hospitals_shelters", []):
        p = feat.get("properties", {})
        f_dist = p.get("district", "").lower()
        if f_dist == d_name_lower or f_dist == d_id_lower:
            dist_coast = float(p.get("distance_from_coast_km") or 999.0)
            if dist_coast <= buffer_km + 1.0:
                if p.get("facility_type") == "CYCLONE_SHELTER":
                    shelters_activated += 1
                else:
                    hospitals_at_risk += 1

    substations_at_risk = 0
    for feat in infra_data.get("power_grid", []):
        p = feat.get("properties", {})
        f_dist = p.get("district", "").lower()
        if (f_dist == d_name_lower or f_dist == d_id_lower) and p.get("asset_type") == "SUBSTATION":
            dist_coast = float(p.get("distance_from_coast_km") or 999.0)
            if dist_coast <= buffer_km + 2.0:
                substations_at_risk += 1

    roads_submerged_km = 0.0
    for feat in infra_data.get("roads", []):
        p = feat.get("properties", {})
        f_dist = p.get("district", "").lower()
        served = [s.lower() for s in p.get("districts_served", [])]
        if f_dist == d_name_lower or d_name_lower in served:
            road_len = float(p.get("length_km") or 25.0)
            # Portion exposed to storm surge inundation
            surge_fraction = min(0.40, max(0.08, buffer_km / 35.0))
            roads_submerged_km += round(road_len * surge_fraction, 1)

    affected_assets = {
        "hospitals_at_risk": max(1 if max_surge_m > 2.0 else 0, hospitals_at_risk),
        "shelters_activated": max(1 if max_surge_m > 1.5 else 0, shelters_activated),
        "power_substations_at_risk": substations_at_risk,
        "roads_submerged_km": round(roads_submerged_km, 1),
    }

    return {
        "cyclone_id": cyclone_id,
        "district_id": d_id,
        "max_surge_m": max_surge_m,
        "inundation_polygon": inundation_polygon_geojson,
        "inundation_area_km2": inundation_area_km2,
        "affected_population": affected_population,
        "affected_assets": affected_assets,
    }
