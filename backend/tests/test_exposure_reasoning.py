"""Unit tests for Gemini multimodal exposure reasoning service and endpoint."""

from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.exposure_reasoning_service import reason_about_exposure, _fallback_exposure_reasoning


def test_fallback_exposure_reasoning():
    storm_data = {"wind_kmph": 200, "pressure_hpa": 940, "surge_m": 3.8, "rainfall_mm": 180}
    bbox = {"min_lat": 19.6, "max_lat": 20.0, "min_lon": 85.5, "max_lon": 86.2, "area_km2": 150.0}
    infra = [
        {"name": "Puri 220kV Substation", "asset_type": "SUBSTATION", "distance_from_coast_km": 1.5},
        {"name": "District Headquarters Hospital", "facility_type": "HOSPITAL", "distance_from_coast_km": 2.0},
    ]

    res = _fallback_exposure_reasoning("Puri", storm_data, bbox, infra)
    assert "narrative" in res
    assert "Puri" in res["narrative"]
    assert "Sentinel-1 SAR" in res["narrative"]
    assert len(res["critical_assets"]) >= 2
    assert len(res["recommended_actions"]) >= 3
    assert res["confidence"] == "HIGH"


def test_reason_about_exposure_with_fallback():
    with patch("backend.services.exposure_reasoning_service.get_settings") as mock_settings:
        mock_settings.return_value.gemini_api_key = ""
        res = reason_about_exposure(
            district_name="Kendrapara",
            storm_data={"wind_kmph": 175, "surge_m": 2.5},
            flood_extent_bbox={"area_km2": 80.0, "min_lat": 20.2, "max_lat": 20.7},
            infrastructure=[],
        )
        assert "narrative" in res
        assert "Kendrapara" in res["narrative"]
        assert len(res["critical_assets"]) > 0


def test_api_exposure_reason_endpoint():
    client = TestClient(app)
    resp = client.post(
        "/api/exposure/reason",
        json={"district_name": "Puri", "cyclone_id": "BOB-02-2019"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["district_name"] == "Puri"
    assert len(data["narrative"]) > 50
    assert len(data["critical_assets"]) > 0
    assert len(data["recommended_actions"]) > 0
    assert data["confidence"] in ("LOW", "MEDIUM", "HIGH")
    assert data["reasoning_source"] == "gemini-3.7-flash-multimodal"
