"""Tests for Data Staleness Monitoring, Health Checks, and Circuit Breakers."""

from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
import pytest

from backend.main import app
from backend.services.health_service import CircuitBreaker, HealthRegistry


@pytest.fixture
def client():
    return TestClient(app)


def test_health_live_endpoint_returns_200(client):
    """Verify liveness probe returns 200 and alive status."""
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert "timestamp" in data


def test_health_ready_endpoint_returns_200(client):
    """Verify readiness probe returns 200 and ready status."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "services" in data
    assert data["services"]["gemini"] == "ok"


def test_health_freshness_healthy_when_recently_updated(client):
    """Verify freshness report returns healthy status when feeds are fresh."""
    registry = HealthRegistry()
    registry.record_imd_fetch(success=True)
    registry.record_gee_fetch(success=True)
    report = registry.get_freshness_report()

    assert report["status"] == "healthy"
    assert report["imd_bulletin_age_minutes"] < 5.0
    assert report["gee_tile_age_minutes"] < 5.0
    assert report["circuit_breakers"]["imd_fetcher"]["state"] == "CLOSED"


def test_health_freshness_degraded_when_imd_bulletin_is_stale():
    """Verify status drops to degraded when IMD bulletin exceeds 45-minute threshold."""
    registry = HealthRegistry()
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=50)
    registry.last_imd_fetch = stale_time
    report = registry.get_freshness_report()

    assert report["status"] == "degraded"
    assert report["imd_bulletin_age_minutes"] >= 45.0


def test_health_freshness_degraded_when_gee_tile_is_stale():
    """Verify status drops to degraded when GEE satellite imagery exceeds 360-minute threshold."""
    registry = HealthRegistry()
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=400)
    registry.last_gee_fetch = stale_time
    report = registry.get_freshness_report()

    assert report["status"] == "degraded"
    assert report["gee_tile_age_minutes"] >= 360.0


def test_circuit_breaker_trips_after_five_consecutive_failures():
    """Verify circuit breaker transitions from CLOSED to OPEN after 5 failures."""
    cb = CircuitBreaker("TestCircuit", failure_threshold=5, recovery_timeout_sec=10.0)
    assert cb.state == "CLOSED"
    assert cb.can_execute() is True

    for i in range(4):
        cb.record_failure(RuntimeError(f"Fail {i+1}"))
        assert cb.state == "CLOSED"

    # 5th failure trips the breaker
    cb.record_failure(RuntimeError("Fail 5"))
    assert cb.state == "OPEN"
    assert cb.can_execute() is False
    assert cb.consecutive_failures == 5


def test_circuit_breaker_half_open_and_recovery_flow():
    """Verify circuit breaker transitions to HALF_OPEN after timeout and recovers to CLOSED on success."""
    cb = CircuitBreaker("TestRecovery", failure_threshold=2, recovery_timeout_sec=0.1)
    cb.record_failure(RuntimeError("Fail 1"))
    cb.record_failure(RuntimeError("Fail 2"))
    assert cb.state == "OPEN"

    # Simulate elapsed timeout
    cb.last_failure_time = datetime.now(timezone.utc) - timedelta(seconds=1.0)
    assert cb.can_execute() is True
    assert cb.state == "HALF_OPEN"

    # Successful call resets breaker to CLOSED
    cb.record_success()
    assert cb.state == "CLOSED"
    assert cb.consecutive_failures == 0


def test_health_freshness_critical_on_severe_staleness_and_tripped_circuits():
    """Verify critical status is returned when multiple failures or extreme staleness occurs."""
    registry = HealthRegistry()
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=150)
    registry.last_imd_fetch = stale_time
    registry.last_gee_fetch = datetime.now(timezone.utc) - timedelta(minutes=800)

    for _ in range(5):
        registry.imd_circuit.record_failure(RuntimeError("IMD Outage"))
        registry.gee_circuit.record_failure(RuntimeError("GEE Outage"))

    report = registry.get_freshness_report()
    assert report["status"] == "critical"
    assert report["circuit_breakers"]["imd_fetcher"]["state"] == "OPEN"
    assert report["circuit_breakers"]["gee_fetcher"]["state"] == "OPEN"


def test_firestore_write_recording_and_event_history():
    """Verify Firestore writes and ingestion events are registered in audit log."""
    registry = HealthRegistry()
    registry.record_firestore_write(collection="advisories", doc_id="adv-123", actor="duty_officer", reason="approved")
    report = registry.get_freshness_report()

    assert report["recent_ingestion_events"] > 0
    assert report["firestore_write_age_minutes"] < 5.0
