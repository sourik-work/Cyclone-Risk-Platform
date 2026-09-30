"""Gemini exposure reasoning module (alias for exposure_reasoning_service)."""

from backend.services.exposure_reasoning_service import (
    get_uncertainty_cone_radii,
    reason_about_exposure,
)

__all__ = [
    "get_uncertainty_cone_radii",
    "reason_about_exposure",
]
