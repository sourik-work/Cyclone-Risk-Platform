"""Unit tests validating seed datasets against Pydantic models."""

import json
from pathlib import Path
from backend.schemas.cyclone import CycloneTrack, VulnerabilityFeatureCollection


def test_validate_fani_track():
    root_dir = Path(__file__).resolve().parent.parent.parent
    track_path = root_dir / "data" / "tracks" / "fani_2019.json"
    assert track_path.exists(), f"Missing track file at {track_path}"

    with open(track_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    track = CycloneTrack.model_validate(data)
    assert track.name == "Fani"
    assert track.season_year == 2019
    assert len(track.track_points) > 5
    # Verify forecast points
    forecast_points = [p for p in track.track_points if p.is_forecast]
    assert len(forecast_points) >= 1
    for pt in forecast_points:
        assert pt.cone_radius_km is not None and pt.cone_radius_km > 0


def test_validate_amphan_track():
    root_dir = Path(__file__).resolve().parent.parent.parent
    track_path = root_dir / "data" / "tracks" / "amphan_2020.json"
    assert track_path.exists(), f"Missing track file at {track_path}"

    with open(track_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    track = CycloneTrack.model_validate(data)
    assert track.name == "Amphan"
    assert track.season_year == 2020
    assert len(track.track_points) > 5


def test_validate_odisha_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "odisha_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 6
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Puri", "Jagatsinghpur", "Kendrapara", "Bhadrak", "Balasore", "Ganjam"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert feat.properties.cyclone_risk_score > 0.8
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language in ["Odia", "Bengali", "Telugu", "Tamil", "Hindi"]

def test_validate_west_bengal_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "west_bengal_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 3
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Purba Medinipur", "South 24 Parganas", "North 24 Parganas"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.65 <= feat.properties.cyclone_risk_score <= 0.85
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Bengali"


def test_validate_andhra_pradesh_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "andhra_pradesh_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 4
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Srikakulam", "Vizianagaram", "Visakhapatnam", "East Godavari"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.65 <= feat.properties.cyclone_risk_score <= 0.85
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Telugu"


def test_validate_tamil_nadu_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "tamil_nadu_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 3
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Chennai", "Cuddalore", "Nagapattinam"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.65 <= feat.properties.cyclone_risk_score <= 0.85
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Tamil"


if __name__ == "__main__":
    test_validate_fani_track()
    test_validate_amphan_track()
    test_validate_odisha_vulnerability_geojson()
    test_validate_west_bengal_vulnerability_geojson()
    test_validate_andhra_pradesh_vulnerability_geojson()
    test_validate_tamil_nadu_vulnerability_geojson()
    print("All schema validation tests passed successfully!")
