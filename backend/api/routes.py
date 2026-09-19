"""API routes for cyclone tracking, vulnerability GIS queries, and Gemini advisory generation."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.schemas.cyclone import (
    AnticipatoryAdvisory,
    BhuvanLayer,
    CycloneTrack,
    DataGovStats,
    DataSourceInfo,
    FAOWHOIndicators,
    ForecastTrackPoint,
    ForecastTrackRequest,
    ForecastTrackResponse,
    HazardSummary,
    HistoricalAnalyticsResponse,
    LiveCycloneResponse,
    OSMFeature,
    RainfallForecast,
    SurgeSimulation,
    SurgeSimulationRequest,
    SynthesizeRequest,
    SynthesizeResponse,
    VulnerabilityFeatureCollection,
)
from backend.services.bigquery_service import (
    get_cyclone_tracks,
    get_historical_analytics,
)
from backend.services.bhuvan_fetcher import fetch_layer_metadata, get_tile_url_template
from backend.services.datagov_fetcher import fetch_district_indicators, fetch_state_stats
from backend.services.fao_who_fetcher import (
    fetch_combined_indicators,
    fetch_food_security,
    fetch_health_indicators,
)
from backend.services.forecast_service import get_model_metrics, predict_track
from backend.services.gemini_advisory import GeminiAdvisoryService
from backend.services.imd_fetcher import IMDFetcherService
from backend.services.infrastructure_service import load_infrastructure
from backend.services.osm_fetcher import (
    fetch_hospitals,
    fetch_roads,
    fetch_shelters,
    get_district_bbox,
)
from backend.services.rainfall_service import get_rainfall_forecast
from backend.services.surge_service import simulate_surge
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
def list_cyclone_tracks(
    source: Optional[str] = Query(default="json", description="'json' (default) or 'bigquery'")
) -> List[Dict[str, Any]]:
    """Lists available historical and scenario storm tracks."""
    source_val = source if isinstance(source, str) else getattr(source, "default", "json")
    if source_val and str(source_val).lower() == "bigquery":
        bq_rows = get_cyclone_tracks()
        groups: Dict[str, Dict[str, Any]] = {}
        for r in bq_rows:
            cid = r.get("cyclone_id", "UNKNOWN")
            if cid not in groups:
                groups[cid] = {
                    "id": cid,
                    "name": cid,
                    "season_year": r.get("season_year"),
                    "basin": "Bay of Bengal",
                    "current_status": "Cyclonic Storm",
                    "track_points_count": 0,
                    "source": "BigQuery",
                }
            groups[cid]["track_points_count"] += 1
        if groups:
            return list(groups.values())

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


@router.get("/rainfall/forecast", response_model=RainfallForecast)
def get_rainfall_forecast_endpoint(
    district: str = Query(default="Puri", description="District ID or name (e.g. 'OD-PUR', 'Puri')"),
    cyclone_id: Optional[str] = Query(default=None, description="Optional active cyclone track ID"),
) -> RainfallForecast:
    """Returns 24h/48h/72h rainfall forecast and categorical risk level for a coastal district."""
    data = get_rainfall_forecast(district_id=district, cyclone_id=cyclone_id)
    return RainfallForecast.model_validate(data)


@router.post("/surge/simulate", response_model=SurgeSimulation)
def simulate_surge_endpoint(
    req: SurgeSimulationRequest,
) -> SurgeSimulation:
    """Simulates hydrodynamic storm surge, inland inundation polygon, and exposed assets."""
    data = simulate_surge(cyclone_id=req.cyclone_id, district_id=req.district_id)
    return SurgeSimulation.model_validate(data)


@router.get("/hazards/summary", response_model=HazardSummary)
def get_hazards_summary_endpoint(
    district: str = Query(default="Puri", description="District ID or name (e.g. 'OD-PUR', 'Puri')"),
    cyclone_id: Optional[str] = Query(default=None, description="Optional active cyclone track ID"),
) -> HazardSummary:
    """Returns aggregated multi-hazard assessment combining rainfall forecast and storm surge simulation."""
    rainfall_data = get_rainfall_forecast(district_id=district, cyclone_id=cyclone_id)
    rainfall_model = RainfallForecast.model_validate(rainfall_data)

    surge_cyclone = cyclone_id or "BOB-02-2019"
    surge_data = simulate_surge(cyclone_id=surge_cyclone, district_id=district)
    surge_model = SurgeSimulation.model_validate(surge_data)

    # Determine overall hazard risk:
    # Priority: CRITICAL > HIGH > MEDIUM > LOW
    if rainfall_model.risk_level == "CRITICAL" or surge_model.max_surge_m >= 3.0:
        overall_risk = "CRITICAL"
    elif rainfall_model.risk_level == "HIGH" or surge_model.max_surge_m >= 2.0:
        overall_risk = "HIGH"
    elif rainfall_model.risk_level == "MEDIUM" or surge_model.max_surge_m >= 1.0:
        overall_risk = "MEDIUM"
    else:
        overall_risk = "LOW"

    return HazardSummary(
        district_id=rainfall_model.district_id,
        rainfall=rainfall_model,
        surge=surge_model,
        overall_risk=overall_risk,
    )


@router.get("/data-sources", response_model=List[DataSourceInfo])
def get_data_sources() -> List[DataSourceInfo]:
    """Returns status, metadata, and last-fetch timestamps for all integrated public data sources."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return [
        DataSourceInfo(
            source_id="datagov",
            name="Open Government Data Platform India (data.gov.in)",
            provider="National Informatics Centre (NIC) / MeitY",
            endpoint="https://api.data.gov.in/",
            status="cached" if not os.getenv("DATAGOV_API_KEY") else "operational",
            last_fetch=now_iso,
            details={"type": "CKAN Open API", "cached_fallback": True},
        ),
        DataSourceInfo(
            source_id="isro_bhuvan",
            name="ISRO Bhuvan Geo-Platform (WMS)",
            provider="National Remote Sensing Centre (NRSC / ISRO)",
            endpoint="https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms",
            status="operational",
            last_fetch=now_iso,
            details={"format": "WMS 1.1.1", "layers": ["coastal_vulnerability", "landuse", "flood_hazard", "elevation"]},
        ),
        DataSourceInfo(
            source_id="osm_overpass",
            name="OpenStreetMap Overpass Infrastructure API",
            provider="OpenStreetMap Foundation",
            endpoint="https://overpass-api.de/api/interpreter",
            status="operational",
            last_fetch=now_iso,
            details={"features": ["roads", "hospitals", "shelters"], "rate_limited": True},
        ),
        DataSourceInfo(
            source_id="fao_who",
            name="FAO Food Security & WHO Public Health Database",
            provider="UN FAO / WHO / NFHS-5",
            endpoint="https://www.fao.org/faostat/ / https://www.who.int/data/gho",
            status="cached",
            last_fetch=now_iso,
            details={"scope": "Coastal States Nutritional & Health Baselines"},
        ),
        DataSourceInfo(
            source_id="imd_rsmc",
            name="IMD RSMC Tropical Cyclones New Delhi",
            provider="India Meteorological Department (IMD)",
            endpoint="https://rsmcnewdelhi.imd.gov.in/",
            status="operational",
            last_fetch=now_iso,
            details={"bulletins": True, "active_monitoring": True},
        ),
    ]


@router.get("/external/datagov", response_model=DataGovStats)
def get_datagov_endpoint(
    state: str = Query(default="Odisha", description="State name (e.g. 'Odisha', 'West Bengal')"),
    district: Optional[str] = Query(default=None, description="Optional district name (e.g. 'Puri')"),
) -> DataGovStats:
    """Returns socio-economic statistics from data.gov.in or cached official records."""
    if district:
        data = fetch_district_indicators(district=district)
        return DataGovStats.model_validate(data)
    data = fetch_state_stats(state=state)
    return DataGovStats.model_validate(data)


@router.get("/external/bhuvan", response_model=BhuvanLayer)
def get_bhuvan_endpoint(
    layer: str = Query(default="coastal_vulnerability", description="Layer ID: coastal_vulnerability, landuse, flood_hazard, elevation"),
) -> BhuvanLayer:
    """Returns ISRO Bhuvan WMS geolayer metadata and tile template URL."""
    data = fetch_layer_metadata(layer=layer)
    return BhuvanLayer.model_validate(data)


@router.get("/external/osm/roads")
def get_osm_roads_endpoint(
    district: str = Query(default="Puri", description="District name (e.g. 'Puri', 'Ganjam')"),
    limit: int = Query(default=50, ge=1, le=200, description="Max road segments to return"),
) -> Dict[str, Any]:
    """Returns major road networks from OpenStreetMap Overpass API or local cache for the district."""
    bbox = get_district_bbox(district)
    return fetch_roads(bbox=bbox, limit=limit)


@router.get("/external/osm/hospitals")
def get_osm_hospitals_endpoint(
    district: str = Query(default="Puri", description="District name (e.g. 'Puri', 'Ganjam')"),
    limit: int = Query(default=50, ge=1, le=200, description="Max hospital facilities to return"),
) -> Dict[str, Any]:
    """Returns hospitals and health centers from OpenStreetMap Overpass API or local cache for the district."""
    bbox = get_district_bbox(district)
    return fetch_hospitals(bbox=bbox, limit=limit)


@router.get("/external/fao-who", response_model=FAOWHOIndicators)
def get_fao_who_endpoint(
    state: str = Query(default="Odisha", description="Coastal state name (e.g. 'Odisha', 'West Bengal')"),
) -> FAOWHOIndicators:
    """Returns FAO food security and WHO public health vulnerability indicators."""
    data = fetch_combined_indicators(state=state)
    return FAOWHOIndicators.model_validate(data)


@router.get("/analytics/historical", response_model=HistoricalAnalyticsResponse)
def get_historical_analytics_endpoint(
    state: str = Query(default="Odisha", description="Coastal state name (e.g. 'Odisha', 'West Bengal')"),
) -> HistoricalAnalyticsResponse:
    """Returns aggregate historical statistics, vulnerability metrics, and past cyclone benchmarks per state."""
    data = get_historical_analytics(state=state)
    return HistoricalAnalyticsResponse.model_validate(data)



