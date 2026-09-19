"""Unit and integration tests for Workstream 4 — BigQuery Integration service and endpoints."""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.cyclone import HistoricalAnalyticsResponse
from backend.services.bigquery_service import (
    clear_cache,
    get_bigquery_client,
    get_cyclone_tracks,
    get_hazard_summary,
    get_historical_analytics,
    get_infrastructure_assets,
    get_vulnerability_districts,
    insert_advisory_log,
    insert_live_bulletin,
    reset_client,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_service_cache():
    """Ensure clean cache and client state before each test."""
    clear_cache()
    reset_client()
    yield
    clear_cache()
    reset_client()


# ==============================================================================
# 1. Connection & Graceful Failure
# ==============================================================================

def test_bigquery_client_graceful_missing_credentials(monkeypatch):
    """Verify get_bigquery_client returns None when ADC is absent or raises auth error."""
    with patch("google.auth.default", side_effect=Exception("No credentials")):
        c = get_bigquery_client()
        assert c is None


# ==============================================================================
# 2. Query Building & Mock BigQuery Client
# ==============================================================================

def test_bigquery_tracks_query_mock():
    """Verify that get_cyclone_tracks executes query on BigQuery client when available."""
    mock_client = MagicMock()
    mock_row = {
        "cyclone_id": "BOB-02-2019",
        "season_year": 2019,
        "point_index": 0,
        "latitude": 2.7,
        "longitude": 88.7,
        "wind_kmph": 45.0,
        "pressure_hpa": 1004.0,
        "timestamp": "2019-04-26T06:00:00Z",
        "is_forecast": False,
    }
    mock_job = MagicMock()
    mock_job.result.return_value = [mock_row]
    mock_client.query.return_value = mock_job

    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=mock_client):
        tracks = get_cyclone_tracks(cyclone_id="BOB-02-2019")
        assert len(tracks) == 1
        assert tracks[0]["cyclone_id"] == "BOB-02-2019"
        assert mock_client.query.called


def test_bigquery_vulnerability_query_mock():
    """Verify that get_vulnerability_districts executes parameterized query on BigQuery client."""
    mock_client = MagicMock()
    mock_row = {
        "district_id": "OD-PUR",
        "district_name": "Puri",
        "state_name": "Odisha",
        "population": 1698730,
        "kutcha_population": 420000,
        "shelter_capacity": 210000,
        "coastline_km": 150.4,
        "elevation_m": 4.5,
        "vulnerability_score": 0.94,
        "inundation_risk": 4.8,
    }
    mock_job = MagicMock()
    mock_job.result.return_value = [mock_row]
    mock_client.query.return_value = mock_job

    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=mock_client):
        districts = get_vulnerability_districts(state="Odisha", district="Puri")
        assert len(districts) == 1
        assert districts[0]["district_name"] == "Puri"
        assert mock_client.query.called


# ==============================================================================
# 3. Local JSON Fallback Resilience
# ==============================================================================

def test_fallback_get_cyclone_tracks():
    """Verify get_cyclone_tracks loads from local JSON files when BigQuery client is None."""
    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=None):
        tracks = get_cyclone_tracks()
        assert len(tracks) >= 20
        first = tracks[0]
        assert "cyclone_id" in first
        assert "wind_kmph" in first
        assert "latitude" in first
        assert "longitude" in first

        # Test filter by cyclone_id
        fani_tracks = get_cyclone_tracks(cyclone_id="fani")
        assert len(fani_tracks) > 5
        assert all("BOB-02-2019" in t["cyclone_id"] or "fani" in t["cyclone_id"].lower() for t in fani_tracks)


def test_fallback_get_vulnerability_districts():
    """Verify get_vulnerability_districts loads from local GeoJSON files when BigQuery client is None."""
    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=None):
        odisha_districts = get_vulnerability_districts(state="Odisha")
        assert len(odisha_districts) == 6
        names = [d["district_name"] for d in odisha_districts]
        assert "Puri" in names
        assert "Ganjam" in names

        puri = get_vulnerability_districts(state="Odisha", district="Puri")
        assert len(puri) == 1
        assert puri[0]["population"] >= 1_600_000


def test_fallback_get_infrastructure_assets():
    """Verify get_infrastructure_assets loads from local GeoJSON when BigQuery is unavailable."""
    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=None):
        assets = get_infrastructure_assets(state="Odisha")
        assert len(assets) > 0
        first = assets[0]
        assert "asset_id" in first
        assert "name" in first
        assert "latitude" in first
        assert "longitude" in first


def test_fallback_insert_bulletin_and_advisory():
    """Verify insert methods gracefully return tracking IDs when BigQuery is unavailable."""
    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=None):
        b_id = insert_live_bulletin({"source": "IMD", "cyclone_name": "TestStorm"})
        assert "bulletin" in b_id

        adv_id = insert_advisory_log({"advisory_id": "ADV-999", "cyclone_id": "BOB-02-2019"})
        assert adv_id == "ADV-999"


# ==============================================================================
# 4. In-Memory 5-minute TTL Caching
# ==============================================================================

def test_bigquery_ttl_caching():
    """Verify identical queries return from in-memory cache without repeating fetch."""
    with patch("backend.services.bigquery_service.get_bigquery_client", return_value=None):
        res1 = get_cyclone_tracks("fani")
        res2 = get_cyclone_tracks("fani")
        assert res1 is res2  # exact same object in memory cache


# ==============================================================================
# 5. Historical Analytics Response Shape & Verification
# ==============================================================================

def test_get_historical_analytics_odisha():
    """Verify get_historical_analytics returns expected aggregate statistics for Odisha."""
    analytics = get_historical_analytics("Odisha")

    # Validate against schema
    validated = HistoricalAnalyticsResponse.model_validate(analytics)
    assert validated.state == "Odisha"
    assert validated.total_districts == 6
    assert validated.total_population == 11577000
    assert validated.avg_vulnerability_score == 0.77
    assert validated.total_shelters == 1570
    assert "Fani 2019" in validated.historical_cyclones
    assert validated.avg_storm_surge_m == 4.2


def test_get_historical_analytics_other_states():
    """Verify analytics calculation for other coastal states (West Bengal, Andhra Pradesh, Tamil Nadu)."""
    wb = get_historical_analytics("West Bengal")
    assert wb["total_districts"] == 3
    assert wb["total_population"] > 5_000_000
    assert "Amphan 2020" in wb["historical_cyclones"]

    ap = get_historical_analytics("Andhra Pradesh")
    assert ap["total_districts"] == 4
    assert ap["total_population"] > 5_000_000


# ==============================================================================
# 6. API Endpoints Integration
# ==============================================================================

def test_api_endpoint_analytics_historical():
    """GET /api/analytics/historical?state=Odisha returns 200 OK and conforms to schema."""
    resp = client.get("/api/analytics/historical?state=Odisha")
    assert resp.status_code == 200
    data = resp.json()
    assert data["state"] == "Odisha"
    assert data["total_districts"] == 6
    assert data["total_population"] == 11577000
    assert data["avg_vulnerability_score"] == 0.77
    assert data["total_shelters"] == 1570
    assert "Fani 2019" in data["historical_cyclones"]
    assert data["avg_storm_surge_m"] == 4.2


def test_api_endpoint_tracks_source_bigquery():
    """GET /api/tracks?source=bigquery returns 200 OK and valid track summaries."""
    resp = client.get("/api/tracks?source=bigquery")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    ids = [t["id"] for t in data]
    assert "BOB-02-2019" in ids
