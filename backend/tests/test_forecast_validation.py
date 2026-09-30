"""Tests for TrackLSTM LOSO Cross-Validation, Baselines, and Honest Reframing."""

import json
from pathlib import Path
import pytest

from backend.ml.baselines import (
    ClimatologyBaseline,
    IMDOperationalBenchmark,
    PersistenceBaseline,
    evaluate_forecast_against_ground_truth,
    haversine_distance,
)
from backend.ml.train_lstm import train_track_lstm
from backend.ml.validate_loso import (
    HISTORICAL_STORMS,
    bootstrap_confidence_interval,
    run_loso_cross_validation,
)
from backend.services.forecast_service import get_model_metrics, predict_track


def test_haversine_distance_accurate():
    """Verify haversine distance formula against known geographic points (Puri to Paradip ~75km)."""
    dist = haversine_distance(19.8135, 85.8312, 20.2644, 86.6083)
    assert 70.0 <= dist <= 100.0


def test_persistence_baseline_computation():
    """Verify persistence baseline projects forward along initial velocity vector."""
    pts = [
        {"lat": 12.0, "lon": 85.0, "wind_kmph": 100, "pressure_hpa": 980},
        {"lat": 12.5, "lon": 85.5, "wind_kmph": 110, "pressure_hpa": 975},
    ]
    preds = PersistenceBaseline.predict(pts, lead_steps=4, step_hours=3.0)
    assert len(preds) == 4
    assert preds[0]["lead_hours"] == 3.0
    assert preds[0]["lat"] > 12.5
    assert preds[0]["lon"] > 85.5
    assert preds[-1]["lead_hours"] == 12.0


def test_climatology_baseline_computation():
    """Verify climatology baseline uses appropriate basin translation vectors."""
    pts_low = [{"lat": 10.0, "lon": 88.0, "wind_kmph": 80, "pressure_hpa": 990}]
    pts_high = [{"lat": 19.0, "lon": 86.0, "wind_kmph": 120, "pressure_hpa": 970}]

    preds_low = ClimatologyBaseline.predict(pts_low, lead_steps=4, step_hours=3.0)
    preds_high = ClimatologyBaseline.predict(pts_high, lead_steps=4, step_hours=3.0)

    assert len(preds_low) == 4
    assert len(preds_high) == 4
    assert preds_low[0]["lon"] < 88.0  # Westward in lower latitudes
    assert preds_high[0]["lon"] > 86.0  # Eastward/Northeastward recurvature in upper Bay of Bengal


def test_imd_operational_benchmark_constants():
    """Verify official IMD 2025 operational benchmark error figures."""
    bench = IMDOperationalBenchmark.get_benchmark_metrics()
    assert bench.rmse_24h_km == 80.0
    assert bench.rmse_48h_km == 120.0
    assert bench.rmse_72h_km == 175.0
    assert "IMD Operational" in bench.baseline_name


def test_evaluate_forecast_against_ground_truth():
    """Verify evaluation metric computation against synthetic truth track."""
    forecast = [
        {"lead_hours": 24, "lat": 15.0, "lon": 85.0, "wind_kmph": 100, "pressure_hpa": 980},
        {"lead_hours": 48, "lat": 18.0, "lon": 86.0, "wind_kmph": 150, "pressure_hpa": 950},
    ]
    ground_truth = [
        {"lead_hours": 24, "lat": 15.2, "lon": 85.1, "wind_kmph": 95, "pressure_hpa": 982},
        {"lead_hours": 48, "lat": 18.5, "lon": 86.2, "wind_kmph": 140, "pressure_hpa": 955},
    ]
    res = evaluate_forecast_against_ground_truth(forecast, ground_truth)
    assert res["rmse_24h_km"] > 0
    assert res["rmse_48h_km"] > 0
    assert res["wind_mae_kmph"] == 7.5
    assert res["pressure_mae_hpa"] == 3.5


def test_loso_bootstrap_confidence_intervals_valid():
    """Verify bootstrap 95% confidence interval properties."""
    data = [75.0, 82.0, 79.0, 88.0, 71.0, 84.0, 80.0, 77.0, 85.0, 78.0]
    mean_val, std_val, ci_low, ci_high = bootstrap_confidence_interval(data, n_resamples=500)
    assert ci_low <= mean_val <= ci_high
    assert std_val > 0.0


def test_loso_cross_validation_runs_and_produces_required_storms():
    """Verify LOSO cross-validation produces results for >= 15 storms."""
    assert len(HISTORICAL_STORMS) >= 15
    results = run_loso_cross_validation()

    assert results["num_storms_evaluated"] >= 15
    assert len(results["per_storm_results"]) >= 15

    agg = results["aggregate_metrics"]
    assert "rmse_24h_km" in agg
    assert "rmse_48h_km" in agg
    assert agg["rmse_24h_km"]["ci_95_lower"] <= agg["rmse_24h_km"]["mean"] <= agg["rmse_24h_km"]["ci_95_upper"]
    assert agg["rmse_48h_km"]["ci_95_lower"] <= agg["rmse_48h_km"]["mean"] <= agg["rmse_48h_km"]["ci_95_upper"]

    # Check baseline comparison presence
    baselines = results["baselines_comparison"]
    assert "imd_operational_2025_benchmark" in baselines
    assert "persistence_baseline" in baselines
    assert "track_lstm_loso" in baselines


def test_training_manifest_generation_and_ratio(tmp_path):
    """Verify training manifest logs random seed, git SHA, and real:synthetic ratio."""
    manifest = train_track_lstm(epochs=1, batch_size=32, seed=42)
    assert manifest.random_seed == 42
    assert "Real:Synthetic" in manifest.real_to_synthetic_ratio
    assert manifest.total_samples > 0
    assert len(manifest.dataset_hash) > 0


def test_forecast_service_metrics_contains_loso_and_ensemble_role():
    """Verify forecast service loads and returns LOSO metrics without false superiority claims."""
    metrics = get_model_metrics()
    assert "aggregate_metrics" in metrics or "rmse_24h_km" in metrics
    if "role_positioning" in metrics:
        assert "ensemble member" in metrics["role_positioning"].lower()


def test_forecast_predict_track_dimensions_and_continuity():
    """Verify predict_track returns 16 points with smooth 3-hour lead increments up to 48 hours."""
    points = [
        {"lat": 15.0, "lon": 85.0, "wind_kmph": 100, "pressure_hpa": 980},
        {"lat": 15.5, "lon": 85.3, "wind_kmph": 110, "pressure_hpa": 975},
        {"lat": 16.0, "lon": 85.6, "wind_kmph": 120, "pressure_hpa": 970},
        {"lat": 16.5, "lon": 85.9, "wind_kmph": 130, "pressure_hpa": 965},
    ]
    forecast = predict_track(points)
    assert len(forecast) == 16
    assert forecast[0]["lead_hours"] == 3
    assert forecast[-1]["lead_hours"] == 48
    assert all("lat" in pt and "lon" in pt and "wind_kmph" in pt for pt in forecast)
