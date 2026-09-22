"""Terrain-aware rainfall damage pathway model.

Distinct from storm surge — this models infiltration- and slope-driven hazards.
1. Coastal lowland (<20m elevation): Flash flooding (rainfall intensity x soil saturation)
2. Hilly terrain (>15 deg slope): Landslide risk (cumulative rainfall x slope gradient)
"""

from typing import Any, Dict, List, Optional

# Terrain priors for districts (GSI & SRTM 30m DEM derived)
DISTRICT_TERRAIN_PRIORS: Dict[str, Dict[str, float]] = {
    "visakhapatnam": {"elevation_m": 45.0, "avg_slope_deg": 18.5, "soil_saturation_pct": 72.0},
    "srikakulam": {"elevation_m": 35.0, "avg_slope_deg": 14.0, "soil_saturation_pct": 68.0},
    "ganjam": {"elevation_m": 28.0, "avg_slope_deg": 12.0, "soil_saturation_pct": 65.0},
    "puri": {"elevation_m": 4.5, "avg_slope_deg": 1.2, "soil_saturation_pct": 82.0},
    "kendrapara": {"elevation_m": 3.2, "avg_slope_deg": 0.8, "soil_saturation_pct": 85.0},
    "jagatsinghpur": {"elevation_m": 3.8, "avg_slope_deg": 0.9, "soil_saturation_pct": 84.0},
    "bhadrak": {"elevation_m": 5.0, "avg_slope_deg": 1.1, "soil_saturation_pct": 80.0},
    "balasore": {"elevation_m": 6.2, "avg_slope_deg": 1.5, "soil_saturation_pct": 78.0},
    "south 24 parganas": {"elevation_m": 2.5, "avg_slope_deg": 0.5, "soil_saturation_pct": 88.0},
    "north 24 parganas": {"elevation_m": 4.0, "avg_slope_deg": 0.6, "soil_saturation_pct": 82.0},
    "purba medinipur": {"elevation_m": 3.5, "avg_slope_deg": 0.8, "soil_saturation_pct": 84.0},
    "east godavari": {"elevation_m": 8.0, "avg_slope_deg": 2.0, "soil_saturation_pct": 75.0},
    "chennai": {"elevation_m": 6.5, "avg_slope_deg": 1.8, "soil_saturation_pct": 76.0},
    "tiruvallur": {"elevation_m": 15.0, "avg_slope_deg": 3.0, "soil_saturation_pct": 70.0},
    "kancheepuram": {"elevation_m": 22.0, "avg_slope_deg": 4.5, "soil_saturation_pct": 68.0},
}


def classify_terrain(elevation_m: float, slope_deg: float = 0.0) -> str:
    """Classifies terrain into Coastal Lowland, Hilly Terrain, or Inland Plain."""
    if elevation_m < 20:
        return "COASTAL_LOWLAND"
    elif slope_deg > 15:
        return "HILLY_TERRAIN"
    return "INLAND_PLAIN"


def compute_flash_flood_risk(rainfall_24h_mm: float, soil_saturation_pct: float) -> dict:
    """Runoff potential = rainfall x soil saturation. Threshold-based risk."""
    runoff_potential = (rainfall_24h_mm * soil_saturation_pct) / 10000.0
    if runoff_potential > 1.5:
        risk = "CRITICAL"
    elif runoff_potential > 1.0:
        risk = "HIGH"
    elif runoff_potential > 0.5:
        risk = "MEDIUM"
    else:
        risk = "LOW"
    return {
        "hazard_type": "FLASH_FLOOD",
        "risk_level": risk,
        "runoff_potential": round(runoff_potential, 2),
        "trigger_rainfall_mm": 100.0,
        "current_rainfall_mm": round(rainfall_24h_mm, 1),
    }


def compute_landslide_risk(rainfall_72h_mm: float, slope_deg: float) -> dict:
    """Susceptibility index = cumulative rainfall x slope / 1000."""
    susceptibility_index = (rainfall_72h_mm * slope_deg) / 1000.0
    if susceptibility_index > 2.0:
        risk = "CRITICAL"
    elif susceptibility_index > 1.2:
        risk = "HIGH"
    elif susceptibility_index > 0.6:
        risk = "MEDIUM"
    else:
        risk = "LOW"
    return {
        "hazard_type": "LANDSLIDE",
        "risk_level": risk,
        "susceptibility_index": round(susceptibility_index, 2),
        "slope_deg": round(slope_deg, 1),
        "cumulative_rainfall_72h_mm": round(rainfall_72h_mm, 1),
    }


def compute_damage_pathway(district: str, rainfall_data: dict, district_meta: Optional[dict] = None) -> dict:
    """Computes distinct infiltration and slope-driven hazard pathways for a district."""
    meta = district_meta or {}
    prior = DISTRICT_TERRAIN_PRIORS.get(district.lower(), {})

    elevation = float(meta.get("elevation_m") or prior.get("elevation_m") or 50.0)
    slope = float(meta.get("avg_slope_deg") or prior.get("avg_slope_deg") or 5.0)
    terrain = classify_terrain(elevation, slope)

    rainfall_24h = float(rainfall_data.get("forecast_24h_mm", 0.0))
    rainfall_72h = float(rainfall_data.get("forecast_72h_mm", 0.0))
    soil_sat = float(meta.get("soil_saturation_pct") or prior.get("soil_saturation_pct") or 60.0)

    pathways: List[Dict[str, Any]] = []
    if terrain in ("COASTAL_LOWLAND", "INLAND_PLAIN"):
        pathways.append(compute_flash_flood_risk(rainfall_24h, soil_sat))
    if terrain == "HILLY_TERRAIN":
        pathways.append(compute_landslide_risk(rainfall_72h, slope))
    if terrain == "HILLY_TERRAIN" and elevation < 100:
        pathways.append(compute_flash_flood_risk(rainfall_24h, soil_sat))

    return {
        "district": district,
        "terrain_type": terrain,
        "elevation_m": round(elevation, 1),
        "primary_hazard": pathways[0]["hazard_type"] if pathways else "NONE",
        "pathways": pathways,
        "data_sources": ["IMD rainfall forecast", "30m DEM", "GSI slope data"],
    }
