"""Unit tests for FastAPI routes and endpoints."""

from backend.api.routes import (
    GenerateAdvisoryRequest,
    generate_advisory,
    get_coastal_vulnerability,
    get_cyclone_track,
    get_latest_advisory,
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
    assert len(vulnerability.features) == 6


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


if __name__ == "__main__":
    test_api_health_check()
    test_api_list_tracks()
    test_api_get_track()
    test_api_get_vulnerability()
    test_api_generate_and_latest_advisory()
    print("All API route tests passed successfully!")
