"""Tests for Uncertainty Propagation into Gemini Exposure Reasoning."""

from unittest.mock import MagicMock, patch
import pytest

from backend.services.exposure_reasoning_service import (
    get_uncertainty_cone_radii,
    reason_about_exposure,
)


def test_uncertainty_cone_radii_computed_from_loso():
    """Verify that 95% cone radii are mathematically derived from LOSO RMSE (1.96 * RMSE)."""
    radii = get_uncertainty_cone_radii()
    assert "cone_radius_24h_km" in radii
    assert "cone_radius_48h_km" in radii
    assert radii["cone_radius_24h_km"] >= 140.0
    assert radii["cone_radius_48h_km"] >= 250.0
    assert radii["cone_radius_48h_km"] > radii["cone_radius_24h_km"]


def test_exposure_reasoning_fallback_contains_confidence_and_cone_metadata():
    """Verify fallback reasoning propagates uncertainty cone radii and confidence."""
    storm_data = {"wind_kmph": 175.0, "pressure_hpa": 950.0, "surge_m": 3.2, "rainfall_mm": 180.0}
    flood_bbox = {"min_lat": 19.5, "max_lat": 20.2, "min_lon": 85.5, "max_lon": 86.4, "area_km2": 65.0}
    infrastructure = [
        {"name": "Puri 132kV Grid Substation", "asset_type": "Substation", "distance_from_coast_km": 2.1},
        {"name": "Puri District Headquarters Hospital", "asset_type": "Hospital", "distance_from_coast_km": 1.4},
    ]

    res = reason_about_exposure("Puri", storm_data, flood_bbox, infrastructure)

    assert "confidence" in res
    assert res["confidence"] in ("LOW", "MEDIUM", "HIGH")
    assert res["within_cone"] is True
    assert "cone_radius_24h_km" in res
    assert "cone_radius_48h_km" in res
    assert len(res["critical_assets"]) >= 2
    assert "cone of uncertainty" in res["narrative"].lower() or "uncertainty cone" in res["narrative"].lower()


@patch("backend.services.exposure_reasoning_service.requests.post")
def test_exposure_reasoning_prompt_includes_cone_radii(mock_post):
    """Verify that outbound Gemini prompt explicitly includes numeric cone radii and probabilistic instructions."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                '{"district": "Puri", "exposure_level": "HIGH", "confidence": "HIGH", '
                                '"reasoning": "Located in 95% cone.", "narrative": "Likely surge impact.", '
                                '"within_cone": true, "critical_assets": [], "recommended_actions": []}'
                            )
                        }
                    ]
                }
            }
        ]
    }
    mock_post.return_value = mock_resp

    with patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"}):
        with patch("backend.services.exposure_reasoning_service._get_client", return_value=None):
            storm_data = {"wind_kmph": 200.0, "pressure_hpa": 940.0, "surge_m": 4.0, "rainfall_mm": 200.0}
            flood_bbox = {"min_lat": 19.5, "max_lat": 20.2, "min_lon": 85.5, "max_lon": 86.4, "area_km2": 50.0}
            cone_info = {"cone_radius_24h_km": 155.8, "cone_radius_48h_km": 288.3}

            res = reason_about_exposure("Puri", storm_data, flood_bbox, [], cone_info=cone_info)

            # Inspect what prompt was sent in POST payload
            assert mock_post.called
            call_args = mock_post.call_args
            payload = call_args[1]["json"]
            prompt_text = payload["contents"][0]["parts"][0]["text"]

            assert "155.8 km" in prompt_text or "155.8" in prompt_text
            assert "288.3 km" in prompt_text or "288.3" in prompt_text
            assert "cone of uncertainty" in prompt_text.lower()
            assert res["confidence"] == "HIGH"
            assert res["cone_radius_24h_km"] == 155.8


def test_exposure_reasoning_high_uncertainty_cone_scaling():
    """Verify reasoning response scales properly with wide vs tight uncertainty cones."""
    tight_cone = {"cone_radius_24h_km": 90.0, "cone_radius_48h_km": 160.0}
    wide_cone = {"cone_radius_24h_km": 220.0, "cone_radius_48h_km": 400.0}

    storm_data = {"wind_kmph": 120.0, "surge_m": 2.0}
    flood_bbox = {"area_km2": 25.0}

    res_tight = reason_about_exposure("Puri", storm_data, flood_bbox, [], cone_info=tight_cone)
    res_wide = reason_about_exposure("Puri", storm_data, flood_bbox, [], cone_info=wide_cone)

    assert res_tight["cone_radius_24h_km"] == 90.0
    assert res_wide["cone_radius_24h_km"] == 220.0
    assert res_wide["confidence"] == "MEDIUM"  # High uncertainty lowers confidence tier
