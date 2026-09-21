"""Unit tests for Gemini in-context cyclone forecasting service and endpoint."""

import json
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.gemini_forecast_service import predict_track_via_gemini


class MockGenerateContentResponse:
    def __init__(self, text: str):
        self.text = text


def _generate_mock_forecast(start_lat: float, start_lon: float, storm_name: str):
    points = [
        {
            "lead_hours": (i + 1) * 3,
            "lat": round(start_lat + (i + 1) * 0.10, 2),
            "lon": round(start_lon + (i + 1) * 0.08, 2),
            "wind_kmph": round(215.0 - (i * 5.0), 1),
            "pressure_hpa": round(935.0 + (i * 3.0), 1),
        }
        for i in range(16)
    ]
    return json.dumps({
        "forecast": points,
        "reasoning": f"Northwestward progression maintained for {storm_name} with gradual coastal interaction.",
        "confidence": "HIGH",
    })


def test_gemini_forecast_returns_16_points():
    mock_payload = _generate_mock_forecast(18.0, 85.0, "Fani")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MockGenerateContentResponse(mock_payload)

    recent_points = [
        {"lat": 17.5, "lon": 84.8, "wind_kmph": 210, "pressure_hpa": 938, "timestamp": "2019-05-02T06:00:00Z"},
        {"lat": 18.0, "lon": 85.0, "wind_kmph": 215, "pressure_hpa": 935, "timestamp": "2019-05-02T12:00:00Z"},
    ]
    storm_metadata = {"cyclone_id": "BOB-02-2019", "name": "Fani", "category": "Extremely Severe Cyclonic Storm"}

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client):
        result = predict_track_via_gemini(recent_points, storm_metadata)

    assert result["model"] == "gemini-3.7-flash-in-context"
    assert len(result["forecast"]) == 16
    assert result["forecast"][-1]["lead_hours"] == 48
    assert result["confidence"] == "HIGH"
    assert "Fani" in result["reasoning"]
    assert result["method"] == "in-context time-series reasoning"


def test_gemini_forecast_handles_json_parse_failure():
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MockGenerateContentResponse("NOT_VALID_JSON")

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client):
        result = predict_track_via_gemini([], {"name": "Test"})

    assert result["error"] == "parse_failure"
    assert result["forecast"] == []
    assert result["confidence"] == "LOW"
    assert "could not be parsed" in result["reasoning"]


def test_gemini_forecast_rejects_implausible_start_position():
    # Mock output that jumps 500 km away from last observation
    mock_payload = _generate_mock_forecast(28.0, 95.0, "Fani")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MockGenerateContentResponse(mock_payload)

    recent_points = [
        {"lat": 18.0, "lon": 85.0, "wind_kmph": 215, "pressure_hpa": 935},
    ]
    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client):
        result = predict_track_via_gemini(recent_points, {"name": "Fani"})

    assert result["error"] in ("implausible_start_position", "out_of_bounds")
    assert result["forecast"] == []
    assert result["confidence"] == "LOW"


def test_gemini_forecast_handles_empty_track():
    client = TestClient(app)
    resp = client.post("/api/forecast/gemini", json={"cyclone_id": "NON_EXISTENT_STORM_999"})
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"]


def test_gemini_forecast_endpoint_returns_200_fani():
    client = TestClient(app)
    mock_payload = _generate_mock_forecast(23.2, 88.5, "Fani")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MockGenerateContentResponse(mock_payload)

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client):
        resp = client.post("/api/forecast/gemini", json={"cyclone_id": "BOB-02-2019", "recent_point_count": 4})

    assert resp.status_code == 200
    data = resp.json()
    assert data["cyclone_id"] == "BOB-02-2019"
    assert data["model"] == "gemini-3.7-flash-in-context"
    assert len(data["forecast"]) == 16
    assert data["confidence"] == "HIGH"
    assert data["error"] is None


def test_gemini_forecast_endpoint_returns_200_amphan():
    client = TestClient(app)
    mock_payload = _generate_mock_forecast(24.5, 89.2, "Amphan")
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MockGenerateContentResponse(mock_payload)

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client):
        resp = client.post("/api/forecast/gemini", json={"cyclone_id": "BOB-01-2020", "recent_point_count": 4})

    assert resp.status_code == 200
    data = resp.json()
    assert data["cyclone_id"] == "BOB-01-2020"
    assert len(data["forecast"]) == 16
    assert data["confidence"] == "HIGH"


def test_gemini_forecast_predicts_different_tracks():
    client = TestClient(app)

    # Fani forecast mock (centered near Fani's last observation 23.2N, 88.5E)
    mock_fani = _generate_mock_forecast(23.2, 88.5, "Fani")
    mock_client_fani = MagicMock()
    mock_client_fani.models.generate_content.return_value = MockGenerateContentResponse(mock_fani)

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client_fani):
        res_fani = client.post("/api/forecast/gemini", json={"cyclone_id": "BOB-02-2019"}).json()

    # Amphan forecast mock (centered near Amphan's last observation 24.5N, 89.2E)
    mock_amphan = _generate_mock_forecast(24.5, 89.2, "Amphan")
    mock_client_amphan = MagicMock()
    mock_client_amphan.models.generate_content.return_value = MockGenerateContentResponse(mock_amphan)

    with patch("backend.services.gemini_forecast_service._get_client", return_value=mock_client_amphan):
        res_amphan = client.post("/api/forecast/gemini", json={"cyclone_id": "BOB-01-2020"}).json()

    assert res_fani["forecast"][0]["lat"] != res_amphan["forecast"][0]["lat"]
    assert res_fani["forecast"][0]["lon"] != res_amphan["forecast"][0]["lon"]
    assert res_fani["reasoning"] != res_amphan["reasoning"]
