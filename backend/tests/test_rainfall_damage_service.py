"""Unit tests for the terrain-aware rainfall damage pathway model and API endpoint."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.rainfall_damage_service import (
    classify_terrain,
    compute_damage_pathway,
    compute_flash_flood_risk,
    compute_landslide_risk,
)


def test_classify_terrain():
    """Verifies terrain categorization across elevation and slope thresholds."""
    # Lowland coastal elevation (< 20m)
    assert classify_terrain(elevation_m=4.5, slope_deg=1.0) == "COASTAL_LOWLAND"
    assert classify_terrain(elevation_m=19.9, slope_deg=5.0) == "COASTAL_LOWLAND"

    # Hilly terrain (slope > 15 deg)
    assert classify_terrain(elevation_m=120.0, slope_deg=18.0) == "HILLY_TERRAIN"
    assert classify_terrain(elevation_m=45.0, slope_deg=16.0) == "HILLY_TERRAIN"

    # Inland plain (elevation >= 20m, slope <= 15 deg)
    assert classify_terrain(elevation_m=35.0, slope_deg=4.0) == "INLAND_PLAIN"
    assert classify_terrain(elevation_m=75.0, slope_deg=12.0) == "INLAND_PLAIN"


def test_compute_flash_flood_risk_thresholds():
    """Verifies flash flood runoff potential and risk level classifications."""
    # CRITICAL: runoff_potential > 1.5 (e.g. 200mm * 80% / 10000 = 1.6)
    crit = compute_flash_flood_risk(rainfall_24h_mm=200.0, soil_saturation_pct=80.0)
    assert crit["hazard_type"] == "FLASH_FLOOD"
    assert crit["risk_level"] == "CRITICAL"
    assert crit["runoff_potential"] >= 1.5

    # HIGH: 1.0 < runoff_potential <= 1.5 (e.g. 150mm * 75% / 10000 = 1.125)
    high = compute_flash_flood_risk(rainfall_24h_mm=150.0, soil_saturation_pct=75.0)
    assert high["risk_level"] == "HIGH"

    # MEDIUM: 0.5 < runoff_potential <= 1.0 (e.g. 100mm * 65% / 10000 = 0.65)
    med = compute_flash_flood_risk(rainfall_24h_mm=100.0, soil_saturation_pct=65.0)
    assert med["risk_level"] == "MEDIUM"

    # LOW: runoff_potential <= 0.5 (e.g. 40mm * 50% / 10000 = 0.20)
    low = compute_flash_flood_risk(rainfall_24h_mm=40.0, soil_saturation_pct=50.0)
    assert low["risk_level"] == "LOW"


def test_compute_landslide_risk_thresholds():
    """Verifies landslide susceptibility index and risk level classifications."""
    # CRITICAL: susceptibility_index > 2.0 (e.g. 200mm * 20 deg / 1000 = 4.0)
    crit = compute_landslide_risk(rainfall_72h_mm=200.0, slope_deg=20.0)
    assert crit["hazard_type"] == "LANDSLIDE"
    assert crit["risk_level"] == "CRITICAL"
    assert crit["susceptibility_index"] == 4.0

    # HIGH: 1.2 < index <= 2.0 (e.g. 100mm * 16 deg / 1000 = 1.6)
    high = compute_landslide_risk(rainfall_72h_mm=100.0, slope_deg=16.0)
    assert high["risk_level"] == "HIGH"

    # MEDIUM: 0.6 < index <= 1.2 (e.g. 50mm * 18 deg / 1000 = 0.9)
    med = compute_landslide_risk(rainfall_72h_mm=50.0, slope_deg=18.0)
    assert med["risk_level"] == "MEDIUM"

    # LOW: index <= 0.6 (e.g. 20mm * 16 deg / 1000 = 0.32)
    low = compute_landslide_risk(rainfall_72h_mm=20.0, slope_deg=16.0)
    assert low["risk_level"] == "LOW"


def test_compute_damage_pathway_coastal_lowland():
    """Verifies damage pathway computation for flat coastal lowlands like Puri."""
    rainfall_data = {"forecast_24h_mm": 210.0, "forecast_72h_mm": 380.0}
    district_meta = {"elevation_m": 4.5, "avg_slope_deg": 1.0, "soil_saturation_pct": 82.0}

    res = compute_damage_pathway("Puri", rainfall_data, district_meta)
    assert res["district"] == "Puri"
    assert res["terrain_type"] == "COASTAL_LOWLAND"
    assert res["primary_hazard"] == "FLASH_FLOOD"
    assert len(res["pathways"]) == 1
    assert res["pathways"][0]["hazard_type"] == "FLASH_FLOOD"
    assert res["pathways"][0]["risk_level"] == "CRITICAL"


def test_compute_damage_pathway_hilly_terrain():
    """Verifies damage pathway computation for hilly slope terrain."""
    rainfall_data = {"forecast_24h_mm": 120.0, "forecast_72h_mm": 250.0}
    district_meta = {"elevation_m": 350.0, "avg_slope_deg": 22.0, "soil_saturation_pct": 70.0}

    res = compute_damage_pathway("EasternGhats", rainfall_data, district_meta)
    assert res["district"] == "EasternGhats"
    assert res["terrain_type"] == "HILLY_TERRAIN"
    assert res["primary_hazard"] == "LANDSLIDE"
    assert any(p["hazard_type"] == "LANDSLIDE" for p in res["pathways"])


def test_compute_damage_pathway_dual_hazard():
    """Verifies dual pathway (landslide + flash flood) when elevation < 100m in hilly terrain."""
    rainfall_data = {"forecast_24h_mm": 140.0, "forecast_72h_mm": 280.0}
    district_meta = {"elevation_m": 60.0, "avg_slope_deg": 18.0, "soil_saturation_pct": 75.0}

    res = compute_damage_pathway("CoastalHills", rainfall_data, district_meta)
    assert res["terrain_type"] == "HILLY_TERRAIN"
    hazard_types = [p["hazard_type"] for p in res["pathways"]]
    assert "LANDSLIDE" in hazard_types
    assert "FLASH_FLOOD" in hazard_types


def test_api_rainfall_damage_pathway_endpoint():
    """Verifies POST /api/rainfall/damage-pathway endpoint response schema and values."""
    client = TestClient(app)
    resp = client.post(
        "/api/rainfall/damage-pathway",
        json={"district_name": "Puri", "cyclone_id": "BOB-02-2019"},
        headers={"Authorization": "Bearer demo"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["district"] == "Puri"
    assert data["terrain_type"] in ("COASTAL_LOWLAND", "HILLY_TERRAIN", "INLAND_PLAIN")
    assert "primary_hazard" in data
    assert isinstance(data["pathways"], list)
    assert len(data["pathways"]) >= 1
    assert "data_sources" in data
    assert "IMD rainfall forecast" in data["data_sources"]
