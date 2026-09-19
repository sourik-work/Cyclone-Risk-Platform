"""Unit and API tests for the storm surge modeling service."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.surge_service import simulate_surge

client = TestClient(app)


def test_surge_simulation_physics_formula():
    """Validates physics-lite storm surge height calculation and bathymetry scaling."""
    fani_surge = simulate_surge("BOB-02-2019", "Puri")
    amphan_surge = simulate_surge("BOB-01-2020", "Purba Medinipur")
    calm_surge = simulate_surge("calm", "Puri")

    # High intensity storms should yield elevated surge (> 2.5m)
    assert fani_surge["max_surge_m"] >= 2.5
    assert amphan_surge["max_surge_m"] >= 2.5
    assert calm_surge["max_surge_m"] < fani_surge["max_surge_m"]
    assert fani_surge["district_id"] == "OD-PUR"


def test_surge_polygon_validity_and_closure():
    """Validates that inundation_polygon is a valid GeoJSON Feature with a closed polygon geometry."""
    res = simulate_surge("BOB-02-2019", "Puri")
    poly_feat = res["inundation_polygon"]

    assert poly_feat["type"] == "Feature"
    assert "geometry" in poly_feat
    geom = poly_feat["geometry"]
    assert geom["type"] == "Polygon"

    coords = geom["coordinates"][0]
    # Must have at least 4 coordinates to be a valid polygon
    assert len(coords) >= 4
    # Polygon must be closed (first and last coordinates identical)
    assert coords[0] == coords[-1]

    # Check realistic coordinate bounds in Bay of Bengal coast
    for pt in coords:
        lon, lat = pt[0], pt[1]
        assert 78.0 <= lon <= 92.0
        assert 10.0 <= lat <= 25.0


def test_surge_inundation_area_and_population():
    """Validates realistic area, affected population, and infrastructure asset counts."""
    res = simulate_surge("BOB-02-2019", "Puri")

    assert res["inundation_area_km2"] > 50.0
    assert res["affected_population"] > 10000

    assets = res["affected_assets"]
    assert isinstance(assets, dict)
    assert "hospitals_at_risk" in assets
    assert "shelters_activated" in assets
    assert "power_substations_at_risk" in assets
    assert "roads_submerged_km" in assets
    assert assets["hospitals_at_risk"] >= 0
    assert assets["shelters_activated"] >= 0


def test_surge_simulation_deterministic():
    """Validates that duplicate calls with identical parameters yield deterministic output."""
    res1 = simulate_surge("BOB-02-2019", "Jagatsinghpur")
    res2 = simulate_surge("BOB-02-2019", "Jagatsinghpur")

    assert res1["max_surge_m"] == res2["max_surge_m"]
    assert res1["inundation_area_km2"] == res2["inundation_area_km2"]
    assert res1["affected_population"] == res2["affected_population"]
    assert res1["inundation_polygon"] == res2["inundation_polygon"]


def test_api_surge_simulation_endpoint():
    """Validates POST /api/surge/simulate endpoint response shape."""
    response = client.post(
        "/api/surge/simulate",
        json={"cyclone_id": "BOB-02-2019", "district_id": "Puri"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["cyclone_id"] == "BOB-02-2019"
    assert data["district_id"] == "OD-PUR"
    assert "max_surge_m" in data
    assert "inundation_polygon" in data
    assert "inundation_area_km2" in data
    assert "affected_population" in data
    assert "affected_assets" in data


def test_api_hazards_summary_endpoint():
    """Validates GET /api/hazards/summary aggregation endpoint."""
    response = client.get("/api/hazards/summary?district=Puri&cyclone_id=BOB-02-2019")
    assert response.status_code == 200
    data = response.json()

    assert data["district_id"] == "OD-PUR"
    assert "rainfall" in data
    assert "surge" in data
    assert "overall_risk" in data
    assert data["overall_risk"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert data["rainfall"]["forecast_24h_mm"] > 0
    assert data["surge"]["max_surge_m"] > 0
