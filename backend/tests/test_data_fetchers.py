"""Unit and integration tests for Workstream 3 — Public Data Ingestion fetchers and API endpoints."""

import os
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.cyclone import (
    BhuvanLayer,
    DataGovStats,
    DataSourceInfo,
    FAOWHOIndicators,
)
from backend.services.bhuvan_fetcher import (
    fetch_layer_metadata,
    get_tile_url_template,
    list_supported_layers,
)
from backend.services.datagov_fetcher import (
    fetch_district_indicators,
    fetch_state_stats,
)
from backend.services.fao_who_fetcher import (
    fetch_combined_indicators,
    fetch_food_security,
    fetch_health_indicators,
)
from backend.services.osm_fetcher import (
    fetch_hospitals,
    fetch_roads,
    fetch_shelters,
    get_district_bbox,
    validate_bbox,
)

client = TestClient(app)


# ==============================================================================
# 1. Test data.gov.in CKAN wrapper and disk cache fallback
# ==============================================================================

def test_datagov_fetch_state_stats_fallback_no_key(monkeypatch):
    """Ensure data.gov.in gracefully falls back to cached records when no API key is present."""
    monkeypatch.delenv("DATAGOV_API_KEY", raising=False)
    stats = fetch_state_stats("Odisha")

    assert stats["state"] == "Odisha"
    assert stats["is_cached"] is True
    assert stats["population"] > 40_000_000
    assert stats["literacy_rate"] > 70.0
    assert stats["hospital_beds"] > 10_000
    assert stats["road_density_km_per_100sqkm"] > 100.0
    assert stats["poverty_rate"] is not None
    assert stats["pucca_house_percent"] is not None

    # Validate against Pydantic schema
    validated = DataGovStats.model_validate(stats)
    assert validated.state == "Odisha"


def test_datagov_fetch_district_indicators():
    """Verify district-level socio-economic indicators lookup for Puri."""
    dist_stats = fetch_district_indicators("Puri")

    assert dist_stats["district"] == "Puri"
    assert dist_stats["state"] == "Odisha"
    assert dist_stats["population"] >= 1_600_000
    assert dist_stats["literacy_rate"] > 80.0
    assert dist_stats["hospital_beds"] >= 500
    assert dist_stats["cyclone_shelter_count"] >= 50
    assert dist_stats["is_cached"] is True

    # Validate schema
    validated = DataGovStats.model_validate(dist_stats)
    assert validated.district == "Puri"


def test_datagov_unknown_region_fallback():
    """Verify reasonable baseline returned for unrecognized region."""
    stats = fetch_state_stats("UnknownTerritory")
    assert stats["state"] == "UnknownTerritory"
    assert stats["population"] > 0
    assert stats["is_cached"] is True


# ==============================================================================
# 2. Test ISRO Bhuvan WMS URL Generation & Metadata
# ==============================================================================

def test_bhuvan_tile_url_template_generation():
    """Test standard WMS GetMap tile URL template formatting."""
    url = get_tile_url_template("coastal_vulnerability")
    assert "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms" in url
    assert "layers=coastal:cvi_india" in url
    assert "bbox={bbox-epsg-3857}" in url
    assert "srs=EPSG:3857" in url

    elevation_url = get_tile_url_template("elevation")
    assert "layers=dem:cartodem_30m" in elevation_url


def test_bhuvan_layer_metadata():
    """Test layer metadata extraction for all supported Bhuvan layers."""
    supported = list_supported_layers()
    assert "coastal_vulnerability" in supported
    assert "landuse" in supported
    assert "flood_hazard" in supported
    assert "elevation" in supported

    meta = fetch_layer_metadata("coastal_vulnerability")
    assert meta["layer_id"] == "coastal_vulnerability"
    assert len(meta["bounds"]) == 4
    assert meta["crs"] == "EPSG:4326"
    assert "CVI" in meta["title"]

    # Validate Pydantic schema
    validated = BhuvanLayer.model_validate(meta)
    assert validated.layer_id == "coastal_vulnerability"


# ==============================================================================
# 3. Test OSM Overpass Bounding Box Validation and Fetchers
# ==============================================================================

def test_osm_bbox_validation():
    """Verify bbox validation enforces (min_lat, min_lon, max_lat, max_lon) rules."""
    valid_bbox = (19.65, 85.65, 20.15, 86.25)
    validate_bbox(valid_bbox)

    # Wrong length
    with pytest.raises(ValueError, match="tuple of 4 floats"):
        validate_bbox((19.65, 85.65, 20.15))

    # min_lat > max_lat
    with pytest.raises(ValueError, match="min_lat.*cannot be greater"):
        validate_bbox((21.0, 85.0, 19.0, 86.0))

    # min_lon > max_lon
    with pytest.raises(ValueError, match="min_lon.*cannot be greater"):
        validate_bbox((19.0, 88.0, 20.0, 85.0))

    # Out of latitude range
    with pytest.raises(ValueError, match="Latitudes must be between"):
        validate_bbox((-95.0, 85.0, 20.0, 86.0))


def test_osm_fetch_infrastructure_cached(monkeypatch):
    """Verify roads, hospitals, and shelters fetchers return valid GeoJSON FeatureCollections from cache."""
    monkeypatch.setattr("backend.services.osm_fetcher._query_overpass", lambda q: None)
    puri_bbox = get_district_bbox("Puri")
    assert puri_bbox == (19.65, 85.65, 20.15, 86.25)

    roads = fetch_roads(puri_bbox, limit=10)
    assert roads["type"] == "FeatureCollection"
    assert "features" in roads
    assert len(roads["features"]) > 0
    first_road = roads["features"][0]
    assert first_road["geometry"]["type"] == "LineString"

    hospitals = fetch_hospitals(puri_bbox, limit=10)
    assert hospitals["type"] == "FeatureCollection"
    assert len(hospitals["features"]) > 0
    first_hospital = hospitals["features"][0]
    assert first_hospital["properties"]["feature_type"] == "hospital"

    shelters = fetch_shelters(puri_bbox, limit=10)
    assert shelters["type"] == "FeatureCollection"
    assert len(shelters["features"]) > 0
    first_shelter = shelters["features"][0]
    assert first_shelter["properties"]["feature_type"] == "shelter"


# ==============================================================================
# 4. Test FAO / WHO Indicators Fetcher and Schema
# ==============================================================================

def test_fao_who_indicators_schema():
    """Verify FAO nutrition and WHO public health indicators match schema."""
    food = fetch_food_security("Odisha")
    assert "food_insecurity_percent" in food
    assert "undernourishment_percent" in food
    assert food["food_insecurity_percent"] > 0

    health = fetch_health_indicators("Odisha")
    assert "infant_mortality_per_1000" in health
    assert "healthcare_access_index" in health
    assert "disease_prevalence" in health

    combined = fetch_combined_indicators("Odisha")
    validated = FAOWHOIndicators.model_validate(combined)
    assert validated.state == "Odisha"
    assert validated.infant_mortality_per_1000 > 0
    assert validated.healthcare_access_index > 0


# ==============================================================================
# 5. Test all 6 New API Endpoints Return 200
# ==============================================================================

def test_api_endpoint_data_sources():
    """GET /api/data-sources returns 200 and catalog of operational/cached sources."""
    resp = client.get("/api/data-sources")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    source_ids = [s["source_id"] for s in data]
    assert "datagov" in source_ids
    assert "isro_bhuvan" in source_ids
    assert "osm_overpass" in source_ids
    assert "fao_who" in source_ids


def test_api_endpoint_datagov_state():
    """GET /api/external/datagov?state=Odisha returns 200 and state statistics."""
    resp = client.get("/api/external/datagov?state=Odisha")
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == "Odisha"
    assert data["population"] > 40_000_000
    assert "hospital_beds" in data


def test_api_endpoint_datagov_district():
    """GET /api/external/datagov?district=Puri returns 200 and district socio-economic data."""
    resp = client.get("/api/external/datagov?district=Puri")
    assert resp.status_code == 200
    data = resp.json()
    assert data["district"] == "Puri"
    assert data["population"] >= 1_600_000


def test_api_endpoint_bhuvan():
    """GET /api/external/bhuvan?layer=coastal_vulnerability returns 200 and layer metadata."""
    resp = client.get("/api/external/bhuvan?layer=coastal_vulnerability")
    assert resp.status_code == 200
    data = resp.json()
    assert data["layer_id"] == "coastal_vulnerability"
    assert "tile_url_template" in data
    assert "EPSG:4326" in data["crs"]


def test_api_endpoint_osm_roads():
    """GET /api/external/osm/roads?district=Puri&limit=50 returns 200 and GeoJSON roads."""
    resp = client.get("/api/external/osm/roads?district=Puri&limit=50")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0


def test_api_endpoint_osm_hospitals():
    """GET /api/external/osm/hospitals?district=Puri returns 200 and GeoJSON hospitals."""
    resp = client.get("/api/external/osm/hospitals?district=Puri")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) > 0


def test_api_endpoint_fao_who():
    """GET /api/external/fao-who?state=Odisha returns 200 and health/nutrition indicators."""
    resp = client.get("/api/external/fao-who?state=Odisha")
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == "Odisha"
    assert "food_insecurity_percent" in data
    assert "infant_mortality_per_1000" in data
    assert "healthcare_access_index" in data
