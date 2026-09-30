"""Unit tests for APAC Meteorological Agency Adapters."""

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.agency_adapters.base_adapter import MetAgencyAdapter
from backend.services.agency_adapters import (
    AGENCY_ADAPTERS,
    IMDAdapter,
    JTWCAdapter,
    PAGASAAdapter,
    BMKGAdapter,
    DMHAdapter,
)

client = TestClient(app)


def test_every_adapter_implements_base_interface():
    """Verify that every adapter inherits from MetAgencyAdapter and defines required methods and attributes."""
    for key, adapter in AGENCY_ADAPTERS.items():
        assert isinstance(adapter, MetAgencyAdapter), f"{key} must inherit from MetAgencyAdapter"
        assert hasattr(adapter, "fetch_live_bulletins"), f"{key} missing fetch_live_bulletins"
        assert callable(adapter.fetch_live_bulletins), f"{key}.fetch_live_bulletins must be callable"
        assert hasattr(adapter, "get_status"), f"{key} missing get_status"
        assert callable(adapter.get_status), f"{key}.get_status must be callable"
        assert adapter.AGENCY_NAME != "Unknown", f"{key} must define AGENCY_NAME"
        assert adapter.AGENCY_URL, f"{key} must define AGENCY_URL"
        assert adapter.COVERAGE_REGION, f"{key} must define COVERAGE_REGION"

        # Call fetch_live_bulletins (for stubs, returns list)
        bulletins = adapter.fetch_live_bulletins()
        assert isinstance(bulletins, list), f"{key}.fetch_live_bulletins must return list"


def test_agency_adapters_registry_keys():
    """Verify AGENCY_ADAPTERS registry has expected 5 agency keys."""
    expected_keys = {"india", "jtwc", "philippines", "indonesia", "myanmar"}
    assert set(AGENCY_ADAPTERS.keys()) == expected_keys
    assert isinstance(AGENCY_ADAPTERS["india"], IMDAdapter)
    assert isinstance(AGENCY_ADAPTERS["jtwc"], JTWCAdapter)
    assert isinstance(AGENCY_ADAPTERS["philippines"], PAGASAAdapter)
    assert isinstance(AGENCY_ADAPTERS["indonesia"], BMKGAdapter)
    assert isinstance(AGENCY_ADAPTERS["myanmar"], DMHAdapter)


def test_each_adapter_get_status_required_fields():
    """Verify each adapter's get_status returns the required schema keys."""
    required_fields = {
        "agency",
        "status",
        "region",
        "last_checked",
        "bulletin_count",
        "integration_status",
    }
    for key, adapter in AGENCY_ADAPTERS.items():
        status = adapter.get_status()
        assert isinstance(status, dict), f"{key}.get_status must return dict"
        for field in required_fields:
            assert field in status, f"{key}.get_status missing field '{field}'"
        assert status["status"] in ("active", "monitoring", "unavailable")
        assert status["integration_status"] in ("stub", "partial", "live")
        assert isinstance(status["bulletin_count"], int)
        assert isinstance(status["last_checked"], str)


def test_api_agencies_status_endpoint():
    """Verify GET /api/agencies/status endpoint returns all 5 agencies."""
    res = client.get("/api/agencies/status")
    assert res.status_code == 200
    data = res.json()
    assert "agencies" in data
    assert isinstance(data["agencies"], list)
    assert len(data["agencies"]) == 5

    agencies = data["agencies"]
    agency_names = {a["agency"] for a in agencies}
    assert "IMD" in agency_names or "IMD (India)" in agency_names or any("IMD" in a["agency"] for a in agencies)
    assert "JTWC" in agency_names
    assert "PAGASA" in agency_names
    assert "BMKG" in agency_names
    assert "DMH" in agency_names

    # Check live vs stub statuses
    imd_status = next(a for a in agencies if "IMD" in a["agency"])
    assert imd_status["integration_status"] == "live"

    for live_name in ["JTWC", "PAGASA"]:
        live_status = next(a for a in agencies if a["agency"] == live_name)
        assert live_status["integration_status"] == "live"

    for stub_name in ["BMKG", "DMH"]:
        stub_status = next(a for a in agencies if a["agency"] == stub_name)
        assert stub_status["integration_status"] == "stub"
