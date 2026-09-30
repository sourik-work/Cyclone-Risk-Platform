"""Tests for JTWC Live Agency Adapter and Text Parser."""

from pathlib import Path
import pytest

from backend.services.agency_adapters.jtwc_adapter import JTWCAdapter

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "jtwc"


def test_jtwc_parser_warning_1_super_typhoon_yagi():
    """Verify parsing JTWC Super Typhoon Yagi (12W) warning."""
    adapter = JTWCAdapter()
    file_path = FIXTURES_DIR / "jtwc_warning_1.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    parsed = adapter.parse_warning_text(text)
    assert "YAGI" in parsed["storm_name"] or "12W" in parsed["storm_name"]
    assert parsed["category"] == "SUPER TYPHOON"
    assert parsed["latitude"] == 19.3
    assert parsed["longitude"] == 114.2
    assert parsed["wind_knots"] == 130.0
    assert parsed["gust_kmph"] > 250.0
    assert parsed["central_pressure_hpa"] == 924.0
    assert len(parsed["forecast_track"]) >= 3
    assert parsed["forecast_track"][0]["lead_hours"] == 12
    assert parsed["forecast_track"][1]["lead_hours"] == 24


def test_jtwc_parser_warning_2_man_yi():
    """Verify parsing JTWC Super Typhoon Man-Yi (25W) warning."""
    adapter = JTWCAdapter()
    file_path = FIXTURES_DIR / "jtwc_warning_2.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    parsed = adapter.parse_warning_text(text)
    assert "MAN-YI" in parsed["storm_name"] or "25W" in parsed["storm_name"]
    assert parsed["category"] == "SUPER TYPHOON"
    assert parsed["latitude"] == 13.9
    assert parsed["longitude"] == 124.7
    assert parsed["wind_knots"] == 140.0
    assert parsed["central_pressure_hpa"] == 918.0
    assert len(parsed["forecast_track"]) >= 3


def test_jtwc_parser_warning_3_cyclone_dana():
    """Verify parsing JTWC Tropical Cyclone Dana (02B) warning in Bay of Bengal."""
    adapter = JTWCAdapter()
    file_path = FIXTURES_DIR / "jtwc_warning_3.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    parsed = adapter.parse_warning_text(text)
    assert "DANA" in parsed["storm_name"] or "02B" in parsed["storm_name"]
    assert parsed["category"] in ("TYPHOON", "CYCLONIC STORM", "TROPICAL STORM")
    assert parsed["latitude"] == 18.2
    assert parsed["longitude"] == 88.1
    assert parsed["wind_knots"] == 65.0
    assert parsed["central_pressure_hpa"] == 982.0
    assert len(parsed["forecast_track"]) >= 3


def test_jtwc_adapter_status_and_live_integration():
    """Verify JTWC adapter reports live integration status."""
    adapter = JTWCAdapter()
    status = adapter.get_status()
    assert status["agency"] == "JTWC"
    assert status["integration_status"] == "live"
    assert "Western Pacific" in status["region"]
    assert status["last_successful_fetch"] is not None
    assert status["bulletin_count"] >= 1
