"""Unit tests for Gemini 3.7 Flash advisory service and multilingual output."""

import json
from pathlib import Path
from backend.schemas.cyclone import (
    AnticipatoryAdvisory,
    CycloneTrack,
    VulnerabilityFeatureCollection,
)
from backend.services.gemini_advisory import GeminiAdvisoryService


def test_gemini_prompt_formatting():
    root_dir = Path(__file__).resolve().parent.parent.parent
    track_path = root_dir / "data" / "tracks" / "fani_2019.json"
    geojson_path = root_dir / "data" / "vulnerability" / "odisha_coastal_districts.geojson"

    with open(track_path, "r", encoding="utf-8") as f:
        track = CycloneTrack.model_validate(json.load(f))

    with open(geojson_path, "r", encoding="utf-8") as f:
        collection = VulnerabilityFeatureCollection.model_validate(json.load(f))

    service = GeminiAdvisoryService()
    assert service.model_name == "gemini-3.7-flash", "Model must default to gemini-3.7-flash"

    districts = [feat.properties for feat in collection.features[:2]]
    point = track.track_points[6]

    prompt = service.format_prompt(
        storm=track,
        current_point=point,
        vulnerable_districts=districts,
        lead_time_hours=18.0,
    )

    payload = json.loads(prompt)
    assert payload["cyclone"]["name"] == "Fani"
    assert payload["cyclone"]["lead_time_hours"] == 18.0
    assert len(payload["high_risk_districts"]) == 2
    assert "required_output_schema" in payload


def test_gemini_advisory_generation_multilingual():
    root_dir = Path(__file__).resolve().parent.parent.parent
    track_path = root_dir / "data" / "tracks" / "fani_2019.json"
    geojson_path = root_dir / "data" / "vulnerability" / "odisha_coastal_districts.geojson"

    with open(track_path, "r", encoding="utf-8") as f:
        track = CycloneTrack.model_validate(json.load(f))

    with open(geojson_path, "r", encoding="utf-8") as f:
        collection = VulnerabilityFeatureCollection.model_validate(json.load(f))

    service = GeminiAdvisoryService()
    districts = [feat.properties for feat in collection.features]
    point = track.track_points[8]

    advisory = service.generate_advisory(
        storm=track,
        current_point=point,
        vulnerable_districts=districts,
        lead_time_hours=12.0,
    )

    assert isinstance(advisory, AnticipatoryAdvisory)
    assert advisory.cyclone_id == track.id
    assert advisory.lead_time_hours == 12.0
    assert len(advisory.target_districts) > 0
    assert advisory.model == "gemini-3.7-flash"

    # Verify all 6 languages are populated
    multi = advisory.multilingual_advisories
    assert len(multi.english) > 10, "Missing English advisory"
    assert len(multi.odia) > 10, "Missing Odia advisory"
    assert len(multi.bengali) > 10, "Missing Bengali advisory"
    assert len(multi.hindi) > 10, "Missing Hindi advisory"
    assert len(multi.telugu) > 10, "Missing Telugu advisory"
    assert len(multi.tamil) > 10, "Missing Tamil advisory"

    # Verify actionable triggers
    assert len(advisory.recommended_actions) >= 3
    action_categories = {a.category.value for a in advisory.recommended_actions}
    assert "EVACUATION" in action_categories


if __name__ == "__main__":
    test_gemini_prompt_formatting()
    test_gemini_advisory_generation_multilingual()
    print("All Gemini advisory tests passed successfully!")
