"""API routes for cyclone tracking, vulnerability GIS queries, and Gemini advisory generation."""

import base64
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.schemas.cyclone import (
    AdvisorySeverity,
    AlertSubscribeRequest,
    AlertSubscribeResponse,
    AnticipatoryAdvisory,
    AuthVerifyRequest,
    AuthVerifyResponse,
    BhuvanLayer,
    CitizenReportRequest,
    CitizenReportResponse,
    CycloneTrack,
    DataGovStats,
    DataSourceInfo,
    FAOWHOIndicators,
    FCMNotificationRequest,
    ForecastTrackPoint,
    ForecastTrackRequest,
    ForecastTrackResponse,
    HazardSummary,
    HistoricalAnalyticsResponse,
    InsuranceEvaluateRequest,
    InsuranceEvaluateResponse,
    InsuranceTriggerResult,
    LiveCycloneResponse,
    MultilingualAdvisories,
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
from backend.services.gemini_advisory import GeminiAdvisoryService, analyze_damage_photo
from backend.services.imd_fetcher import IMDFetcherService
from backend.services.infrastructure_service import load_infrastructure
from backend.services.osm_fetcher import (
    fetch_hospitals,
    fetch_roads,
    fetch_shelters,
    get_district_bbox,
)
from backend.services.rainfall_service import (
    _load_districts,
    _load_track_max_wind,
    get_rainfall_forecast,
)
from backend.services.surge_service import simulate_surge
from backend.services.tts_service import synthesize
from backend.services.cloud_storage_service import upload_citizen_photo
from backend.services.firebase_service import (
    send_fcm_notification,
    subscribe_device,
    verify_id_token,
    write_citizen_report,
)
from backend.services.insurance_service import (
    evaluate_all_contracts,
    load_contracts,
    log_trigger_to_firestore,
)

logger = logging.getLogger(__name__)

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


def _find_historical_track(cyclone_id: str) -> Optional[CycloneTrack]:
    """Finds a historical cyclone track by ID or name, or None if not found."""
    tracks_dir = DATA_DIR / "tracks"
    if not tracks_dir.exists():
        return None
    for file_path in tracks_dir.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("id") == cyclone_id or data.get("name", "").lower() == cyclone_id.lower():
                    return CycloneTrack.model_validate(data)
        except Exception:
            continue
    return None


@router.get("/tracks/{cyclone_id}", response_model=CycloneTrack)
def get_cyclone_track(cyclone_id: str) -> CycloneTrack:
    """Returns full track points and metadata for a specific cyclone."""
    track = _find_historical_track(cyclone_id)
    if track:
        return track
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

    cyclone_id = req.cyclone_id

    # 1. Fetch coastal vulnerability features
    vulnerability_collection = get_coastal_vulnerability()
    all_districts = [feat.properties for feat in vulnerability_collection.features]

    if req.target_districts:
        target_set = {name.lower() for name in req.target_districts}
        selected_districts = [d for d in all_districts if d.district_name.lower() in target_set]
    else:
        # Default to highest risk districts
        selected_districts = sorted(all_districts, key=lambda d: d.cyclone_risk_score, reverse=True)[:3]

    service = GeminiAdvisoryService()

    # 2. Try historical track first
    track = _find_historical_track(cyclone_id)
    if track:
        if req.point_index is not None and 0 <= req.point_index < len(track.track_points):
            current_point = track.track_points[req.point_index]
        else:
            current_point = track.track_points[min(8, len(track.track_points) - 1)]

        advisory = service.generate_advisory(
            storm=track,
            current_point=current_point,
            vulnerable_districts=selected_districts,
            lead_time_hours=req.lead_time_hours,
        )
        _LATEST_ADVISORY = advisory
        return advisory

    # 3. Try live storm if ID starts with IMD-LIVE- or matches live bulletin
    if cyclone_id.startswith("IMD-LIVE-"):
        live_data = _IMD_FETCHER.get_live_cyclone_status()
        if live_data.status == "active" and live_data.active_cyclone:
            active = live_data.active_cyclone
            active_id = getattr(active, "id", "") or getattr(active, "cyclone_id", "")
            if active_id == cyclone_id or cyclone_id == "IMD-LIVE-ACTIVE" or cyclone_id.startswith("IMD-LIVE-"):
                latest_point = active.track_points[0] if active.track_points else None
                wind_kmph = (latest_point.wind_speed_kmph or round(latest_point.wind_speed_knots * 1.852)) if latest_point else 85.0
                pressure_hpa = latest_point.central_pressure_hpa if latest_point else 990.0
                live_storm_dict = {
                    "cyclone_id": active_id or cyclone_id,
                    "name": active.name,
                    "category": active.current_status,
                    "latitude": latest_point.latitude if latest_point else 18.0,
                    "longitude": latest_point.longitude if latest_point else 86.0,
                    "wind_kmph": float(wind_kmph),
                    "pressure_hpa": float(pressure_hpa),
                }
                advisory = service.generate_advisory(
                    live_storm=live_storm_dict,
                    vulnerable_districts=selected_districts,
                    lead_time_hours=req.lead_time_hours,
                )
                _LATEST_ADVISORY = advisory
                return advisory

        # If Live Mode has no active storm, return a "monitoring" advisory instead of 404
        monitoring_advisory = AnticipatoryAdvisory(
            advisory_id=f"ADV-MONITORING-{uuid.uuid4().hex[:6].upper()}",
            cyclone_id=cyclone_id,
            issued_at=datetime.now(timezone.utc).isoformat(),
            severity_level=AdvisorySeverity.MONITORING,
            lead_time_hours=None,
            estimated_landfall_time=None,
            estimated_landfall_location=None,
            max_expected_wind_kmph=None,
            max_expected_surge_m=None,
            target_districts=[],
            headline="BAY OF BENGAL MONITORING — No active cyclones",
            multilingual_advisories=MultilingualAdvisories(
                english="No active cyclones in the Bay of Bengal. Continuous monitoring active.",
                odia="ବଙ୍ଗୋପସାଗରରେ କୌଣସି ସକ୍ରିୟ ବାତ୍ୟା ନାହିଁ। ନିରନ୍ତର ନିରୀକ୍ଷଣ ଚାଲିଛି।",
                bengali="বঙ্গোপসাগরে কোনো সক্রিয় ঘূর্ণিঝড় নেই। সার্বক্ষণিক নজরদারি চলছে।",
                hindi="बंगाल की खाड़ी में कोई सक्रिय चक्रवात नहीं। निरंतर निगरानी सक्रिय है।",
                telugu="బంగాళాఖాతంలో ఎటువంటి తుఫానులు లేవు. నిరంతర పర్యవేక్షణ కొనసాగుతోంది.",
                tamil="வங்காள விரிகுடாவில் தீவிர புயல் எதுவும் இல்லை. தொடர் கண்காணிப்பு செயலில் உள்ளது.",
            ),
            recommended_actions=[],
            model="gemini-3.7-flash",
        )
        _LATEST_ADVISORY = monitoring_advisory
        return monitoring_advisory

    # 4. Fallback: 404 with clear message
    raise HTTPException(status_code=404, detail=f"Cyclone track '{cyclone_id}' not found")


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


# ---------------------------------------------------------------------------
# Firebase & Cloud Storage Integration Endpoints (Workstream 5)
# ---------------------------------------------------------------------------


@router.post("/auth/verify", response_model=AuthVerifyResponse)
def verify_auth_token(payload: AuthVerifyRequest) -> AuthVerifyResponse:
    """Validates Firebase Auth ID token, returns uid, email, and validity status."""
    res = verify_id_token(payload.id_token)
    return AuthVerifyResponse(
        uid=res.get("uid", ""),
        email=res.get("email"),
        valid=bool(res.get("valid", False)),
    )


@router.post("/citizen/report", response_model=CitizenReportResponse)
def create_citizen_report(payload: CitizenReportRequest) -> CitizenReportResponse:
    """Accepts base64 damage photo, uploads to GCS, runs Gemini multimodal damage analysis, and stores in Firestore."""
    try:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    report_id = f"CR-{uuid.uuid4().hex[:8].upper()}"
    filename = f"{report_id}.jpg"

    # 1. Upload to Cloud Storage
    try:
        image_url = upload_citizen_photo(image_bytes=image_bytes, filename=filename, report_id=report_id)
    except Exception as e:
        logger.error(f"Failed to upload photo to GCS: {e}")
        image_url = f"https://storage.googleapis.com/cyclone-risk-platform-citizen-reports/{report_id}/{filename}"

    # 2. Call Gemini 3.7 Flash multimodal
    ai_analysis_dict = analyze_damage_photo(image_bytes=image_bytes)
    damage_severity = ai_analysis_dict.get("severity", "MEDIUM")
    ai_desc = ai_analysis_dict.get("description", "Damage assessment complete.")
    now_iso = datetime.now(timezone.utc).isoformat()

    # 3. Write full report to Firestore
    report_record = {
        "report_id": report_id,
        "description": payload.description,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "state": payload.state,
        "district": payload.district,
        "image_url": image_url,
        "damage_severity": damage_severity,
        "ai_analysis": ai_desc,
        "affected_infrastructure": ai_analysis_dict.get("affected_infrastructure", []),
        "created_at": now_iso,
    }
    try:
        write_citizen_report(report_record)
    except Exception as e:
        logger.error(f"Failed to write citizen report to Firestore: {e}")

    return CitizenReportResponse(
        report_id=report_id,
        damage_severity=damage_severity,
        ai_analysis=ai_desc,
        image_url=image_url,
        created_at=now_iso,
    )


@router.post("/alerts/subscribe", response_model=AlertSubscribeResponse)
def subscribe_alert_endpoint(payload: AlertSubscribeRequest) -> AlertSubscribeResponse:
    """Stores device FCM token in Firestore alert_subscriptions collection."""
    sub_id = subscribe_device(fcm_token=payload.fcm_token, state=payload.state)
    return AlertSubscribeResponse(
        subscription_id=sub_id,
        status="subscribed",
    )


@router.post("/alerts/broadcast")
def broadcast_fcm_alert_endpoint(payload: FCMNotificationRequest) -> Dict[str, Any]:
    """Broadcasts FCM push notification to all subscribers within a designated state."""
    res = send_fcm_notification(title=payload.title, body=payload.body, state=payload.state)
    return {
        "status": "ok",
        "state": payload.state,
        "result": res,
    }


@router.get("/insurance/contracts")
def get_insurance_contracts() -> List[Dict[str, Any]]:
    """Returns all active parametric insurance risk pool contracts."""
    return load_contracts()


@router.post("/insurance/evaluate", response_model=InsuranceEvaluateResponse)
def evaluate_insurance_contracts(payload: InsuranceEvaluateRequest) -> InsuranceEvaluateResponse:
    """Evaluates all parametric insurance contracts against current storm track, surge, and rainfall hazards."""
    # 1. Load contracts
    contracts = load_contracts()

    # 2. Extract storm track metadata (max wind)
    peak_wind = _load_track_max_wind(payload.cyclone_id)

    # District metrics map across all districts mentioned in contracts
    district_metrics: Dict[str, Dict[str, float]] = {}
    vulnerability_data = _load_districts()

    for c in contracts:
        for d in c.get("districts", []):
            if d not in district_metrics:
                # Surge simulation
                try:
                    surge_res = simulate_surge(cyclone_id=payload.cyclone_id, district_id=d)
                    max_surge_m = float(surge_res.get("max_surge_m", 0.0))
                except Exception:
                    max_surge_m = 0.0

                # Rainfall forecast
                try:
                    rf_res = get_rainfall_forecast(district_id=d, cyclone_id=payload.cyclone_id)
                    rain_mm = float(rf_res.get("forecast_24h_mm", 0.0))
                except Exception:
                    rain_mm = 0.0

                # Vulnerability / composite risk calculation
                dist_info = vulnerability_data.get(d.lower()) or vulnerability_data.get(d.upper()) or {}
                vuln_score = 0.70
                if dist_info:
                    vuln_score = min(0.95, max(0.50, 0.60 + (dist_info.get("vulnerable_population", 400000) / 1000000) * 0.15))

                wind_factor = min(1.0, peak_wind / 200.0)
                surge_factor = min(1.0, max_surge_m / 3.0)
                rain_factor = min(1.0, rain_mm / 200.0)
                composite_risk = round(0.40 * wind_factor + 0.30 * surge_factor + 0.15 * rain_factor + 0.15 * vuln_score, 2)

                district_metrics[d] = {
                    "max_surge_m": max_surge_m,
                    "surge_height_m": max_surge_m,
                    "wind_kmph": peak_wind,
                    "wind_speed_kmph": peak_wind,
                    "rainfall_24h_mm": rain_mm,
                    "forecast_24h_mm": rain_mm,
                    "composite_risk": composite_risk,
                    "cyclone_risk_score": composite_risk,
                }

    storm_data = {
        "cyclone_id": payload.cyclone_id,
        "wind_kmph": peak_wind,
        "wind_speed_kmph": peak_wind,
        "district_metrics": district_metrics,
    }

    # 3. Evaluate contracts
    eval_results = evaluate_all_contracts(storm_data)

    # 4. Log any TRIGGER_ACTIVE events to Firestore
    for r in eval_results:
        if r.get("trigger_met") or r.get("status") == "TRIGGER_ACTIVE":
            try:
                log_trigger_to_firestore(r)
            except Exception as e:
                logger.warning(f"Error logging trigger {r.get('contract_id')} to Firestore: {e}")

    # 5. Build summary response
    total_contracts = len(eval_results)
    triggers_active = sum(1 for r in eval_results if r.get("trigger_met"))
    total_payout_inr = sum(float(r.get("payout_estimate_inr", 0.0)) for r in eval_results)
    total_households = sum(int(r.get("households_affected", 0)) for r in eval_results)

    return InsuranceEvaluateResponse(
        total_contracts=total_contracts,
        triggers_active=triggers_active,
        total_payout_inr=total_payout_inr,
        total_households=total_households,
        results=[InsuranceTriggerResult(**r) for r in eval_results],
    )




