"""
Unit tests for Sentinel-2 optical imagery service and endpoints.
Workstream 26: Pre/post landfall change detection.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.sentinel2_service import get_sentinel2_layers, SENTINEL2_LAYERS

client = TestClient(app)


def test_get_sentinel2_layers_known_cyclone():
    """Test get_sentinel2_layers returns expected structure for a known cyclone."""
    # Test with cyclone_id "BOB-02-2019"
    fani_layers = get_sentinel2_layers("BOB-02-2019")
    assert len(fani_layers) >= 2, "Expected at least 2 layers for Fani (NDVI and NDWI change)"

    for layer in fani_layers:
        assert "name" in layer
        assert "description" in layer
        assert "tile_url" in layer
        assert "cyclone_id" in layer
        assert layer["cyclone_id"] == "BOB-02-2019"
        assert "date_range" in layer
        assert "index" in layer
        assert layer["index"] in ["NDVI_CHANGE", "NDWI_CHANGE"]
        assert "palette" in layer

    # Test with name "fani" (case-insensitive)
    fani_by_name = get_sentinel2_layers("fani")
    assert len(fani_by_name) == len(fani_layers)


def test_get_sentinel2_layers_unknown_cyclone():
    """Test get_sentinel2_layers returns empty list for unknown cyclone."""
    unknown = get_sentinel2_layers("UNKNOWN-99-9999")
    assert unknown == []
    empty_res = get_sentinel2_layers("nonexistent_storm")
    assert empty_res == []


def test_api_sentinel2_layers_endpoint():
    """Test GET /api/sentinel2/layers endpoint response shape and optional query filtering."""
    # 1. Without query param: returns all layers
    res = client.get("/api/sentinel2/layers")
    assert res.status_code == 200
    data = res.json()
    assert "layers" in data
    assert isinstance(data["layers"], list)
    assert len(data["layers"]) == len(SENTINEL2_LAYERS)

    # Check required fields in the response layers
    first_layer = data["layers"][0]
    assert "id" in first_layer
    assert "name" in first_layer
    assert "tile_url" in first_layer
    assert "index" in first_layer
    assert "date_range" in first_layer

    # 2. With cyclone_id query param: returns filtered layers
    res_filtered = client.get("/api/sentinel2/layers?cyclone_id=BOB-01-2020")
    assert res_filtered.status_code == 200
    filtered_data = res_filtered.json()
    assert len(filtered_data["layers"]) >= 2
    for layer in filtered_data["layers"]:
        assert layer["cyclone_id"] == "BOB-01-2020"
