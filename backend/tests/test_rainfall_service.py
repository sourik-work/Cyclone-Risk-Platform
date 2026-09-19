"""Unit and API tests for the rainfall forecast service."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.rainfall_service import classify_rainfall_risk, get_rainfall_forecast

client = TestClient(app)


def test_rainfall_classification_thresholds():
    """Validates rainfall risk classification aligns with defined IMD criteria."""
    assert classify_rainfall_risk(0.0) == "LOW"
    assert classify_rainfall_risk(25.4) == "LOW"
    assert classify_rainfall_risk(49.9) == "LOW"

    assert classify_rainfall_risk(50.0) == "MEDIUM"
    assert classify_rainfall_risk(75.5) == "MEDIUM"
    assert classify_rainfall_risk(100.0) == "MEDIUM"

    assert classify_rainfall_risk(100.1) == "HIGH"
    assert classify_rainfall_risk(150.0) == "HIGH"
    assert classify_rainfall_risk(200.0) == "HIGH"

    assert classify_rainfall_risk(200.1) == "CRITICAL"
    assert classify_rainfall_risk(350.0) == "CRITICAL"
    assert classify_rainfall_risk(500.0) == "CRITICAL"


def test_rainfall_forecast_deterministic():
    """Validates that rainfall forecast produces deterministic outputs for the same district and storm."""
    res1 = get_rainfall_forecast("Puri", "BOB-02-2019")
    res2 = get_rainfall_forecast("Puri", "BOB-02-2019")

    assert res1 == res2
    assert res1["district_id"] == "OD-PUR"
    assert res1["forecast_24h_mm"] > 0
    assert res1["forecast_48h_mm"] > res1["forecast_24h_mm"]
    assert res1["forecast_72h_mm"] > res1["forecast_48h_mm"]
    assert res1["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_rainfall_forecast_intensity_scaling():
    """Validates that severe cyclones scale rainfall accumulation higher than quiescent conditions."""
    calm_res = get_rainfall_forecast("Puri", None)
    storm_res = get_rainfall_forecast("Puri", "BOB-02-2019")  # Fani (peak wind > 200 km/h)

    assert storm_res["forecast_24h_mm"] > calm_res["forecast_24h_mm"]
    assert storm_res["risk_level"] in ["HIGH", "CRITICAL"]


def test_rainfall_forecast_district_fallback():
    """Validates graceful fallback for non-cached or unknown district queries."""
    res = get_rainfall_forecast("UnknownDistrictXYZ")
    assert res["district_id"] == "UnknownDistrictXYZ"
    assert res["forecast_24h_mm"] > 0
    assert res["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_api_rainfall_forecast_endpoint():
    """Validates GET /api/rainfall/forecast endpoint schema and response shape."""
    response = client.get("/api/rainfall/forecast?district=Puri&cyclone_id=BOB-02-2019")
    assert response.status_code == 200
    data = response.json()

    assert "district_id" in data
    assert "forecast_24h_mm" in data
    assert "forecast_48h_mm" in data
    assert "forecast_72h_mm" in data
    assert "risk_level" in data
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
