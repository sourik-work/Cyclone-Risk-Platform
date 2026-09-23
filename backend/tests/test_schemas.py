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


def test_validate_gujarat_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "gujarat_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 7
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Kutch", "Jamnagar", "Porbandar", "Junagadh", "Gir Somnath", "Bhavnagar", "Surat"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.70 <= feat.properties.cyclone_risk_score <= 0.85
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Gujarati"


def test_validate_maharashtra_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "maharashtra_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 7
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Mumbai City", "Mumbai Suburban", "Thane", "Palghar", "Raigad", "Ratnagiri", "Sindhudurg"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.75 <= feat.properties.cyclone_risk_score <= 0.90
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Marathi"


def test_validate_goa_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "goa_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 2
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"North Goa", "South Goa"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.65 <= feat.properties.cyclone_risk_score <= 0.75
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Konkani"


def test_validate_karnataka_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "karnataka_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 3
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Dakshina Kannada", "Udupi", "Uttara Kannada"}
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.70 <= feat.properties.cyclone_risk_score <= 0.80
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Kannada"


def test_validate_kerala_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "kerala_coastal_districts.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 9
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {
        "Kasaragod", "Kannur", "Kozhikode", "Malappuram", "Thrissur",
        "Ernakulam", "Alappuzha", "Kollam", "Thiruvananthapuram"
    }
    assert district_names == expected_districts

    for feat in collection.features:
        assert 0.70 <= feat.properties.cyclone_risk_score <= 0.85
        assert feat.properties.shelter_capacity > 0
        assert feat.properties.primary_language == "Malayalam"


def test_validate_union_territories_vulnerability_geojson():
    root_dir = Path(__file__).resolve().parent.parent.parent
    geojson_path = root_dir / "data" / "vulnerability" / "union_territories_coastal.geojson"
    assert geojson_path.exists(), f"Missing geojson file at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    collection = VulnerabilityFeatureCollection.model_validate(data)
    assert len(collection.features) == 4
    district_names = {f.properties.district_name for f in collection.features}
    expected_districts = {"Puducherry", "Lakshadweep", "Andaman & Nicobar Islands", "Daman & Diu"}
    assert district_names == expected_districts


def test_total_new_districts_count():
    """Verify that the 5 new coastal states total 28 districts (7 + 7 + 2 + 3 + 9 = 28)."""
    root_dir = Path(__file__).resolve().parent.parent.parent
    new_state_files = [
        "gujarat_coastal_districts.geojson",
        "maharashtra_coastal_districts.geojson",
        "goa_coastal_districts.geojson",
        "karnataka_coastal_districts.geojson",
        "kerala_coastal_districts.geojson",
    ]
    counts = []
    for fname in new_state_files:
        with open(root_dir / "data" / "vulnerability" / fname, "r", encoding="utf-8") as f:
            data = json.load(f)
            counts.append(len(data.get("features", [])))

    assert counts == [7, 7, 2, 3, 9]
    assert sum(counts) == 28


if __name__ == "__main__":
    test_validate_fani_track()
    test_validate_amphan_track()
    test_validate_odisha_vulnerability_geojson()
    test_validate_west_bengal_vulnerability_geojson()
    test_validate_andhra_pradesh_vulnerability_geojson()
    test_validate_tamil_nadu_vulnerability_geojson()
    test_validate_gujarat_vulnerability_geojson()
    test_validate_maharashtra_vulnerability_geojson()
    test_validate_goa_vulnerability_geojson()
    test_validate_karnataka_vulnerability_geojson()
    test_validate_kerala_vulnerability_geojson()
    test_validate_union_territories_vulnerability_geojson()
    test_total_new_districts_count()
    print("All schema validation tests passed successfully!")
