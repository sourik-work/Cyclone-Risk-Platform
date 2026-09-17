"""Unit tests for TrackLSTM cyclone track forecasting service and API route."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.forecast_service import (
    TrackLSTM,
    get_model_metrics,
    predict_track,
)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_track_lstm_architecture_and_params():
    """Verifies that TrackLSTM matches the exact architecture and has 119,872 parameters."""
    metrics = get_model_metrics()
    assert metrics.get("model_params") == 119872
    assert metrics.get("seq_in") == 4
    assert metrics.get("seq_out") == 16

    model = TrackLSTM(input_dim=4, hidden_dim=96, output_dim=4, seq_out=16)
    param_count = sum(p.numel() for p in model.parameters())
    assert param_count == 119872


def test_predict_track_shape_and_lead_hours():
    """Verifies predict_track outputs 16 points with lead hours 3, 6, ..., 48."""
    dummy_points = [
        {"lat": 10.0, "lon": 85.0, "wind_kmph": 65.0, "pressure_hpa": 1000.0},
        {"lat": 11.0, "lon": 85.5, "wind_kmph": 80.0, "pressure_hpa": 995.0},
        {"lat": 12.2, "lon": 86.0, "wind_kmph": 110.0, "pressure_hpa": 985.0},
        {"lat": 13.5, "lon": 86.2, "wind_kmph": 140.0, "pressure_hpa": 970.0},
    ]

    preds = predict_track(dummy_points)
    assert len(preds) == 16
    expected_leads = [h for h in range(3, 51, 3)]
    for i, pt in enumerate(preds):
        assert pt["lead_hours"] == expected_leads[i]
        assert "lat" in pt
        assert "lon" in pt
        assert "wind_kmph" in pt
        assert "pressure_hpa" in pt


def test_fani_vs_amphan_predictions_differ(client: TestClient):
    """Verifies that calling the endpoint with Fani data vs Amphan data produces genuinely different predictions."""
    res_fani = client.post("/api/forecast/track", json={"cyclone_id": "BOB-02-2019"})
    assert res_fani.status_code == 200
    data_fani = res_fani.json()

    res_amphan = client.post("/api/forecast/track", json={"cyclone_id": "BOB-01-2020"})
    assert res_amphan.status_code == 200
    data_amphan = res_amphan.json()

    fani_points = data_fani["model_forecast"]
    amphan_points = data_amphan["model_forecast"]

    assert len(fani_points) == 16
    assert len(amphan_points) == 16

    # Compare 24h lead point (index 7: lead_hours=24)
    fani_24h = fani_points[7]
    amphan_24h = amphan_points[7]

    assert fani_24h["lead_hours"] == 24
    assert amphan_24h["lead_hours"] == 24

    # Predictions must be genuinely different
    assert fani_24h["lat"] != amphan_24h["lat"]
    assert fani_24h["lon"] != amphan_24h["lon"]
    assert fani_24h["wind_kmph"] != amphan_24h["wind_kmph"]


def test_forecast_api_validation_metrics(client: TestClient):
    """Verifies that the forecast endpoint returns the Colab validation metrics."""
    res = client.post("/api/forecast/track", json={"cyclone_id": "fani"})
    assert res.status_code == 200
    data = res.json()

    assert data["cyclone_id"] == "BOB-02-2019"
    assert data["rmse_24h_km"] == 85.6
    assert data["rmse_48h_km"] == 155.6
    assert data["wind_mae_kmph"] == 7.3
    assert data["pressure_mae_hpa"] == 2.9
    assert data["model_version"] == "track_lstm_v1"
    assert data["training_samples"] == 8484
    assert data["model_params"] == 119872
    assert len(data["model_forecast"]) == 16
    assert len(data["imd_official_forecast"]) > 0


def test_invalid_input_points_handled():
    """Verifies that fewer or more than 4 points raises ValueError."""
    with pytest.raises(ValueError):
        predict_track([{"lat": 10.0, "lon": 85.0, "wind_kmph": 65.0, "pressure_hpa": 1000.0}])
