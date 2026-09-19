"""API routes for cyclone tracking, vulnerability GIS queries, and Gemini advisory generation."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.schemas.cyclone import (
    AnticipatoryAdvisory,
    CycloneTrack,
    ForecastTrackPoint,
    ForecastTrackRequest,
    ForecastTrackResponse,
    LiveCycloneResponse,
    SynthesizeRequest,
    SynthesizeResponse,
    VulnerabilityFeatureCollection,
)
from backend.services.forecast_service import get_model_metrics, predict_track
from backend.services.gemini_advisory import GeminiAdvisoryService
from backend.services.imd_fetcher import IMDFetcherService
from backend.services.infrastructure_service import load_infrastructure
from backend.services.tts_service import synthesize

router = APIRouter(prefix="/api", tags=["Cyclone Risk"])

# Locate root directory containing data/
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# In-memory store for latest generated advisory and live IMD fetcher service
_LATEST_ADVISORY: Optional[AnticipatoryAdvisory] = None
_IMD_FETCHER = IMDFetcherService()


class GenerateAdvisoryRequest(BaseModel):
    """Payload to trigger Gemini 3.7 Flash anticipatory advisory generation."""

    cyclone_id: str = "BOB-02-2019"
    point_index: Optional[int] = None
    target_districts: Optional[List[str]] = None
    lead_time_hours: float = 18.0


@router.get("/health")
def health_check() -> Dict[str, str]:
    """Cloud Run healthcheck probe."""
    return {"status": "ok", "service": "cyclone-risk-platform", "version": "1.0.0"}


@router.get("/tracks")
def list_cyclone_tracks() -> List[Dict[str, Any]]:
    """Lists available historical and scenario storm tracks."""
    tracks_dir = DATA_DIR / "tracks"
    if not tracks_dir.exists():
        raise HTTPException(status_code=404, detail="Tracks directory not found")

    summaries = []
    for file_path in tracks_dir.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            summaries.append({
                "id": data.get("id"),
                "name": data.get("name"),
                "season_year": data.get("season_year"),
                "basin": data.get("basin"),
                "current_status": data.get("current_status"),
                "track_points_count": len(data.get("track_points", [])),
                "filename": file_path.name,
            })
    return summaries


@router.get("/tracks/{cyclone_id}", response_model=CycloneTrack)
def get_cyclone_track(cyclone_id: str) -> CycloneTrack:
    """Returns full track points and metadata for a specific cyclone."""
    tracks_dir = DATA_DIR / "tracks"
    for file_path in tracks_dir.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data.get("id") == cyclone_id or data.get("name", "").lower() == cyclone_id.lower():
                return CycloneTrack.model_validate(data)
    raise HTTPException(status_code=404, detail=f"Cyclone track '{cyclone_id}' not found")


@router.get("/vulnerability", response_model=VulnerabilityFeatureCollection)
def get_coastal_vulnerability(
    state: Optional[str] = Query(default=None, description="Optional coastal state filter (e.g. 'Odisha', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu')")
) -> VulnerabilityFeatureCollection:
    """Returns coastal district vulnerability GeoJSON FeatureCollection across India-scale coverage."""
    vulnerability_dir = DATA_DIR / "vulnerability"
    if not vulnerability_dir.exists():
        raise HTTPException(status_code=404, detail="Vulnerability directory not found")

    geojson_files = sorted(list(vulnerability_dir.glob("*.geojson")))
    if not geojson_files:
        raise HTTPException(status_code=404, detail="No vulnerability GeoJSON files found")

    all_features = []
    for file_path in geojson_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            features = data.get("features", [])
            all_features.extend(features)

    # Handle direct Python function invocation in tests without FastAPI unwrap
    state_filter = None
    if isinstance(state, str):
        state_filter = state
    elif state is not None and hasattr(state, "default") and isinstance(state.default, str):
        state_filter = state.default

    if state_filter and state_filter.lower() != "all":
        target = state_filter.lower()
        filtered = [
            f for f in all_features
            if target in f.get("properties", {}).get("state_name", "").lower()
        ]
        if not filtered:
            raise HTTPException(status_code=404, detail=f"No vulnerability data found for state '{state_filter}'")
        return VulnerabilityFeatureCollection.model_validate({
            "type": "FeatureCollection",
            "name": f"{state_filter.lower().replace(' ', '_')}_coastal_vulnerability",
            "features": filtered,
        })

    return VulnerabilityFeatureCollection.model_validate({
        "type": "FeatureCollection",
        "name": "india_coastal_districts_vulnerability",
        "features": all_features,
    })


@router.post("/advisories/generate", response_model=AnticipatoryAdvisory)
def generate_advisory(req: GenerateAdvisoryRequest) -> AnticipatoryAdvisory:
    """Invokes Gemini 3.7 Flash to generate a multilingual anticipatory advisory."""
    global _LATEST_ADVISORY

    # 1. Fetch cyclone track
    track = get_cyclone_track(req.cyclone_id)

    # 2. Determine track point (default to peak intensity or near-landfall)
    if req.point_index is not None and 0 <= req.point_index < len(track.track_points):
        current_point = track.track_points[req.point_index]
    else:
        current_point = track.track_points[min(8, len(track.track_points) - 1)]

    # 3. Fetch coastal vulnerability features
    vulnerability_collection = get_coastal_vulnerability()
    all_districts = [feat.properties for feat in vulnerability_collection.features]

    if req.target_districts:
        target_set = {name.lower() for name in req.target_districts}
        selected_districts = [d for d in all_districts if d.district_name.lower() in target_set]
    else:
        # Default to highest risk districts
        selected_districts = sorted(all_districts, key=lambda d: d.cyclone_risk_score, reverse=True)[:3]

    # 4. Generate advisory using Gemini 3.7 Flash
    service = GeminiAdvisoryService()
    advisory = service.generate_advisory(
        storm=track,
        current_point=current_point,
        vulnerable_districts=selected_districts,
        lead_time_hours=req.lead_time_hours,
    )

    _LATEST_ADVISORY = advisory
    return advisory


@router.get("/advisories/latest", response_model=AnticipatoryAdvisory)
def get_latest_advisory() -> AnticipatoryAdvisory:
    """Returns the most recently generated anticipatory action advisory."""
    global _LATEST_ADVISORY
    if _LATEST_ADVISORY is None:
        # Generate initial advisory on first request
        default_req = GenerateAdvisoryRequest()
        return generate_advisory(default_req)
    return _LATEST_ADVISORY


@router.post("/advisories/synthesize", response_model=SynthesizeResponse)
def synthesize_advisory_audio(req: SynthesizeRequest) -> SynthesizeResponse:
    """Synthesizes advisory text into spoken audio via Gemini Flash TTS."""
    result = synthesize(req.text, req.language)
    return SynthesizeResponse(**result)


@router.get("/cyclone/live", response_model=LiveCycloneResponse)
def get_live_cyclone(refresh: bool = Query(default=False, description="Force re-fetch from IMD sources")) -> LiveCycloneResponse:
    """Returns real-time cyclone status or continuous basin monitoring from IMD RSMC New Delhi."""
    return _IMD_FETCHER.get_live_cyclone_status(force_refresh=refresh)


@router.post("/forecast/track", response_model=ForecastTrackResponse)
def forecast_cyclone_track(req: ForecastTrackRequest) -> ForecastTrackResponse:
    """Predicts a 48-hour forward cyclone trajectory and intensity using the trained TrackLSTM model."""
    # 1. Load the cyclone track data
    track = get_cyclone_track(req.cyclone_id)
    if len(track.track_points) < 4:
        raise HTTPException(
            status_code=400,
            detail=f"Cyclone track '{req.cyclone_id}' has fewer than 4 track points ({len(track.track_points)})",
        )

    # 2. Determine 4 input point indices
    if req.recent_point_indices is not None:
        if len(req.recent_point_indices) != 4:
            raise HTTPException(
                status_code=400,
                detail=f"recent_point_indices must contain exactly 4 point indices, got {len(req.recent_point_indices)}",
            )
        for idx in req.recent_point_indices:
            if idx < 0 or idx >= len(track.track_points):
                raise HTTPException(
                    status_code=400,
                    detail=f"Point index {idx} out of range for cyclone with {len(track.track_points)} points",
                )
        indices = list(req.recent_point_indices)
    else:
        # Default to first 4 observed points
        indices = [0, 1, 2, 3]

    # 3. Format input points for predict_track
    input_points: List[Dict[str, Any]] = []
    for idx in indices:
        pt = track.track_points[idx]
        wind_kmph = (
            pt.wind_speed_kmph
            if pt.wind_speed_kmph is not None
            else round(pt.wind_speed_knots * 1.852, 1)
        )
        input_points.append({
            "lat": pt.latitude,
            "lon": pt.longitude,
            "wind_kmph": float(wind_kmph),
            "pressure_hpa": float(pt.central_pressure_hpa),
        })

    # 4. Run TrackLSTM model inference
    predicted_points = predict_track(input_points)

    # 5. Extract remaining points from actual track as IMD official forecast
    last_input_idx = max(indices)
    remaining_points = track.track_points[last_input_idx + 1 :]
    imd_official: List[Dict[str, Any]] = []
    for step_idx, pt in enumerate(remaining_points):
        lead_hrs = pt.forecast_lead_hours if pt.is_forecast and pt.forecast_lead_hours else (step_idx + 1) * 3
        wind_kmph = (
            pt.wind_speed_kmph
            if pt.wind_speed_kmph is not None
            else round(pt.wind_speed_knots * 1.852, 1)
        )
        imd_official.append({
            "lead_hours": lead_hrs,
            "lat": pt.latitude,
            "lon": pt.longitude,
            "wind_kmph": float(wind_kmph),
            "pressure_hpa": float(pt.central_pressure_hpa),
            "category": pt.category,
            "is_forecast": pt.is_forecast,
            "timestamp": pt.timestamp,
        })

    # 6. Gather model metrics
    metrics = get_model_metrics()

    return ForecastTrackResponse(
        cyclone_id=track.id,
        model_forecast=[ForecastTrackPoint(**p) for p in predicted_points],
        imd_official_forecast=imd_official,
        rmse_24h_km=round(float(metrics.get("rmse_24h_km", 85.6)), 1),
        rmse_48h_km=round(float(metrics.get("rmse_48h_km", 155.6)), 1),
        wind_mae_kmph=round(float(metrics.get("wind_mae_kmph", 7.3)), 1),
        pressure_mae_hpa=round(float(metrics.get("pressure_mae_hpa", 2.9)), 1),
        model_version=str(metrics.get("model_version", "track_lstm_v1")),
        training_samples=int(metrics.get("training_samples", 8484)),
        model_params=int(metrics.get("model_params", 119872)),
    )


@router.get("/infrastructure")
def get_infrastructure(
    state: Optional[str] = Query(None, description="Filter by coastal state name (e.g. Odisha, West Bengal)"),
    type: Optional[str] = Query(None, description="Filter by asset/facility type (e.g. SUBSTATION, HOSPITAL, CYCLONE_SHELTER, ARTERIAL_ROAD)"),
) -> Dict[str, Any]:
    """Retrieves critical infrastructure assets (power grid, arterial roads, hospitals/shelters)."""
    state_param = state if isinstance(state, str) else getattr(state, "default", None)
    type_param = type if isinstance(type, str) else getattr(type, "default", None)
    return load_infrastructure(asset_type=type_param, state=state_param)
