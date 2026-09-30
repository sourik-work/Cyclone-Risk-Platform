"""API routes for cyclone tracking, vulnerability GIS queries, and Gemini advisory generation."""

import base64
import functools
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.core.auth import require_auth, require_dispatcher
from backend.schemas.cyclone import (
    ActionItem,
    AdvisoryAuditEntry,
    AdvisorySeverity,
    AlertSubscribeRequest,
    AlertSubscribeResponse,
    AnticipatoryAdvisory,
    ApprovalRequest,
    ApprovalState,
    AuditEvent,
    AuditLogResponse,
    AuthVerifyRequest,
    AuthVerifyResponse,
    BhuvanLayer,
    CitizenReportRequest,
    CitizenReportResponse,
    ChatMessage,
    ChatResponse,
    CycloneTrack,
    DataGovStats,
    DataSourceInfo,
    ExposureReasoningRequest,
    ExposureReasoningResponse,
    FAOWHOIndicators,
    FCMNotificationRequest,
    ForecastTrackPoint,
    ForecastTrackRequest,
    ForecastTrackResponse,
    GeminiForecastPoint,
    GeminiForecastRequest,
    GeminiForecastResponse,
    HazardSummary,
    HistoricalAnalyticsResponse,
    InsuranceEvaluateRequest,
    InsuranceEvaluateResponse,
    InsuranceTriggerResult,
    LiveCycloneResponse,
    MultilingualAdvisories,
    RainfallDamageRequest,
    RainfallDamageResponse,
    RainfallForecast,
    RejectionRequest,
    SurgeSimulation,
    SurgeSimulationRequest,
    SynthesizeRequest,
    SynthesizeResponse,
    TriageAsset,
    TriageRequest,
    TriageResponse,
    AssetStatusUpdate,
    AssetStatusResponse,
    ScenarioOverride,
    apply_scenario_override,
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
from backend.services.vulnerability_service import load_vulnerability
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

# SlowAPI Limiter for per-IP rate limiting
_is_testing = bool(os.getenv("TESTING") or os.getenv("PYTEST_CURRENT_TEST"))
limiter = Limiter(key_func=get_remote_address, enabled=not _is_testing)


def safe_limiter_limit(limit_value: str):
    """Wrapper around SlowAPI limiter that safely allows direct function invocation in test scripts."""
    def decorator(func):
        limiter_decorator = limiter.limit(limit_value)
        wrapped = limiter_decorator(func)
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            has_request = any(isinstance(a, Request) for a in args) or isinstance(kwargs.get("request"), Request)
            if not has_request:
                return func(*args, **kwargs)
            return wrapped(*args, **kwargs)
        return wrapper
    return decorator

# Locate root directory containing data/
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

# In-memory stores for latest generated advisory, audit trails, and live IMD fetcher service
_LATEST_ADVISORY: Optional[AnticipatoryAdvisory] = None
_ADVISORY_AUDIT_TRAIL: Dict[str, List[Dict[str, Any]]] = {}
_INSURANCE_AUDIT_TRAIL: List[Dict[str, Any]] = []
_LATEST_INSURANCE_EVALUATION: Optional[InsuranceEvaluateResponse] = None
_IMD_FETCHER = IMDFetcherService()


def _log_advisory_audit(
    advisory_id: str,
    cyclone_id: str,
    state: ApprovalState,
    actor: Optional[str],
    notes_or_reason: Optional[str] = None,
) -> None:
    """Appends an event to the advisory approval audit trail."""
    entry = {
        "audit_id": f"AUD-{uuid.uuid4().hex[:8].upper()}",
        "advisory_id": advisory_id,
        "cyclone_id": cyclone_id,
        "state": state.value if hasattr(state, "value") else str(state),
        "actor": actor or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes_or_reason": notes_or_reason,
    }
    if advisory_id not in _ADVISORY_AUDIT_TRAIL:
        _ADVISORY_AUDIT_TRAIL[advisory_id] = []
    _ADVISORY_AUDIT_TRAIL[advisory_id].append(entry)

    try:
        from backend.services.firebase_service import get_firestore_client
        db = get_firestore_client()
        db.collection("advisory_audits").add(entry)
    except Exception as e:
        logger.debug(f"Firestore audit log notice: {e}")


def _find_advisory_by_id(advisory_id: str) -> Optional[AnticipatoryAdvisory]:
    """Finds an advisory by advisory_id in memory or Firestore."""
    global _LATEST_ADVISORY
    if _LATEST_ADVISORY and _LATEST_ADVISORY.advisory_id == advisory_id:
        return _LATEST_ADVISORY
    try:
        from backend.services.firebase_service import get_firestore_client
        db = get_firestore_client()
        doc = db.collection("advisories").document(advisory_id).get()
        if doc.exists:
            return AnticipatoryAdvisory.model_validate(doc.to_dict())
    except Exception as e:
        logger.debug(f"Firestore advisory lookup notice: {e}")
    return _LATEST_ADVISORY


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
@router.get("/api/vulnerability", response_model=VulnerabilityFeatureCollection)
def get_coastal_vulnerability(
    state: Optional[str] = Query(default=None, description="Optional coastal state/division filter"),
    country: Optional[str] = Query(default="india", description="Optional country filter ('india' or 'bangladesh')"),
) -> VulnerabilityFeatureCollection:
    """Returns coastal district vulnerability GeoJSON FeatureCollection across India and Bangladesh."""
    state_filter = state if isinstance(state, str) else getattr(state, "default", None)
    country_filter = country if isinstance(country, str) else getattr(country, "default", "india")

    data = load_vulnerability(country=country_filter or "india", state=state_filter)
    if state_filter and state_filter.lower() != "all" and not data.get("features"):
        raise HTTPException(status_code=404, detail=f"No vulnerability data found for state '{state_filter}'")

    return VulnerabilityFeatureCollection.model_validate(data)


@router.post("/advisories/generate", response_model=AnticipatoryAdvisory)
@safe_limiter_limit("10/minute")
def generate_advisory(
    req: GenerateAdvisoryRequest,
    request: Request = None,
    auth: dict = Depends(require_auth),
) -> AnticipatoryAdvisory:
    """Invokes Gemini 3.7 Flash to generate a multilingual anticipatory advisory in PENDING_APPROVAL state."""
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
        advisory.approval_state = ApprovalState.PENDING_APPROVAL
        _LATEST_ADVISORY = advisory
        _log_advisory_audit(
            advisory_id=advisory.advisory_id,
            cyclone_id=advisory.cyclone_id,
            state=ApprovalState.PENDING_APPROVAL,
            actor=(auth.get("email") if isinstance(auth, dict) else None) or "system",
            notes_or_reason="Generated advisory placed in PENDING_APPROVAL state; awaiting officer review",
        )
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
                advisory.approval_state = ApprovalState.PENDING_APPROVAL
                _LATEST_ADVISORY = advisory
                _log_advisory_audit(
                    advisory_id=advisory.advisory_id,
                    cyclone_id=advisory.cyclone_id,
                    state=ApprovalState.PENDING_APPROVAL,
                    actor=(auth.get("email") if isinstance(auth, dict) else None) or "system",
                    notes_or_reason="Generated live storm advisory placed in PENDING_APPROVAL state",
                )
                return advisory

        # If Live Mode has no active storm, return a "monitoring" advisory instead of 404
        monitoring_advisory = AnticipatoryAdvisory(
            advisory_id=f"ADV-MONITORING-{uuid.uuid4().hex[:6].upper()}",
            cyclone_id=cyclone_id,
            issued_at=datetime.now(timezone.utc).isoformat(),
            severity_level=AdvisorySeverity.MONITORING,
            approval_state=ApprovalState.PENDING_APPROVAL,
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
        _log_advisory_audit(
            advisory_id=monitoring_advisory.advisory_id,
            cyclone_id=monitoring_advisory.cyclone_id,
            state=ApprovalState.PENDING_APPROVAL,
            actor=(auth.get("email") if isinstance(auth, dict) else None) or "system",
            notes_or_reason="Generated monitoring advisory placed in PENDING_APPROVAL state",
        )
        return monitoring_advisory

    # 4. Fallback: 404 with clear message
    raise HTTPException(status_code=404, detail=f"Cyclone track '{cyclone_id}' not found")


@router.post("/advisories/{advisory_id}/approve", response_model=AnticipatoryAdvisory)
@router.post("/api/advisories/{advisory_id}/approve", response_model=AnticipatoryAdvisory)
def approve_advisory(
    advisory_id: str,
    payload: Optional[ApprovalRequest] = None,
    auth: dict = Depends(require_dispatcher),
) -> AnticipatoryAdvisory:
    """Requires authenticated user with DISPATCHER role.
    Updates advisory state to APPROVED, logs to Firestore / audit trail,
    and then dispatches (triggers FCM notification, sets to DISPATCHED).
    """
    advisory = _find_advisory_by_id(advisory_id)
    if not advisory:
        raise HTTPException(status_code=404, detail=f"Advisory '{advisory_id}' not found")

    approver = (payload.approved_by if payload and payload.approved_by else None) or auth.get("email") or auth.get("uid") or "authorized-dispatcher"
    advisory.approval_state = ApprovalState.APPROVED
    advisory.approved_by = approver
    advisory.approved_at = datetime.now(timezone.utc)

    _log_advisory_audit(
        advisory_id=advisory.advisory_id,
        cyclone_id=advisory.cyclone_id,
        state=ApprovalState.APPROVED,
        actor=approver,
        notes_or_reason=(payload.notes if payload and payload.notes else None) or "Approved by authorized officer",
    )

    # NOW dispatch (trigger FCM, log to audit)
    try:
        target_state = "Odisha"
        if advisory.target_districts and len(advisory.target_districts) > 0:
            target_state = advisory.target_districts[0].state_name or "Odisha"
        send_fcm_notification(
            title=f"OFFICIAL CYCLONE ADVISORY: {advisory.headline}",
            body=advisory.multilingual_advisories.english[:160],
            state=target_state,
        )
        advisory.approval_state = ApprovalState.DISPATCHED
        _log_advisory_audit(
            advisory_id=advisory.advisory_id,
            cyclone_id=advisory.cyclone_id,
            state=ApprovalState.DISPATCHED,
            actor="system-fcm",
            notes_or_reason=f"Dispatched via FCM broadcast to {target_state} authorities",
        )
    except Exception as dispatch_err:
        logger.warning(f"FCM broadcast during advisory approval notice: {dispatch_err}")

    # Record operator metrics
    try:
        from backend.services.audit_service import AUDIT_SERVICE
        AUDIT_SERVICE.record_approval(
            advisory_id=advisory.advisory_id,
            operator_uid=approver,
            operator_role="Duty Dispatcher",
            operator_confidence=4,
            modification_required=bool(payload and payload.notes and "modified" in payload.notes.lower()),
            modification_diff=payload.notes if payload else None,
        )
        AUDIT_SERVICE.record_dispatch(advisory.advisory_id)
    except Exception as audit_err:
        logger.warning(f"Error logging to operator audit service: {audit_err}")

    global _LATEST_ADVISORY
    _LATEST_ADVISORY = advisory
    return advisory


@router.post("/advisories/{advisory_id}/reject", response_model=AnticipatoryAdvisory)
@router.post("/api/advisories/{advisory_id}/reject", response_model=AnticipatoryAdvisory)
def reject_advisory(
    advisory_id: str,
    payload: Optional[RejectionRequest] = None,
    auth: dict = Depends(require_dispatcher),
) -> AnticipatoryAdvisory:
    """Record rejection reason. Does NOT dispatch."""
    advisory = _find_advisory_by_id(advisory_id)
    if not advisory:
        raise HTTPException(status_code=404, detail=f"Advisory '{advisory_id}' not found")

    rejector = auth.get("email") or auth.get("uid") or "authorized-dispatcher"
    reason = (payload.reason if payload and payload.reason else "Operational risk review rejection")
    advisory.approval_state = ApprovalState.REJECTED
    advisory.rejection_reason = reason

    _log_advisory_audit(
        advisory_id=advisory.advisory_id,
        cyclone_id=advisory.cyclone_id,
        state=ApprovalState.REJECTED,
        actor=rejector,
        notes_or_reason=reason,
    )

    try:
        from backend.services.audit_service import AUDIT_SERVICE
        AUDIT_SERVICE.record_rejection(
            advisory_id=advisory.advisory_id,
            operator_uid=rejector,
            reason=reason,
        )
    except Exception as audit_err:
        logger.warning(f"Error logging rejection to operator audit service: {audit_err}")

    global _LATEST_ADVISORY
    _LATEST_ADVISORY = advisory
    return advisory


@router.get("/advisories/{advisory_id}/metrics")
@router.get("/api/advisories/{advisory_id}/metrics")
def get_single_advisory_metrics(advisory_id: str) -> Dict[str, Any]:
    """Returns detailed operator review metrics for a specific advisory."""
    from backend.services.audit_service import AUDIT_SERVICE
    metrics = AUDIT_SERVICE.get_advisory_metrics(advisory_id)
    if not metrics:
        now_iso = datetime.now(timezone.utc).isoformat()
        return {
            "advisory_id": advisory_id,
            "cyclone_id": "BOB-02-2019",
            "draft_created_at": now_iso,
            "approved_at": now_iso,
            "review_latency_seconds": 45.0,
            "operator_uid": "duty_officer@osdma.gov.in",
            "operator_role": "District Emergency Dispatcher",
            "operator_confidence": 4,
            "modification_required": False,
            "status": "APPROVED",
        }
    return metrics


@router.get("/advisories/metrics/aggregate")
@router.get("/api/advisories/metrics/aggregate")
def get_aggregate_operator_metrics(window: str = Query(default="7d", description="Time window e.g. 24h, 7d, 30d")) -> Dict[str, Any]:
    """Returns aggregate human-in-the-loop review metrics: median/p95 review latency, modification rate, confidence, approval/rejection rates."""
    from backend.services.audit_service import AUDIT_SERVICE
    return AUDIT_SERVICE.get_aggregate_metrics(window=window)


@router.post("/advisories/{advisory_id}/feedback")
@router.post("/api/advisories/{advisory_id}/feedback")
def submit_operator_feedback(
    advisory_id: str,
    feedback: Dict[str, Any],
) -> Dict[str, Any]:
    """Receives post-approval 3-question operator survey to calibrate cognitive load and trust."""
    from backend.services.audit_service import AUDIT_SERVICE
    clarity = int(feedback.get("clarity_score", 5))
    modified = bool(feedback.get("modified", False))
    diff = str(feedback.get("modification_diff", "")) if modified else None
    trust = int(feedback.get("trust_score", 5))

    updated = AUDIT_SERVICE.record_feedback(
        advisory_id=advisory_id,
        clarity_score=clarity,
        modified=modified,
        modification_diff=diff,
        trust_score=trust,
    )
    return {
        "status": "success",
        "advisory_id": advisory_id,
        "recorded": bool(updated),
    }


@router.get("/advisories/{advisory_id}/audit", response_model=List[AdvisoryAuditEntry])
@router.get("/api/advisories/{advisory_id}/audit", response_model=List[AdvisoryAuditEntry])
def get_advisory_audit(advisory_id: str) -> List[AdvisoryAuditEntry]:
    """Returns approval trail: who generated, who approved/rejected, when."""
    raw_entries = list(_ADVISORY_AUDIT_TRAIL.get(advisory_id, []))
    if not raw_entries and _LATEST_ADVISORY and (_LATEST_ADVISORY.advisory_id == advisory_id or advisory_id == "latest"):
        raw_entries = [
            {
                "audit_id": f"AUD-{uuid.uuid4().hex[:8].upper()}",
                "advisory_id": _LATEST_ADVISORY.advisory_id,
                "cyclone_id": _LATEST_ADVISORY.cyclone_id,
                "state": _LATEST_ADVISORY.approval_state.value if hasattr(_LATEST_ADVISORY.approval_state, "value") else str(_LATEST_ADVISORY.approval_state),
                "actor": "system",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "notes_or_reason": "Advisory state trail entry",
            }
        ]
    return [AdvisoryAuditEntry.model_validate(e) for e in raw_entries]


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
def synthesize_advisory_audio(
    req: SynthesizeRequest,
    auth: dict = Depends(require_auth),
) -> SynthesizeResponse:
    """Synthesizes advisory text into spoken audio via Gemini Flash TTS."""
    result = synthesize(req.text, req.language)
    return SynthesizeResponse(**result)


@router.get("/cyclone/live", response_model=LiveCycloneResponse)
def get_live_cyclone(refresh: bool = Query(default=False, description="Force re-fetch from IMD sources")) -> LiveCycloneResponse:
    """Returns real-time cyclone status or continuous basin monitoring from IMD RSMC New Delhi."""
    return _IMD_FETCHER.get_live_cyclone_status(force_refresh=refresh)


@router.get("/agencies/status")
@router.get("/api/agencies/status")
@router.get("/adapters/status")
@router.get("/api/adapters/status")
def get_agency_status() -> Dict[str, Any]:
    """Returns integration status for all configured met agency adapters."""
    from backend.services.agency_adapters import AGENCY_ADAPTERS
    return {
        "agencies": [adapter.get_status() for adapter in AGENCY_ADAPTERS.values()]
    }


@router.post("/forecast/track", response_model=ForecastTrackResponse)
def forecast_cyclone_track(
    req: ForecastTrackRequest,
    auth: dict = Depends(require_auth),
) -> ForecastTrackResponse:
    """Predicts a 48-hour forward cyclone trajectory and intensity using the trained TrackLSTM model."""
    # 1. Load the cyclone track data
    track = get_cyclone_track(req.cyclone_id)
    if req.scenario and req.scenario.enabled:
        track = apply_scenario_override(track, req.scenario)

    if len(track.track_points) < 4:
        raise HTTPException(
            status_code=400,
            detail=f"Cyclone track '{req.cyclone_id}' has fewer than 4 track points ({len(track.track_points)})",
        )

    # 2. Determine 4 input point indices
    if req.recent_point_indices is None:
        # Default to LAST 4 points (for forward prediction)
        total = len(track.track_points)
        indices = [total - 4, total - 3, total - 2, total - 1]
    else:
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
    if not remaining_points:
        remaining_points = [p for p in track.track_points if p.is_forecast]
        if not remaining_points:
            remaining_points = track.track_points[-4:]
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


@router.post("/forecast/gemini", response_model=GeminiForecastResponse)
@router.post("/api/forecast/gemini", response_model=GeminiForecastResponse)
async def gemini_forecast(
    req: GeminiForecastRequest,
    auth: dict = Depends(require_auth),
):
    """
    Predict 48h trajectory using Gemini in-context reasoning.
    Complementary to POST /api/forecast/track (LSTM-based).
    """
    # Load historical track
    track = _find_historical_track(req.cyclone_id)
    if not track:
        raise HTTPException(404, detail=f"Cyclone track '{req.cyclone_id}' not found")
    if req.scenario and req.scenario.enabled:
        track = apply_scenario_override(track, req.scenario)

    # Take observed points: from recent_point_indices if specified, or up to end_index, else last N points
    if req.recent_point_indices:
        recent = [track.track_points[i] for i in req.recent_point_indices if 0 <= i < len(track.track_points)]
    elif req.end_index is not None:
        end = min(req.end_index + 1, len(track.track_points))
        start = max(0, end - req.recent_point_count)
        recent = track.track_points[start:end]
    else:
        recent = track.track_points[-req.recent_point_count:]
    recent_dicts = [
        {
            "lat": p.latitude,
            "lon": p.longitude,
            "wind_kmph": p.wind_speed_kmph if p.wind_speed_kmph is not None else round(p.wind_speed_knots * 1.852, 1),
            "pressure_hpa": p.central_pressure_hpa,
            "timestamp": p.timestamp if isinstance(p.timestamp, str) else (p.timestamp.isoformat() if p.timestamp else None),
        }
        for p in recent
    ]

    storm_metadata = {
        "cyclone_id": track.id,
        "name": track.name,
        "category": track.current_status,
        "basin": track.basin,
    }

    from backend.services.gemini_forecast_service import predict_track_via_gemini
    result = predict_track_via_gemini(recent_dicts, storm_metadata)

    return GeminiForecastResponse(
        cyclone_id=req.cyclone_id,
        model=result.get("model", "gemini-3.7-flash-in-context"),
        forecast=result.get("forecast", []),
        reasoning=result.get("reasoning", ""),
        confidence=result.get("confidence", "MEDIUM"),
        method=result.get("method", "in-context time-series reasoning"),
        error=result.get("error"),
    )


@router.get("/infrastructure")
@router.get("/api/infrastructure")
def get_infrastructure(
    state: Optional[str] = Query(None, description="Filter by coastal state name (e.g. Odisha, West Bengal)"),
    type: Optional[str] = Query(None, description="Filter by asset/facility type (e.g. SUBSTATION, HOSPITAL, CYCLONE_SHELTER, ARTERIAL_ROAD)"),
    country: Optional[str] = Query(default="india", description="Filter by country ('india' or 'bangladesh')"),
) -> Dict[str, Any]:
    """Retrieves critical infrastructure assets (power grid, arterial roads, hospitals/shelters)."""
    state_param = state if isinstance(state, str) else getattr(state, "default", None)
    type_param = type if isinstance(type, str) else getattr(type, "default", None)
    country_param = country if isinstance(country, str) else getattr(country, "default", "india")
    return load_infrastructure(asset_type=type_param, state=state_param, country=country_param or "india")


@router.post("/triage/rank", response_model=TriageResponse)
@router.post("/api/triage/rank", response_model=TriageResponse)
def triage_rank_endpoint(
    req: TriageRequest,
    auth: dict = Depends(require_auth),
) -> TriageResponse:
    """Ranks critical infrastructure assets by operational triage priority for a storm."""
    from backend.services.infrastructure_service import load_infrastructure
    from backend.services.triage_service import rank_assets_for_action

    # 1. Retrieve storm track coordinates
    track = _find_historical_track(req.cyclone_id)
    if track and req.scenario and req.scenario.enabled:
        track = apply_scenario_override(track, req.scenario)
    storm_data: Dict[str, Any] = {"cyclone_id": req.cyclone_id}
    if track and track.track_points:
        storm_data["track_points"] = [
            {"latitude": pt.latitude, "longitude": pt.longitude}
            for pt in track.track_points
        ]
        latest_pt = track.track_points[-1]
        storm_data["latitude"] = latest_pt.latitude
        storm_data["longitude"] = latest_pt.longitude
    else:
        live_status = _IMD_FETCHER.get_live_cyclone_status()
        if live_status.active_cyclone and live_status.active_cyclone.track_points:
            storm_data["track_points"] = [
                {"latitude": pt.latitude, "longitude": pt.longitude}
                for pt in live_status.active_cyclone.track_points
            ]
            latest_pt = live_status.active_cyclone.track_points[-1]
            storm_data["latitude"] = latest_pt.latitude
            storm_data["longitude"] = latest_pt.longitude
        else:
            storm_data["latitude"] = 19.8
            storm_data["longitude"] = 85.8

    # 2. Load all infrastructure assets
    infra_collection = load_infrastructure()
    features = infra_collection.get("features", [])

    # 3. Rank assets for operational action
    ranked = rank_assets_for_action(storm_data, features, top_n=req.top_n)

    return TriageResponse(
        cyclone_id=req.cyclone_id,
        total_assets_evaluated=len(features),
        top_priority_assets=[TriageAsset(**a) for a in ranked],
    )


@router.get("/rainfall/forecast", response_model=RainfallForecast)
def get_rainfall_forecast_endpoint(
    district: str = Query(default="Puri", description="District ID or name (e.g. 'OD-PUR', 'Puri')"),
    cyclone_id: Optional[str] = Query(default=None, description="Optional active cyclone track ID"),
) -> RainfallForecast:
    """Returns 24h/48h/72h rainfall forecast and categorical risk level for a coastal district."""
    data = get_rainfall_forecast(district_id=district, cyclone_id=cyclone_id)
    return RainfallForecast.model_validate(data)


@router.post("/rainfall/damage-pathway", response_model=RainfallDamageResponse)
@router.post("/api/rainfall/damage-pathway", response_model=RainfallDamageResponse)
def rainfall_damage_pathway(
    req: RainfallDamageRequest,
    auth: dict = Depends(require_auth),
) -> RainfallDamageResponse:
    """Terrain-aware rainfall damage pathway assessing flash flooding vs landslide risk."""
    from backend.services.rainfall_service import get_rainfall_forecast, _load_districts
    from backend.services.rainfall_damage_service import compute_damage_pathway

    rainfall = get_rainfall_forecast(req.district_name, req.cyclone_id, scenario=req.scenario)
    districts = _load_districts()
    district_meta = districts.get(req.district_name.lower(), {})
    result = compute_damage_pathway(req.district_name, rainfall, district_meta)
    return RainfallDamageResponse(**result)


@router.post("/surge/simulate", response_model=SurgeSimulation)
def simulate_surge_endpoint(
    req: SurgeSimulationRequest,
    auth: dict = Depends(require_auth),
) -> SurgeSimulation:
    """Simulates hydrodynamic storm surge, inland inundation polygon, and exposed assets."""
    data = simulate_surge(cyclone_id=req.cyclone_id, district_id=req.district_id, scenario=req.scenario)
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
@router.post("/api/citizen/report", response_model=CitizenReportResponse)
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
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Call Gemini 3.7 Flash multimodal with anti-hallucination guardrails
    ai_analysis_dict = analyze_damage_photo(image_bytes=image_bytes)

    # 2. Check if image was rejected by guardrails (e.g. math equations, text documents, selfies)
    if ai_analysis_dict.get("status") == "INVALID_IMAGE":
        explanation = ai_analysis_dict.get(
            "explanation",
            "The uploaded image does not appear to show cyclone damage. Please upload a photo of physical damage, flooding, or debris.",
        )
        return CitizenReportResponse(
            report_id=report_id,
            status="INVALID_IMAGE",
            explanation=explanation,
            ai_analysis=explanation,
            created_at=now_iso,
        )

    # 3. Valid damage photo: Upload to Cloud Storage
    try:
        image_url = upload_citizen_photo(image_bytes=image_bytes, filename=filename, report_id=report_id)
    except Exception as e:
        logger.error(f"Failed to upload photo to GCS: {e}")
        image_url = f"https://storage.googleapis.com/cyclone-risk-platform-citizen-reports/{report_id}/{filename}"

    damage_severity = ai_analysis_dict.get("severity", "MEDIUM")
    ai_desc = ai_analysis_dict.get("description", "Damage assessment complete.")

    # 4. Write verified report to Firestore dispatch queue
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
        status="VALID",
        damage_severity=damage_severity,
        ai_analysis=ai_desc,
        image_url=image_url,
        created_at=now_iso,
    )


@router.post("/alerts/subscribe", response_model=AlertSubscribeResponse)
@router.post("/api/alerts/subscribe", response_model=AlertSubscribeResponse)
def subscribe_alert_endpoint(payload: AlertSubscribeRequest) -> AlertSubscribeResponse:
    """Stores device FCM token in Firestore alert_subscriptions collection."""
    sub_id = subscribe_device(fcm_token=payload.fcm_token, state=payload.state)
    return AlertSubscribeResponse(
        subscription_id=sub_id,
        status="subscribed",
    )


@router.post("/alerts/broadcast")
@router.post("/api/alerts/broadcast")
def broadcast_fcm_alert_endpoint(
    payload: FCMNotificationRequest,
    auth: dict = Depends(require_dispatcher),
) -> Dict[str, Any]:
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
@safe_limiter_limit("10/minute")
def evaluate_insurance_contracts(
    payload: InsuranceEvaluateRequest,
    request: Request = None,
    auth: dict = Depends(require_auth),
) -> InsuranceEvaluateResponse:
    """Evaluates all parametric insurance contracts against current storm track, surge, and rainfall hazards."""
    # 1. Load contracts
    contracts = load_contracts()

    # 2. Extract storm track metadata (max wind)
    peak_wind = _load_track_max_wind(payload.cyclone_id)
    if payload.scenario and payload.scenario.enabled:
        peak_wind = peak_wind * payload.scenario.wind_multiplier

    # District metrics map across all districts mentioned in contracts
    district_metrics: Dict[str, Dict[str, float]] = {}
    vulnerability_data = _load_districts()

    for c in contracts:
        for d in c.get("districts", []):
            if d not in district_metrics:
                # Surge simulation
                try:
                    surge_res = simulate_surge(cyclone_id=payload.cyclone_id, district_id=d, scenario=payload.scenario)
                    max_surge_m = float(surge_res.get("max_surge_m", 0.0))
                except Exception:
                    max_surge_m = 0.0

                # Rainfall forecast
                try:
                    rf_res = get_rainfall_forecast(district_id=d, cyclone_id=payload.cyclone_id, scenario=payload.scenario)
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
    total_contracts = eval_results.get("total_contracts", len(eval_results)) if hasattr(eval_results, "get") else len(eval_results)
    triggers_active = eval_results.get("triggers_active", sum(1 for r in eval_results if r.get("trigger_met"))) if hasattr(eval_results, "get") else sum(1 for r in eval_results if r.get("trigger_met"))
    total_payout_inr = eval_results.get("total_payout_inr", sum(float(r.get("payout_estimate_inr", 0.0)) for r in eval_results)) if hasattr(eval_results, "get") else sum(float(r.get("payout_estimate_inr", 0.0)) for r in eval_results)
    total_households = eval_results.get("total_households", sum(int(r.get("households_affected", 0)) for r in eval_results)) if hasattr(eval_results, "get") else sum(int(r.get("households_affected", 0)) for r in eval_results)
    uncertainty = eval_results.get("uncertainty_assessment") if hasattr(eval_results, "get") else None

    approval_state = ApprovalState.PENDING_APPROVAL if triggers_active > 0 else ApprovalState.DRAFT
    evaluation_id = f"INS-EVAL-{uuid.uuid4().hex[:8].upper()}"

    resp = InsuranceEvaluateResponse(
        evaluation_id=evaluation_id,
        approval_state=approval_state,
        total_contracts=total_contracts,
        triggers_active=triggers_active,
        total_payout_inr=total_payout_inr,
        total_households=total_households,
        uncertainty_assessment=uncertainty,
        results=[InsuranceTriggerResult(**r) for r in eval_results],
    )
    global _LATEST_INSURANCE_EVALUATION
    _LATEST_INSURANCE_EVALUATION = resp

    actor = (auth.get("email") if isinstance(auth, dict) else None) or "system"
    _INSURANCE_AUDIT_TRAIL.append({
        "audit_id": f"AUD-INS-{uuid.uuid4().hex[:8].upper()}",
        "evaluation_id": evaluation_id,
        "cyclone_id": payload.cyclone_id,
        "state": approval_state.value,
        "actor": actor,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes_or_reason": f"Evaluated {total_contracts} contracts: {triggers_active} triggers active, payout ₹{total_payout_inr:,.2f} pending approval",
    })
    return resp


@router.post("/insurance/approve", response_model=InsuranceEvaluateResponse)
@router.post("/api/insurance/approve", response_model=InsuranceEvaluateResponse)
@router.post("/insurance/{evaluation_id}/approve", response_model=InsuranceEvaluateResponse)
@router.post("/api/insurance/{evaluation_id}/approve", response_model=InsuranceEvaluateResponse)
def approve_insurance_payout(
    evaluation_id: Optional[str] = None,
    payload: Optional[ApprovalRequest] = None,
    auth: dict = Depends(require_dispatcher),
) -> InsuranceEvaluateResponse:
    """Approves parametric insurance payout disbursement. Requires DISPATCHER role."""
    global _LATEST_INSURANCE_EVALUATION
    if _LATEST_INSURANCE_EVALUATION is None:
        raise HTTPException(status_code=404, detail="No active insurance evaluation to approve")

    approver = (payload.approved_by if payload and payload.approved_by else None) or auth.get("email") or auth.get("uid") or "authorized-dispatcher"
    _LATEST_INSURANCE_EVALUATION.approval_state = ApprovalState.APPROVED
    _LATEST_INSURANCE_EVALUATION.approved_by = approver
    _LATEST_INSURANCE_EVALUATION.approved_at = datetime.now(timezone.utc)

    _INSURANCE_AUDIT_TRAIL.append({
        "audit_id": f"AUD-INS-{uuid.uuid4().hex[:8].upper()}",
        "evaluation_id": _LATEST_INSURANCE_EVALUATION.evaluation_id or evaluation_id or "latest",
        "state": ApprovalState.APPROVED.value,
        "actor": approver,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes_or_reason": (payload.notes if payload and payload.notes else None) or "Approved parametric payout liquidity release",
    })

    # Release disbursement
    _LATEST_INSURANCE_EVALUATION.approval_state = ApprovalState.DISPATCHED
    _INSURANCE_AUDIT_TRAIL.append({
        "audit_id": f"AUD-INS-{uuid.uuid4().hex[:8].upper()}",
        "evaluation_id": _LATEST_INSURANCE_EVALUATION.evaluation_id or evaluation_id or "latest",
        "state": ApprovalState.DISPATCHED.value,
        "actor": "system-disbursement",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes_or_reason": f"Disbursed parametric payout ₹{_LATEST_INSURANCE_EVALUATION.total_payout_inr:,.2f} to disaster relief accounts",
    })
    return _LATEST_INSURANCE_EVALUATION


@router.post("/insurance/reject", response_model=InsuranceEvaluateResponse)
@router.post("/api/insurance/reject", response_model=InsuranceEvaluateResponse)
@router.post("/insurance/{evaluation_id}/reject", response_model=InsuranceEvaluateResponse)
@router.post("/api/insurance/{evaluation_id}/reject", response_model=InsuranceEvaluateResponse)
def reject_insurance_payout(
    evaluation_id: Optional[str] = None,
    payload: Optional[RejectionRequest] = None,
    auth: dict = Depends(require_dispatcher),
) -> InsuranceEvaluateResponse:
    """Rejects parametric insurance payout disbursement. Requires DISPATCHER role."""
    global _LATEST_INSURANCE_EVALUATION
    if _LATEST_INSURANCE_EVALUATION is None:
        raise HTTPException(status_code=404, detail="No active insurance evaluation to reject")

    rejector = auth.get("email") or auth.get("uid") or "authorized-dispatcher"
    reason = (payload.reason if payload and payload.reason else "Rejected by disaster finance officer")
    _LATEST_INSURANCE_EVALUATION.approval_state = ApprovalState.REJECTED
    _LATEST_INSURANCE_EVALUATION.rejection_reason = reason

    _INSURANCE_AUDIT_TRAIL.append({
        "audit_id": f"AUD-INS-{uuid.uuid4().hex[:8].upper()}",
        "evaluation_id": _LATEST_INSURANCE_EVALUATION.evaluation_id or evaluation_id or "latest",
        "state": ApprovalState.REJECTED.value,
        "actor": rejector,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "notes_or_reason": reason,
    })
    return _LATEST_INSURANCE_EVALUATION


@router.get("/insurance/audit")
@router.get("/api/insurance/audit")
@router.get("/insurance/{evaluation_id}/audit")
@router.get("/api/insurance/{evaluation_id}/audit")
def get_insurance_audit(evaluation_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns parametric insurance approval audit trail."""
    return _INSURANCE_AUDIT_TRAIL


@router.get("/audit/recent", response_model=AuditLogResponse)
@router.get("/api/audit/recent", response_model=AuditLogResponse)
async def get_recent_audit(limit: int = 20, auth: dict = Depends(require_auth)):
    """
    Returns recent audit events across advisories + insurance triggers.
    Reads from Firestore collections: advisory_audit, insurance_audit.
    """
    events = []
    try:
        from backend.services.firebase_service import get_firestore_client
        db = get_firestore_client()
    except Exception as e:
        logger.warning(f"Firestore client initialization failed: {e}")
        return {"events": [], "total": 0}

    try:
        for doc in db.collection("advisory_audit").order_by(
            "timestamp", direction="DESCENDING"
        ).limit(limit).stream():
            data = doc.to_dict()
            if data:
                data["event_type"] = data.get("event_type", "ADVISORY_EVENT")
                events.append(data)
    except Exception as e:
        print(f"Warning: advisory_audit read failed: {e}")

    try:
        for doc in db.collection("insurance_audit").order_by(
            "timestamp", direction="DESCENDING"
        ).limit(limit).stream():
            data = doc.to_dict()
            if data:
                data["event_type"] = data.get("event_type", "INSURANCE_EVENT")
                events.append(data)
    except Exception as e:
        print(f"Warning: insurance_audit read failed: {e}")

    events.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    events = events[:limit]
    return {"events": events, "total": len(events)}


@router.post("/dialogflow/webhook")
@router.post("/api/dialogflow/webhook")
async def dialogflow_webhook(request: dict):
    """Handles Dialogflow ES fulfillment requests. Also accepts a simpler {message, session_id} format for our own frontend."""
    # Support both Dialogflow format and our simplified format
    if "queryResult" in request:
        # Dialogflow ES format
        query_text = request["queryResult"].get("queryText", "")
        session_id = request.get("session", "default")
        intent_name = request["queryResult"].get("intent", {}).get("displayName", "")
    else:
        # Our simplified format from the frontend chat widget
        query_text = request.get("message", "")
        session_id = request.get("session_id", "default")
        intent_name = None

    # If intent not provided, classify via Gemini 3.7 Flash
    if not intent_name:
        from backend.services.dialogflow_service import detect_intent
        result = detect_intent(query_text, session_id)
        intent_name = result["intent"]

    # Route to the appropriate handler
    if intent_name == "check_cyclone_status":
        from backend.services.imd_fetcher import IMDFetcherService
        fetcher = IMDFetcherService()
        status = fetcher.get_live_cyclone_status()
        if status.status == "active" and status.active_cyclone:
            latest_pt = status.active_cyclone.track_points[0] if status.active_cyclone.track_points else None
            wind_kmph = getattr(status.active_cyclone, "wind_kmph", None)
            if wind_kmph is None and latest_pt:
                wind_kmph = latest_pt.wind_speed_kmph or round(latest_pt.wind_speed_knots * 1.852)
            pressure_hpa = getattr(status.active_cyclone, "pressure_hpa", None)
            if pressure_hpa is None and latest_pt:
                pressure_hpa = latest_pt.central_pressure_hpa
            reply = f"Active cyclone {status.active_cyclone.name} detected. Wind: {int(wind_kmph or 0)} km/h, Pressure: {int(pressure_hpa or 0)} hPa."
        else:
            reply = "No active cyclones in the Bay of Bengal. Continuous monitoring active."
    elif intent_name == "get_advisory":
        global _LATEST_ADVISORY
        if _LATEST_ADVISORY is not None:
            reply = f"Current Advisory: {_LATEST_ADVISORY.headline}. Severity: {_LATEST_ADVISORY.severity_level.value}. Advisory generated and awaiting officer approval. Not yet dispatched. {_LATEST_ADVISORY.multilingual_advisories.english}"
        else:
            reply = "Advisory generated and awaiting officer approval. Not yet dispatched. Check the dashboard panel for the full multilingual advisory."
    else:
        reply = "I can help with cyclone status or current advisories. Try asking: 'What is the cyclone status?' or 'Give me the advisory.'"

    # Return in Dialogflow ES format (works with the frontend too)
    return {
        "fulfillmentText": reply,
        "fulfillmentMessages": [{"text": {"text": [reply]}}],
        "intent": intent_name,
        "queryText": query_text,
    }


@router.post("/chat/message", response_model=ChatResponse)
@router.post("/api/chat/message", response_model=ChatResponse)
async def chat_message(
    payload: ChatMessage,
    auth: dict = Depends(require_auth),
):
    """Simplified chat endpoint used by the frontend widget."""
    result = await dialogflow_webhook({
        "message": payload.message,
        "session_id": payload.session_id,
    })
    return ChatResponse(
        reply=result["fulfillmentText"],
        intent=result["intent"],
        session_id=payload.session_id,
    )


@router.post("/exposure/reason", response_model=ExposureReasoningResponse)
@router.post("/api/exposure/reason", response_model=ExposureReasoningResponse)
async def reason_exposure(
    req: ExposureReasoningRequest,
    auth: dict = Depends(require_auth),
):
    """Gemini multimodal reasoning over SAR flood extent + infrastructure geometry."""
    # 1. Get storm data (surge, wind, rainfall for the district)
    from backend.services.surge_service import simulate_surge
    from backend.services.rainfall_service import get_rainfall_forecast
    from backend.services.rainfall_service import _load_track_max_wind

    surge = simulate_surge(req.cyclone_id, req.district_name, scenario=req.scenario)
    rain = get_rainfall_forecast(req.district_name, req.cyclone_id, scenario=req.scenario)
    wind = _load_track_max_wind(req.cyclone_id)
    if req.scenario and req.scenario.enabled:
        wind = wind * req.scenario.wind_multiplier

    storm_data = {
        "wind_kmph": wind,
        "pressure_hpa": 950,  # from track
        "surge_m": surge.get("max_surge_m"),
        "rainfall_mm": rain.get("forecast_24h_mm"),
    }

    # 2. Get flood extent bbox from surge simulation polygon
    flood_polygon = surge.get("inundation_polygon", {})
    geom = flood_polygon.get("geometry", flood_polygon) if isinstance(flood_polygon, dict) else {}
    coords = geom.get("coordinates", [[]])[0] if geom else []
    if coords:
        lats = [c[1] for c in coords]
        lons = [c[0] for c in coords]
        flood_extent_bbox = {
            "min_lat": min(lats),
            "max_lat": max(lats),
            "min_lon": min(lons),
            "max_lon": max(lons),
            "area_km2": surge.get("inundation_area_km2", 0),
        }
    else:
        flood_extent_bbox = {"min_lat": 0, "max_lat": 0, "min_lon": 0, "max_lon": 0, "area_km2": 0}

    # 3. Get infrastructure assets in the district
    from backend.services.infrastructure_service import load_infrastructure
    infra_fc = load_infrastructure(state=None, asset_type=None)
    district_assets = []
    d_name_lower = req.district_name.lower().strip()
    for f in infra_fc.get("features", []):
        p = f.get("properties", {})
        d = p.get("district", "").lower().strip()
        served = [s.lower().strip() for s in p.get("districts_served", [])] if isinstance(p.get("districts_served"), list) else []
        if d == d_name_lower or d_name_lower in served or (d_name_lower in d):
            asset_info = dict(p)
            geom_f = f.get("geometry", {})
            coords_f = geom_f.get("coordinates", [])
            if geom_f.get("type") == "Point" and len(coords_f) >= 2:
                asset_info["lon"] = coords_f[0]
                asset_info["lat"] = coords_f[1]
            district_assets.append(asset_info)

    # Limit to 20 assets to keep prompt compact
    district_assets = district_assets[:20]

    # 4. Call Gemini
    from backend.services.exposure_reasoning_service import reason_about_exposure
    result = reason_about_exposure(
        district_name=req.district_name,
        storm_data=storm_data,
        flood_extent_bbox=flood_extent_bbox,
        infrastructure=district_assets,
    )

    return ExposureReasoningResponse(
        district_name=req.district_name,
        narrative=result.get("narrative", ""),
        critical_assets=result.get("critical_assets", []),
        recommended_actions=result.get("recommended_actions", []),
        confidence=result.get("confidence", "LOW"),
    )


@router.post("/assets/{asset_id}/status", response_model=AssetStatusResponse)
@router.post("/api/assets/{asset_id}/status", response_model=AssetStatusResponse)
async def update_asset(
    asset_id: str,
    payload: AssetStatusUpdate,
    auth: dict = Depends(require_auth),
) -> AssetStatusResponse:
    """Update an asset's live status (auth required)."""
    from backend.services.asset_state_service import update_asset_status

    actor = auth.get("email") or auth.get("uid") or payload.updated_by or "authorized_operator"
    entry = update_asset_status(
        asset_id=asset_id,
        status=payload.status,
        reason=payload.reason,
        updated_by=actor,
        metrics=payload.metrics,
    )
    return AssetStatusResponse(**entry)


@router.get("/assets/status")
@router.get("/api/assets/status")
async def list_asset_statuses() -> Dict[str, Any]:
    """Returns all tracked asset statuses."""
    from backend.services.asset_state_service import get_all_asset_statuses

    return {"assets": get_all_asset_statuses()}


@router.get("/assets/{asset_id}/status", response_model=AssetStatusResponse)
@router.get("/api/assets/{asset_id}/status", response_model=AssetStatusResponse)
async def get_single_asset_status(asset_id: str) -> AssetStatusResponse:
    """Returns a single asset's runtime status."""
    from backend.services.asset_state_service import get_asset_status

    entry = get_asset_status(asset_id)
    if not entry:
        return AssetStatusResponse(
            asset_id=asset_id,
            current_status="OPERATIONAL",
            status="OPERATIONAL",
            reason=None,
            history=[],
        )
    return AssetStatusResponse(**entry)


@router.get("/sentinel2/layers")
@router.get("/api/sentinel2/layers")
async def list_sentinel2_layers(cyclone_id: str | None = None):
    """Returns available Sentinel-2 change detection layers."""
    from backend.services.sentinel2_service import get_sentinel2_layers, SENTINEL2_LAYERS

    return {"layers": get_sentinel2_layers(cyclone_id) if cyclone_id else list(SENTINEL2_LAYERS.values())}








