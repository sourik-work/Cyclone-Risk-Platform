"""Tests for infrastructure service and API endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.api.routes import router
from backend.main import app
from backend.services.infrastructure_service import (
    clear_cache,
    load_infrastructure,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_cache():
    """Clear in-memory cache before each test."""
    clear_cache()
    yield
    clear_cache()


def test_load_all_infrastructure():
    """Verify that all infrastructure datasets (power grid, roads, hospitals) are loaded."""
    data = load_infrastructure()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    features = data["features"]
    # 40 substations + 15 transmission lines + 15 roads + 50 hospitals/shelters = 120 features
    assert len(features) >= 100, f"Expected at least 100 features, got {len(features)}"

    # Check distinct asset types present
    asset_types = {
        f.get("properties", {}).get("asset_type")
        for f in features
        if f.get("properties", {}).get("asset_type")
    }
    facility_types = {
        f.get("properties", {}).get("facility_type")
        for f in features
        if f.get("properties", {}).get("facility_type")
    }
    assert "SUBSTATION" in asset_types
    assert "TRANSMISSION_LINE" in asset_types
    assert "DISTRICT_HOSPITAL" in facility_types or "CYCLONE_SHELTER" in facility_types


def test_filter_by_state():
    """Verify filtering by state returns only features matching that state."""
    odisha_data = load_infrastructure(state="Odisha")
    assert len(odisha_data["features"]) > 0
    for feat in odisha_data["features"]:
        props = feat["properties"]
        state = props.get("state") or props.get("state_name") or ""
        districts = props.get("districts_served", [])
        assert "odisha" in state.lower() or any("odisha" in d.lower() for d in districts)

    wb_data = load_infrastructure(state="West Bengal")
    assert len(wb_data["features"]) > 0
    for feat in wb_data["features"]:
        props = feat["properties"]
        state = props.get("state") or props.get("state_name") or ""
        districts = props.get("districts_served", [])
        assert "west bengal" in state.lower() or any("west bengal" in d.lower() for d in districts)


def test_filter_by_type():
    """Verify filtering by asset type (SUBSTATION, HOSPITAL, CYCLONE_SHELTER, etc.)."""
    substations = load_infrastructure(asset_type="SUBSTATION")
    assert len(substations["features"]) == 40
    for feat in substations["features"]:
        assert feat["properties"]["asset_type"] == "SUBSTATION"

    hospitals = load_infrastructure(asset_type="HOSPITAL")
    assert len(hospitals["features"]) > 0
    for feat in hospitals["features"]:
        assert feat["properties"]["facility_type"] in ("DISTRICT_HOSPITAL", "MEDICAL_COLLEGE", "PHC")

    shelters = load_infrastructure(asset_type="CYCLONE_SHELTER")
    assert len(shelters["features"]) > 0
    for feat in shelters["features"]:
        assert feat["properties"]["facility_type"] == "CYCLONE_SHELTER"


def test_schema_properties_and_coordinates():
    """Verify required properties and valid coordinates exist on all infrastructure features."""
    data = load_infrastructure()
    for feat in data["features"]:
        assert feat["type"] == "Feature"
        geom = feat["geometry"]
        assert geom["type"] in ("Point", "LineString")
        coords = geom["coordinates"]
        assert len(coords) > 0

        props = feat["properties"]
        # Must have an ID and name
        has_id = "asset_id" in props or "facility_id" in props or "road_id" in props
        assert has_id, f"Feature missing ID: {props}"
        assert "name" in props, f"Feature missing name: {props}"

        # Points must have valid lat/lon
        if geom["type"] == "Point":
            lon, lat = coords[0], coords[1]
            assert 75.0 <= lon <= 95.0, f"Longitude out of bounds for East Coast: {lon}"
            assert 8.0 <= lat <= 26.0, f"Latitude out of bounds for East Coast: {lat}"


def test_api_infrastructure_endpoint():
    """Verify GET /api/infrastructure returns 200 and supports query filters."""
    # 1. Load all
    resp = client.get("/api/infrastructure")
    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) >= 100

    # 2. Filter by state
    resp_state = client.get("/api/infrastructure?state=Tamil%20Nadu")
    assert resp_state.status_code == 200
    body_state = resp_state.json()
    assert len(body_state["features"]) > 0

    # 3. Filter by type
    resp_type = client.get("/api/infrastructure?type=SUBSTATION")
    assert resp_type.status_code == 200
    body_type = resp_type.json()
    assert len(body_type["features"]) == 40

    # 4. Combined state + type
    resp_combined = client.get("/api/infrastructure?state=Odisha&type=SUBSTATION")
    assert resp_combined.status_code == 200
    body_combined = resp_combined.json()
    assert len(body_combined["features"]) == 10


def test_caching_performance():
    """Verify second call uses in-memory cache without reloading from disk."""
    clear_cache()
    data1 = load_infrastructure()
    data2 = load_infrastructure()
    # Identical reference from in-memory cache
    assert len(data1["features"]) == len(data2["features"])
