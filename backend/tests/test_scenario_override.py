"""Tests for what-if scenario parameter overrides."""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.cyclone import (
    CycloneTrack,
    ScenarioOverride,
    TrackCategory,
    TrackPoint,
    apply_scenario_override,
)


def _make_dummy_track() -> CycloneTrack:
    points = [
        TrackPoint(
            timestamp=f"2019-05-01T{i:02d}:00:00Z",
            latitude=15.0 + i * 0.5,
            longitude=85.0 + i * 0.3,
            wind_speed_knots=100.0,
            wind_speed_kmph=185.2,
            central_pressure_hpa=950.0,
            category=TrackCategory.EXTREMELY_SEVERE_CYCLONIC_STORM,
            forward_speed_kmph=15.0,
        )
        for i in range(5)
    ]
    return CycloneTrack(
        id="BOB-02-2019",
        name="Fani",
        season_year=2019,
        basin="Bay of Bengal",
        current_status="Extremely Severe Cyclonic Storm",
        genesis_time="2019-04-26T00:00:00Z",
        track_points=points,
    )


def test_apply_scenario_override_wind_scaling():
    """Test apply_scenario_override correctly scales wind speeds by multiplier."""
    track = _make_dummy_track()
    override = ScenarioOverride(
        cyclone_id="fani",
        wind_multiplier=1.2,
        enabled=True,
    )
    modified = apply_scenario_override(track, override)

    assert len(modified.track_points) == 5
    for pt in modified.track_points:
        assert pt.wind_speed_knots == pytest.approx(120.0, rel=1e-2)
        assert pt.wind_speed_kmph == pytest.approx(185.2 * 1.2, rel=1e-2)


def test_apply_scenario_override_track_shift():
    """Test apply_scenario_override shifts all track points by specified lat/lon offsets."""
    track = _make_dummy_track()
    override = ScenarioOverride(
        cyclone_id="fani",
        track_shift_lat=0.5,
        track_shift_lon=-0.4,
        enabled=True,
    )
    modified = apply_scenario_override(track, override)

    for orig, mod in zip(track.track_points, modified.track_points):
        assert mod.latitude == pytest.approx(orig.latitude + 0.5, abs=1e-4)
        assert mod.longitude == pytest.approx(orig.longitude - 0.4, abs=1e-4)


def test_apply_scenario_override_pressure_offset():
    """Test apply_scenario_override adds pressure offset to all points and scales forward speed."""
    track = _make_dummy_track()
    override = ScenarioOverride(
        cyclone_id="fani",
        pressure_offset_hpa=-15.0,
        forward_speed_multiplier=1.5,
        enabled=True,
    )
    modified = apply_scenario_override(track, override)

    for orig, mod in zip(track.track_points, modified.track_points):
        assert mod.central_pressure_hpa == pytest.approx(935.0, rel=1e-2)
        assert mod.forward_speed_kmph == pytest.approx(22.5, rel=1e-2)


def test_scenario_flows_through_forecast_track_endpoint():
    """Test /api/forecast/track accepts scenario override and returns updated forecasts."""
    client = TestClient(app)
    
    # Baseline request
    res_base = client.post(
        "/api/forecast/track",
        json={"cyclone_id": "BOB-02-2019"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert res_base.status_code == 200
    data_base = res_base.json()

    # Scenario override with 1.3x wind multiplier
    res_scenario = client.post(
        "/api/forecast/track",
        json={
            "cyclone_id": "BOB-02-2019",
            "scenario": {
                "cyclone_id": "BOB-02-2019",
                "wind_multiplier": 1.3,
                "pressure_offset_hpa": -10.0,
                "track_shift_lat": 0.2,
                "track_shift_lon": 0.2,
                "forward_speed_multiplier": 1.1,
                "enabled": True,
            },
        },
        headers={"Authorization": "Bearer test-token"},
    )
    assert res_scenario.status_code == 200
    data_scenario = res_scenario.json()

    assert "model_forecast" in data_scenario
    assert len(data_scenario["model_forecast"]) > 0
    # First IMD point wind should be higher in the scenario
    base_wind = data_base["imd_official_forecast"][0]["wind_kmph"]
    scen_wind = data_scenario["imd_official_forecast"][0]["wind_kmph"]
    assert scen_wind > base_wind
