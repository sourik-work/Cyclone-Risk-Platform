"""API routes for cyclone tracking, vulnerability GIS queries, and Gemini advisory generation."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.schemas.cyclone import (
    AnticipatoryAdvisory,
    CycloneTrack,
    VulnerabilityFeatureCollection,
)
from backend.services.gemini_advisory import GeminiAdvisoryService

router = APIRouter(prefix="/api", tags=["Cyclone Risk"])

# Locate root directory containing data/
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# In-memory store for latest generated advisory
_LATEST_ADVISORY: Optional[AnticipatoryAdvisory] = None


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
def get_coastal_vulnerability() -> VulnerabilityFeatureCollection:
    """Returns coastal Odisha district vulnerability GeoJSON FeatureCollection."""
    geojson_path = DATA_DIR / "vulnerability" / "odisha_coastal_districts.geojson"
    if not geojson_path.exists():
        raise HTTPException(status_code=404, detail="Vulnerability GeoJSON file not found")

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return VulnerabilityFeatureCollection.model_validate(data)


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
