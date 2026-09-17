"""Unit tests for IMD bulletin scraper and parser service."""

from unittest.mock import MagicMock, patch
from backend.services.imd_fetcher import IMDFetcherService
from backend.schemas.cyclone import TrackCategory


SAMPLE_BULLETIN_TEXT = """
REGIONAL SPECIALISED METEOROLOGICAL CENTRE-TROPICAL CYCLONES, NEW DELHI
SPECIAL TROPICAL WEATHER OUTLOOK
DEMS-RSMC TROPICAL CYCLONES NEW DELHI DATED 18.09.2026

THE VERY SEVERE CYCLONIC STORM "DANA" OVER CENTRAL BAY OF BENGAL
MOVED NORTH-NORTHWESTWARDS WITH A SPEED OF 15 KMPH.
IT LAY CENTERED AT 0300 UTC OF 18TH SEPTEMBER 2026 OVER NORTHWEST BAY OF BENGAL
NEAR LATITUDE 19.8 N AND LONGITUDE 87.2 E, ABOUT 140 KM SOUTHEAST OF PURI (ODISHA).

ESTIMATED CENTRAL PRESSURE OF ABOUT 978 HPA.
MAXIMUM SUSTAINED SURFACE WIND SPEED OF 65 KNOTS (120 KMPH) GUSTING TO 75 KNOTS.

FORECAST TRACK AND INTENSITY ARE GIVEN IN THE TABLE BELOW:
18.09.2026/0600 UTC 20.2 N 86.8 E 65 KTS
18.09.2026/1200 UTC 20.7 N 86.4 E 60 KTS
19.09.2026/0000 UTC 21.3 N 85.8 E 40 KTS
"""


def test_parse_active_cyclone_bulletin():
    service = IMDFetcherService()
    track = service.parse_bulletin_text(SAMPLE_BULLETIN_TEXT, fallback_name="Dana")

    assert track is not None
    assert track.name.lower() == "dana"
    assert track.basin == "Bay of Bengal"
    assert len(track.track_points) >= 3

    current = track.track_points[0]
    assert current.latitude == 19.8
    assert current.longitude == 87.2
    assert current.wind_speed_knots == 65
    assert current.wind_speed_kmph == 120
    assert current.central_pressure_hpa == 978
    assert current.category == TrackCategory.VERY_SEVERE_CYCLONIC_STORM
    assert not current.is_forecast

    # Verify forecast points
    forecast_points = [p for p in track.track_points if p.is_forecast]
    assert len(forecast_points) >= 2
    assert forecast_points[0].latitude == 20.2
    assert forecast_points[0].longitude == 86.8


def test_monitoring_status_when_no_active_cyclone():
    service = IMDFetcherService(cache_ttl_seconds=1)
    
    # Mock HTTP responses to simulate RSMC with No_Cyclone.pdf
    mock_rsmc_html = """
    <html><body>
    <a href="uploads/archive/1/1_No_Cyclone.pdf">National Bulletin</a>
    <a href="uploads/archive/6/No_Cyclone.pdf">Observed & Forecast Track</a>
    <p>BAY OF BENGAL: Prob of cyclogenesis: NIL</p>
    </body></html>
    """
    
    with patch.object(service, "_http_get", return_value=mock_rsmc_html):
        res = service.get_live_cyclone_status(force_refresh=True)
        assert res.status == "monitoring"
        assert res.active_cyclone is None
        assert res.source == "IMD RSMC New Delhi"
        assert "No active cyclones in Bay of Bengal. Monitoring continuously." in res.message
        assert res.last_updated is not None


def test_service_caching():
    service = IMDFetcherService(cache_ttl_seconds=60)
    with patch.object(service, "_fetch_and_parse") as mock_fetch:
        from backend.schemas.cyclone import LiveCycloneResponse
        mock_fetch.return_value = LiveCycloneResponse(
            active_cyclone=None,
            last_updated="2026-09-18T00:00:00Z",
            source="IMD RSMC New Delhi",
            status="monitoring",
            message="No active cyclones in Bay of Bengal. Monitoring continuously.",
        )
        
        # First call triggers fetch
        r1 = service.get_live_cyclone_status()
        assert mock_fetch.call_count == 1

        # Second call within TTL returns cached without re-fetching
        r2 = service.get_live_cyclone_status()
        assert mock_fetch.call_count == 1
        assert r1.last_updated == r2.last_updated

        # Force refresh bypasses cache
        r3 = service.get_live_cyclone_status(force_refresh=True)
        assert mock_fetch.call_count == 2
