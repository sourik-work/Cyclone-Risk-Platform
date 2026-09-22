"""Unit tests for the infrastructure triage ranking service and API endpoint."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.triage_service import (
    _haversine_to_forecast,
    compute_triage_score,
    rank_assets_for_action,
)


def test_compute_triage_score_factors():
    """Verifies that proximity, criticality, asset type, and generator status scale the score."""
    # Critical hospital 5km away without generator
    asset_urgent = {
        "criticality": "HIGH",
        "asset_type": "DISTRICT_HOSPITAL",
        "has_generator": False,
        "distance_from_coast_km": 2.0,
    }
    score_urgent = compute_triage_score(asset_urgent, {}, distance_to_forecast_km=5.0)

    # Low criticality road 180km away
    asset_distant = {
        "criticality": "LOW",
        "asset_type": "ARTERIAL_ROAD",
        "has_generator": True,
        "distance_from_coast_km": 50.0,
    }
    score_distant = compute_triage_score(asset_distant, {}, distance_to_forecast_km=180.0)

    assert score_urgent > score_distant
    assert score_urgent >= 90.0
    assert score_distant <= 40.0


def test_haversine_distance_calculation():
    """Verifies haversine distance calculation to closest track point and fallback center."""
    storm_data = {
        "latitude": 20.0,
        "longitude": 86.0,
        "track_points": [
            {"latitude": 18.0, "longitude": 84.0},
            {"latitude": 19.8, "longitude": 85.8},
        ],
    }

    # Point close to track point (19.8, 85.8)
    dist_close = _haversine_to_forecast(19.81, 85.82, storm_data)
    assert dist_close < 5.0

    # Point further away
    dist_far = _haversine_to_forecast(22.0, 88.0, storm_data)
    assert dist_far > 100.0


def test_ranking_order_descending():
    """Verifies that rank_assets_for_action outputs assets sorted in descending triage score order."""
    storm_data = {"latitude": 19.8, "longitude": 85.8}
    assets = [
        {
            "asset_id": "ROAD-1",
            "name": "Rural Link Road",
            "asset_type": "ARTERIAL_ROAD",
            "latitude": 21.5,
            "longitude": 87.5,
            "criticality": "LOW",
        },
        {
            "asset_id": "HOSP-1",
            "name": "Puri Super Specialty Hospital",
            "asset_type": "DISTRICT_HOSPITAL",
            "latitude": 19.81,
            "longitude": 85.82,
            "criticality": "HIGH",
            "has_generator": False,
        },
        {
            "asset_id": "SUB-1",
            "name": "Regional Substation",
            "asset_type": "SUBSTATION",
            "latitude": 20.2,
            "longitude": 86.1,
            "criticality": "MEDIUM",
        },
    ]

    ranked = rank_assets_for_action(storm_data, assets, top_n=3)
    assert len(ranked) == 3
    assert ranked[0]["asset_id"] == "HOSP-1"
    assert ranked[0]["triage_score"] >= ranked[1]["triage_score"]
    assert ranked[1]["triage_score"] >= ranked[2]["triage_score"]


def test_top_n_selection():
    """Verifies that top_n parameter truncates the output appropriately."""
    storm_data = {"latitude": 20.0, "longitude": 86.0}
    assets = [
        {"asset_id": f"A-{i}", "name": f"Asset {i}", "latitude": 20.0 + (i * 0.1), "longitude": 86.0}
        for i in range(15)
    ]

    ranked_3 = rank_assets_for_action(storm_data, assets, top_n=3)
    assert len(ranked_3) == 3

    ranked_7 = rank_assets_for_action(storm_data, assets, top_n=7)
    assert len(ranked_7) == 7


def test_empty_and_invalid_inputs_handled():
    """Verifies that empty lists and missing coordinate geometries are handled gracefully."""
    storm_data = {"latitude": 20.0, "longitude": 86.0}

    # Empty list
    assert rank_assets_for_action(storm_data, [], top_n=5) == []

    # Assets with missing or null coordinates
    invalid_assets = [
        {"asset_id": "BAD-1", "name": "No coords"},
        {"asset_id": "BAD-2", "latitude": None, "longitude": 86.0},
        {"asset_id": "BAD-3", "geometry": {"type": "Point", "coordinates": []}},
    ]
    assert rank_assets_for_action(storm_data, invalid_assets, top_n=5) == []


def test_api_triage_endpoint_response_shape():
    """Verifies POST /api/triage/rank endpoint returns 200, valid schema, and top priority items."""
    client = TestClient(app)
    resp = client.post(
        "/api/triage/rank",
        json={"cyclone_id": "BOB-02-2019", "top_n": 5},
        headers={"Authorization": "Bearer demo"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["cyclone_id"] == "BOB-02-2019"
    assert data["total_assets_evaluated"] > 0
    assert len(data["top_priority_assets"]) == 5

    first = data["top_priority_assets"][0]
    assert "asset_id" in first
    assert "name" in first
    assert "type" in first
    assert "triage_score" in first
    assert first["triage_score"] >= 0.0
    assert "reason" in first
    assert "distance_to_forecast_km" in first
