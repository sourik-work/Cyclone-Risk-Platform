"""Tests for PAGASA Live Agency Adapter and Fixture-Based Parser."""

from pathlib import Path
import pytest

from backend.services.agency_adapters.pagasa_adapter import PAGASAAdapter

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "pagasa"


def test_pagasa_parser_bulletin_1_typhoon_carina():
    """Verify parsing Typhoon Carina (Gaemi) bulletin."""
    adapter = PAGASAAdapter()
    file_path = FIXTURES_DIR / "pagasa_bulletin_1.html"
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    parsed = adapter.parse_bulletin_html(html)
    assert "CARINA" in parsed["storm_name"] or "GAEMI" in parsed["storm_name"]
    assert parsed["category"] == "TYPHOON"
    assert parsed["latitude"] == 17.5
    assert parsed["longitude"] == 124.8
    assert parsed["wind_kmph"] == 155.0
    assert parsed["gust_kmph"] == 190.0
    assert parsed["central_pressure_hpa"] == 960.0
    assert len(parsed["forecast_track"]) == 3
    assert parsed["forecast_track"][0]["lead_hours"] == 24


def test_pagasa_parser_bulletin_2_sts_kristine():
    """Verify parsing Severe Tropical Storm Kristine (Trami) bulletin."""
    adapter = PAGASAAdapter()
    file_path = FIXTURES_DIR / "pagasa_bulletin_2.html"
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    parsed = adapter.parse_bulletin_html(html)
    assert "KRISTINE" in parsed["storm_name"] or "TRAMI" in parsed["storm_name"]
    assert "TROPICAL STORM" in parsed["category"]
    assert parsed["latitude"] == 15.2
    assert parsed["longitude"] == 125.4
    assert parsed["wind_kmph"] == 105.0
    assert parsed["central_pressure_hpa"] == 980.0
    assert len(parsed["forecast_track"]) >= 3


def test_pagasa_parser_bulletin_3_super_typhoon_pepito():
    """Verify parsing Super Typhoon Pepito (Man-Yi) bulletin."""
    adapter = PAGASAAdapter()
    file_path = FIXTURES_DIR / "pagasa_bulletin_3.html"
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    parsed = adapter.parse_bulletin_html(html)
    assert "PEPITO" in parsed["storm_name"] or "MAN-YI" in parsed["storm_name"]
    assert parsed["category"] == "SUPER TYPHOON"
    assert parsed["latitude"] == 13.7
    assert parsed["longitude"] == 124.3
    assert parsed["wind_kmph"] == 215.0
    assert parsed["central_pressure_hpa"] == 920.0
    assert len(parsed["forecast_track"]) >= 3


def test_pagasa_adapter_status_and_live_integration():
    """Verify PAGASA adapter reports live integration status."""
    adapter = PAGASAAdapter()
    status = adapter.get_status()
    assert status["agency"] == "PAGASA"
    assert status["integration_status"] == "live"
    assert "Philippines" in status["region"]
    assert status["last_successful_fetch"] is not None
    assert status["bulletin_count"] >= 1
