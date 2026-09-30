"""Tests for infrastructure asset provenance, metadata completeness, and dataset expansion targets."""

import json
from pathlib import Path
import pytest

ASSET_FILE = Path(__file__).resolve().parent.parent / "data" / "infrastructure_assets.json"


@pytest.fixture
def asset_dataset():
    assert ASSET_FILE.exists(), f"Asset catalog file {ASSET_FILE} does not exist"
    with open(ASSET_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def test_asset_provenance_fields_present_and_valid(asset_dataset):
    """Ensure every asset has complete, valid provenance metadata."""
    valid_sources = {"DISCOM", "OSM", "NDMA", "manual"}
    
    assert len(asset_dataset) > 0
    for asset in asset_dataset:
        assert "provenance" in asset, f"Asset {asset.get('asset_id')} missing provenance field"
        prov = asset["provenance"]
        assert prov.get("source") in valid_sources, f"Invalid source in {asset.get('asset_id')}: {prov.get('source')}"
        assert prov.get("source_url"), f"Missing source_url in {asset.get('asset_id')}"
        assert prov.get("fetched_at"), f"Missing fetched_at in {asset.get('asset_id')}"
        assert 1 <= prov.get("confidence", 0) <= 5, f"Confidence out of range in {asset.get('asset_id')}"


def test_core_dataset_expansion_substations_target(asset_dataset):
    """Assert substations count meets or exceeds 60 (target >= 60)."""
    substations = [a for a in asset_dataset if a.get("asset_type") == "SUBSTATION"]
    assert len(substations) >= 60, f"Expected >= 60 substations, got {len(substations)}"


def test_core_dataset_expansion_transmission_corridors_target(asset_dataset):
    """Assert transmission corridors count meets or exceeds 25 (target >= 25)."""
    corridors = [a for a in asset_dataset if a.get("asset_type") == "TRANSMISSION_LINE"]
    assert len(corridors) >= 25, f"Expected >= 25 transmission corridors, got {len(corridors)}"


def test_core_dataset_expansion_hospitals_and_shelters_target(asset_dataset):
    """Assert hospitals and cyclone shelters count meets or exceeds 80 (target >= 80)."""
    hosp_shelters = [a for a in asset_dataset if a.get("asset_type") in ("HOSPITAL", "CYCLONE_SHELTER")]
    assert len(hosp_shelters) >= 80, f"Expected >= 80 hospitals & shelters, got {len(hosp_shelters)}"


def test_emergency_facilities_present(asset_dataset):
    """Verify emergency services (fire stations and police stations) are present."""
    fire_stations = [a for a in asset_dataset if a.get("asset_type") == "FIRE_STATION"]
    police_stations = [a for a in asset_dataset if a.get("asset_type") == "POLICE_STATION"]
    assert len(fire_stations) >= 15
    assert len(police_stations) >= 10


def test_western_states_expansion_gujarat_and_kerala(asset_dataset):
    """Verify Gujarat and Kerala have populated infrastructure assets."""
    gujarat_assets = [a for a in asset_dataset if a.get("state") == "Gujarat"]
    kerala_assets = [a for a in asset_dataset if a.get("state") == "Kerala"]
    
    assert len(gujarat_assets) >= 10, f"Expected >= 10 Gujarat assets, got {len(gujarat_assets)}"
    assert len(kerala_assets) >= 10, f"Expected >= 10 Kerala assets, got {len(kerala_assets)}"
