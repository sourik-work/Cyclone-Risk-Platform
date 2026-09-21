"""Unit tests for FastAPI routes and endpoints."""

from backend.api.routes import (
    GenerateAdvisoryRequest,
    generate_advisory,
    get_coastal_vulnerability,
    get_cyclone_track,
    get_latest_advisory,
    get_live_cyclone,
    health_check,
    list_cyclone_tracks,
)


def test_api_health_check():
    res = health_check()
    assert res["status"] == "ok"
    assert res["service"] == "cyclone-risk-platform"


def test_api_list_tracks():
    tracks = list_cyclone_tracks()
    assert len(tracks) >= 2
    ids = {t["id"] for t in tracks}
    assert "BOB-02-2019" in ids  # Fani


def test_api_get_track():
    track = get_cyclone_track("BOB-02-2019")
    assert track.name == "Fani"
    assert len(track.track_points) > 5

    # Test case-insensitive lookup by name
    track_by_name = get_cyclone_track("amphan")
    assert track_by_name.name == "Amphan"


def test_api_get_vulnerability():
    vulnerability = get_coastal_vulnerability()
    assert vulnerability.type == "FeatureCollection"
    assert len(vulnerability.features) == 16

    # Test state filtering
    odisha = get_coastal_vulnerability(state="Odisha")
    assert len(odisha.features) == 6

    wb = get_coastal_vulnerability(state="West Bengal")
    assert len(wb.features) == 3

    ap = get_coastal_vulnerability(state="Andhra Pradesh")
    assert len(ap.features) == 4

    tn = get_coastal_vulnerability(state="Tamil Nadu")
    assert len(tn.features) == 3


def test_api_generate_and_latest_advisory():
    req = GenerateAdvisoryRequest(
        cyclone_id="BOB-02-2019",
        point_index=7,
        target_districts=["Puri", "Kendrapara"],
        lead_time_hours=14.0,
    )
    advisory = generate_advisory(req)
    assert advisory.cyclone_id == "BOB-02-2019"
    assert advisory.lead_time_hours == 14.0
    assert "Puri" in advisory.target_districts
    assert advisory.model == "gemini-3.7-flash"

    # Verify latest returns the generated advisory
    latest = get_latest_advisory()
    assert latest.advisory_id == advisory.advisory_id
    assert latest.model == "gemini-3.7-flash"


def test_api_get_live_cyclone():
    res = get_live_cyclone(refresh=False)
    assert res.source == "IMD RSMC New Delhi"
    assert res.status in ("active", "monitoring")
    assert res.last_updated is not None
    if res.status == "monitoring":
        assert res.active_cyclone is None
        assert "No active cyclones in Bay of Bengal" in res.message
    else:
        assert res.active_cyclone is not None


def test_api_generate_advisory_live_monitoring():
    from unittest.mock import patch
    from backend.schemas.cyclone import AdvisorySeverity, LiveCycloneResponse

    mock_resp = LiveCycloneResponse(
        active_cyclone=None,
        last_updated="2026-09-22T00:00:00Z",
        source="IMD RSMC New Delhi",
        status="monitoring",
        message="No active cyclones in Bay of Bengal. Monitoring continuously.",
    )

    with patch("backend.api.routes._IMD_FETCHER.get_live_cyclone_status", return_value=mock_resp):
        req = GenerateAdvisoryRequest(cyclone_id="IMD-LIVE-ACTIVE")
        advisory = generate_advisory(req)
        assert advisory.cyclone_id == "IMD-LIVE-ACTIVE"
        assert advisory.severity_level == AdvisorySeverity.MONITORING
        assert "MONITORING" in advisory.headline
        assert advisory.recommended_actions == []


def test_api_generate_advisory_live_active():
    from unittest.mock import patch
    from backend.schemas.cyclone import CycloneTrack, LiveCycloneResponse, TrackCategory, TrackPoint

    pt = TrackPoint(
        timestamp="2026-09-22T00:00:00Z",
        latitude=18.5,
        longitude=86.2,
        wind_speed_knots=65.0,
        wind_speed_kmph=120.0,
        central_pressure_hpa=980.0,
        category=TrackCategory.VERY_SEVERE_CYCLONIC_STORM,
    )
    track = CycloneTrack(
        id="IMD-LIVE-2026-OVER",
        name="OVER",
        season_year=2026,
        basin="Bay of Bengal",
        current_status="Very Severe Cyclonic Storm",
        genesis_time="2026-09-22T00:00:00Z",
        track_points=[pt],
    )
    mock_resp = LiveCycloneResponse(
        active_cyclone=track,
        last_updated="2026-09-22T00:00:00Z",
        source="IMD RSMC New Delhi",
        status="active",
        message="Active cyclone detected: OVER in Bay of Bengal.",
    )

    with patch("backend.api.routes._IMD_FETCHER.get_live_cyclone_status", return_value=mock_resp):
        # 1. Test with stable ID
        req1 = GenerateAdvisoryRequest(cyclone_id="IMD-LIVE-ACTIVE")
        adv1 = generate_advisory(req1)
        assert "OVER" in adv1.headline
        assert adv1.max_expected_wind_kmph == 120.0

        # 2. Test with bulletin ID
        req2 = GenerateAdvisoryRequest(cyclone_id="IMD-LIVE-2026-OVER")
        adv2 = generate_advisory(req2)
        assert "OVER" in adv2.headline


def test_api_generate_advisory_unknown_404():
    import pytest
    from fastapi import HTTPException

    req = GenerateAdvisoryRequest(cyclone_id="UNKNOWN-TRACK-999")
    with pytest.raises(HTTPException) as exc_info:
        generate_advisory(req)
    assert exc_info.value.status_code == 404


if __name__ == "__main__":
    test_api_health_check()
    test_api_list_tracks()
    test_api_get_track()
    test_api_get_vulnerability()
    test_api_generate_and_latest_advisory()
    test_api_get_live_cyclone()
    test_api_generate_advisory_live_monitoring()
    test_api_generate_advisory_live_active()
    test_api_generate_advisory_unknown_404()
    print("All API route tests passed successfully!")
