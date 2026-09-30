"""Pydantic schemas for cyclone tracks, vulnerability features, and anticipatory advisories."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class ApprovalState(str, Enum):
    """Human-in-the-loop operational approval lifecycle for advisories and insurance payouts."""

    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPATCHED = "DISPATCHED"


class ApprovalRequest(BaseModel):
    """Payload to approve an advisory or insurance liquidity disbursement."""

    approved_by: Optional[str] = Field(default="dispatcher", description="Officer/Dispatcher identifier")
    notes: Optional[str] = Field(default=None, description="Operational sign-off notes")


class RejectionRequest(BaseModel):
    """Payload to reject an advisory or insurance payout."""

    rejected_by: Optional[str] = Field(default="officer", description="Officer identifier")
    reason: str = Field(description="Operational reason for rejecting dispatch")


class AdvisoryAuditEntry(BaseModel):
    """Audit log record for advisory state changes."""

    audit_id: str
    advisory_id: str
    cyclone_id: str
    state: ApprovalState
    actor: Optional[str] = None
    timestamp: datetime
    notes_or_reason: Optional[str] = None


class AuditEvent(BaseModel):
    event_type: str
    timestamp: Optional[str] = None
    actor: Optional[str] = None
    resource_id: Optional[str] = None
    reason: Optional[str] = None
    headline: Optional[str] = None


class AuditLogResponse(BaseModel):
    events: List[AuditEvent]
    total: int


class TrackCategory(str, Enum):
    """IMD tropical cyclone intensity classification."""

    LOW_PRESSURE = "Low Pressure Area"
    DEPRESSION = "Depression"
    DEEP_DEPRESSION = "Deep Depression"
    CYCLONIC_STORM = "Cyclonic Storm"
    SEVERE_CYCLONIC_STORM = "Severe Cyclonic Storm"
    VERY_SEVERE_CYCLONIC_STORM = "Very Severe Cyclonic Storm"
    EXTREMELY_SEVERE_CYCLONIC_STORM = "Extremely Severe Cyclonic Storm"
    SUPER_CYCLONIC_STORM = "Super Cyclonic Storm"
    WELL_MARKED_LOW = "Well Marked Low"


class TrackPoint(BaseModel):
    """Individual observation or forecast point along the cyclone trajectory."""

    timestamp: str = Field(description="ISO-8601 UTC timestamp")
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    wind_speed_knots: float = Field(ge=0)
    wind_speed_kmph: Optional[float] = Field(default=None, ge=0)
    gust_speed_kmph: Optional[float] = Field(default=None, ge=0)
    central_pressure_hpa: float = Field(ge=800, le=1050)
    category: TrackCategory
    is_forecast: bool = Field(default=False)
    forecast_lead_hours: Optional[int] = Field(default=0, ge=0)
    cone_radius_km: Optional[float] = Field(default=0.0, ge=0)
    heading_degrees: Optional[float] = Field(default=None, ge=0, le=360)
    forward_speed_kmph: Optional[float] = Field(default=None, ge=0)


class CycloneTrack(BaseModel):
    """Complete cyclone track dataset containing metadata and ordered track points."""

    id: str = Field(description="Unique storm identifier (e.g. BOB-02-2019)")
    name: str = Field(description="Storm name designated by RSMC New Delhi")
    season_year: int = Field(ge=1900, le=2100)
    basin: str = Field(default="Bay of Bengal")
    current_status: str
    genesis_time: str
    dissipation_time: Optional[str] = None
    track_points: List[TrackPoint]


class VulnerabilityProperties(BaseModel):
    """Properties describing socio-economic, elevation, and shelter vulnerability for a district."""

    district_id: str
    district_name: str
    state_name: str
    total_population: int = Field(ge=0)
    vulnerable_population: int = Field(ge=0)
    coastal_length_km: float = Field(ge=0)
    average_elevation_m: float
    cyclone_risk_score: float = Field(ge=0.0, le=1.0)
    storm_surge_risk_m: float = Field(ge=0.0)
    shelter_capacity: int = Field(ge=0)
    shelter_count: int = Field(ge=0)
    hospital_count: int = Field(default=0, ge=0)
    primary_language: str
    secondary_language: Optional[str] = None
    population: Optional[int] = None
    kutcha_population: Optional[int] = None
    coastline_km: Optional[float] = None
    elevation_m: Optional[float] = None
    vulnerability_score: Optional[float] = None
    inundation_risk: Optional[float] = None
    evac_shelters: Optional[int] = None


# Alias for backward and TypeScript naming compatibility
DistrictProperties = VulnerabilityProperties


class VulnerabilityGeometry(BaseModel):
    """GeoJSON geometry (Polygon or MultiPolygon)."""

    type: str = Field(pattern="^(Polygon|MultiPolygon)$")
    coordinates: list


class VulnerabilityFeature(BaseModel):
    """GeoJSON Feature representing a district vulnerability entity."""

    type: str = Field(default="Feature")
    properties: VulnerabilityProperties
    geometry: VulnerabilityGeometry


class VulnerabilityFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection wrapper for district vulnerability layers."""

    type: str = Field(default="FeatureCollection")
    name: Optional[str] = None
    crs: Optional[dict] = None
    features: List[VulnerabilityFeature]


class MultilingualAdvisories(BaseModel):
    """Multilingual text advisories in target regional languages."""

    odia: str
    bengali: str
    telugu: str
    tamil: str
    hindi: str
    english: str
    gujarati: Optional[str] = None
    marathi: Optional[str] = None
    kannada: Optional[str] = None
    malayalam: Optional[str] = None
    konkani: Optional[str] = None


class ActionCategory(str, Enum):
    """Category of anticipatory action."""

    EVACUATION = "EVACUATION"
    SHELTER = "SHELTER"
    FISHERFOLK = "FISHERFOLK"
    AGRICULTURE = "AGRICULTURE"
    POWER_UTILITY = "POWER_UTILITY"
    HEALTHCARE = "HEALTHCARE"


class ActionUrgency(str, Enum):
    """Urgency level for anticipatory actions."""

    IMMEDIATE = "IMMEDIATE"
    WITHIN_12_HOURS = "WITHIN_12_HOURS"
    WITHIN_24_HOURS = "WITHIN_24_HOURS"
    PRECAUTIONARY = "PRECAUTIONARY"


class ActionItem(BaseModel):
    """Targeted actionable early warning instruction."""

    category: ActionCategory
    action: str
    urgency: ActionUrgency
    target_audience: str


class AdvisorySeverity(str, Enum):
    """Anticipatory advisory alert level."""

    WATCH = "WATCH"
    ALERT = "ALERT"
    WARNING = "WARNING"
    EMERGENCY_ACTION = "EMERGENCY_ACTION"
    MONITORING = "MONITORING"


class AnticipatoryAdvisory(BaseModel):
    """Anticipatory action advisory payload generated by Gemini multimodal analysis."""

    advisory_id: str
    cyclone_id: str
    issued_at: str
    severity_level: AdvisorySeverity
    lead_time_hours: Optional[float] = Field(default=None, ge=0)
    estimated_landfall_time: Optional[str] = None
    estimated_landfall_location: Optional[str] = None
    max_expected_wind_kmph: Optional[float] = None
    max_expected_surge_m: Optional[float] = None
    target_districts: List[str]
    headline: str
    multilingual_advisories: MultilingualAdvisories
    recommended_actions: List[ActionItem]
    model: str = Field(default="gemini-3.7-flash", description="Model used to generate advisory")
    approval_state: ApprovalState = Field(default=ApprovalState.DRAFT, description="Human-in-the-loop approval state")
    approved_by: Optional[str] = Field(default=None, description="Officer / Dispatcher identifier who approved")
    approved_at: Optional[datetime] = Field(default=None, description="Timestamp of operational approval")
    rejection_reason: Optional[str] = Field(default=None, description="Reason if rejected")


class LiveCycloneResponse(BaseModel):
    """Payload for live real-time cyclone status from IMD RSMC New Delhi."""

    active_cyclone: Optional[CycloneTrack] = None
    last_updated: str = Field(description="ISO-8601 UTC timestamp of last check")
    source: str = Field(default="IMD RSMC New Delhi")
    status: str = Field(description="'active' or 'monitoring'")
    message: str = Field(description="Human-readable status or warning summary")


class ScenarioOverride(BaseModel):
    """What-if scenario parameter overrides to simulate hypothetical storm conditions."""

    cyclone_id: str = "fani"
    wind_multiplier: float = 1.0  # 0.5 to 1.5
    pressure_offset_hpa: float = 0.0  # -30 to +30
    track_shift_lat: float = 0.0  # -1.0 to +1.0 degrees
    track_shift_lon: float = 0.0  # -1.0 to +1.0 degrees
    forward_speed_multiplier: float = 1.0  # 0.5 to 2.0
    enabled: bool = False


def apply_scenario_override(track: CycloneTrack, override: Optional[ScenarioOverride]) -> CycloneTrack:
    """Apply what-if scenario parameter overrides to a CycloneTrack instance."""
    if not override or not override.enabled:
        return track

    modified_points = []
    for pt in track.track_points:
        # Wind multiplier
        new_wind_knots = (
            round(pt.wind_speed_knots * override.wind_multiplier, 1)
            if pt.wind_speed_knots is not None
            else 0.0
        )
        new_wind_kmph = round(
            (pt.wind_speed_kmph if pt.wind_speed_kmph is not None else pt.wind_speed_knots * 1.852)
            * override.wind_multiplier,
            1,
        )
        new_gust_kmph = (
            round(pt.gust_speed_kmph * override.wind_multiplier, 1)
            if pt.gust_speed_kmph is not None
            else None
        )

        # Pressure offset
        new_pressure = round(float(pt.central_pressure_hpa) + override.pressure_offset_hpa, 1)
        new_pressure = max(800.0, min(1050.0, new_pressure))

        # Track shift
        new_lat = round(pt.latitude + override.track_shift_lat, 4)
        new_lon = round(pt.longitude + override.track_shift_lon, 4)

        # Forward speed
        new_forward_speed = (
            round(pt.forward_speed_kmph * override.forward_speed_multiplier, 1)
            if pt.forward_speed_kmph is not None
            else None
        )

        modified_pt = pt.model_copy(
            update={
                "wind_speed_knots": new_wind_knots,
                "wind_speed_kmph": new_wind_kmph,
                "gust_speed_kmph": new_gust_kmph,
                "central_pressure_hpa": new_pressure,
                "latitude": new_lat,
                "longitude": new_lon,
                "forward_speed_kmph": new_forward_speed,
            }
        )
        modified_points.append(modified_pt)

    return track.model_copy(update={"track_points": modified_points})


class ForecastTrackRequest(BaseModel):
    """Payload to request LSTM track forecast for a specific cyclone."""

    cyclone_id: str = Field(default="BOB-02-2019", description="Cyclone ID or name (e.g. 'BOB-02-2019', 'fani')")
    recent_point_indices: Optional[List[int]] = Field(
        default=None,
        description="4 point indices from historical/live track used as input sequence (default: [0, 1, 2, 3])"
    )
    scenario: Optional[ScenarioOverride] = Field(
        default=None,
        description="Optional what-if scenario parameter overrides"
    )


class ForecastTrackPoint(BaseModel):
    """Individual predicted waypoint from TrackLSTM."""

    lead_hours: int = Field(description="Forecast lead time in hours (3, 6, ..., 48)")
    lat: float = Field(description="Predicted latitude")
    lon: float = Field(description="Predicted longitude")
    wind_kmph: float = Field(description="Predicted sustained surface wind in km/h")
    pressure_hpa: float = Field(description="Predicted central pressure in hPa")


class ForecastTrackResponse(BaseModel):
    """TrackLSTM trajectory and intensity prediction with validation metrics."""

    cyclone_id: str
    model_forecast: List[ForecastTrackPoint]
    imd_official_forecast: List[Dict[str, Any]]
    rmse_24h_km: float = Field(default=85.6)
    rmse_48h_km: float = Field(default=155.6)
    wind_mae_kmph: float = Field(default=7.3)
    pressure_mae_hpa: float = Field(default=2.9)
    model_version: str = Field(default="track_lstm_v1")
    training_samples: int = Field(default=8484)
    model_params: int = Field(default=119872)


class SynthesizeRequest(BaseModel):
    """Payload to synthesize advisory text into speech."""

    text: str
    language: str = "en"


class SynthesizeResponse(BaseModel):
    """Response payload containing base64 audio and synthesis metadata."""

    audio_base64: Optional[str] = None
    duration_seconds: float = 0.0
    voice_used: Optional[str] = None
    language: str = "en"
    error: Optional[str] = None


class RainfallForecast(BaseModel):
    """24h, 48h, and 72h accumulated rainfall forecast and categorical risk classification."""

    district_id: str
    forecast_24h_mm: float
    forecast_48h_mm: float
    forecast_72h_mm: float
    risk_level: str


class SurgeSimulationRequest(BaseModel):
    """Payload to simulate storm surge inundation for a district during a cyclone event."""

    cyclone_id: str = Field(default="BOB-02-2019", description="Cyclone ID (e.g. 'BOB-02-2019', 'fani')")
    district_id: str = Field(default="Puri", description="District ID or Name (e.g. 'OD-PUR', 'Puri')")
    scenario: Optional[ScenarioOverride] = Field(default=None, description="Optional what-if scenario parameter overrides")


class SurgeSimulation(BaseModel):
    """Storm surge hydrodynamic inundation simulation output and exposed assets."""

    cyclone_id: str
    district_id: str
    max_surge_m: float
    inundation_polygon: dict
    inundation_area_km2: float
    affected_population: int
    affected_assets: dict


class HazardSummary(BaseModel):
    """Combined hazard assessment uniting rainfall, storm surge, and storm track intensity."""

    district_id: str
    rainfall: RainfallForecast
    surge: Optional[SurgeSimulation] = None
    overall_risk: str


class DataSourceInfo(BaseModel):
    """Metadata and operational status for an external data source."""

    source_id: str
    name: str
    provider: str
    endpoint: str
    status: str = Field(description="'operational', 'degraded', 'cached', or 'simulated'")
    last_fetch: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class DataGovStats(BaseModel):
    """Socio-economic indicators from data.gov.in Open Data (CKAN)."""

    state: str
    district: Optional[str] = None
    population: Optional[int] = None
    literacy_rate: Optional[float] = None
    hospital_beds: Optional[int] = None
    road_density_km_per_100sqkm: Optional[float] = None
    poverty_rate: Optional[float] = None
    pucca_house_percent: Optional[float] = None
    source: str = "data.gov.in Open Data (CKAN)"
    is_cached: bool = False
    timestamp: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None


class BhuvanLayer(BaseModel):
    """ISRO Bhuvan WMS geolayer metadata and tile template URL."""

    layer_id: str
    title: str
    abstract: Optional[str] = None
    bounds: List[float] = Field(description="[min_lon, min_lat, max_lon, max_lat]")
    crs: str = "EPSG:4326"
    tile_url_template: str
    source: str = "ISRO Bhuvan WMS"


class OSMFeature(BaseModel):
    """OpenStreetMap infrastructure feature extracted from Overpass API."""

    feature_type: str = Field(description="'road', 'hospital', or 'shelter'")
    osm_id: Union[int, str]
    name: Optional[str] = None
    coordinates: Any
    geometry_type: str = "Point"
    tags: Dict[str, Any] = Field(default_factory=dict)


class FAOWHOIndicators(BaseModel):
    """FAO food security and WHO public health vulnerability metrics."""

    state: str
    food_insecurity_percent: float
    undernourishment_percent: float
    stunting_percent: Optional[float] = None
    infant_mortality_per_1000: float
    healthcare_access_index: float
    disease_prevalence: Dict[str, Any] = Field(default_factory=dict)
    source: str = "FAO / WHO Reports & NFHS-5"
    timestamp: Optional[str] = None


class HistoricalAnalyticsResponse(BaseModel):
    """Aggregate multi-hazard and vulnerability statistics per coastal state."""

    state: str
    total_districts: int
    total_population: int
    avg_vulnerability_score: float
    total_shelters: int
    historical_cyclones: List[str]
    avg_storm_surge_m: float


class AuthVerifyRequest(BaseModel):
    """Firebase Auth ID token verification request."""

    id_token: str


class AuthVerifyResponse(BaseModel):
    """Firebase Auth verification response."""

    uid: str
    email: Optional[str] = None
    valid: bool


class CitizenReportRequest(BaseModel):
    """Citizen damage field report submission with base64 photo and geolocation."""

    description: str
    latitude: float
    longitude: float
    image_base64: str  # base64-encoded image
    state: str
    district: str


class CitizenReportResponse(BaseModel):
    """Processed citizen report with multimodal Gemini damage classification and verification status."""

    report_id: Optional[str] = None
    status: str = "VALID"  # VALID | INVALID_IMAGE
    damage_severity: Optional[str] = None  # LOW, MEDIUM, HIGH, CRITICAL
    ai_analysis: Optional[str] = None
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[str] = None


class AlertSubscribeRequest(BaseModel):
    """FCM device token subscription request."""

    fcm_token: str
    state: str


class AlertSubscribeResponse(BaseModel):
    """FCM device token subscription response."""

    subscription_id: str
    status: str


class FCMNotificationRequest(BaseModel):
    """Broadcast notification payload for state subscribers."""

    title: str
    body: str
    state: str


class InsuranceTriggerResult(BaseModel):
    """Parametric insurance contract trigger evaluation result."""

    contract_id: str
    state: str
    districts: List[str]
    trigger_met: bool
    current_value: float
    threshold: float
    payout_estimate_inr: float
    households_affected: int
    status: str


class InsuranceEvaluateRequest(BaseModel):
    """Payload to trigger parametric insurance evaluation."""

    cyclone_id: str = "BOB-02-2019"
    scenario: Optional[ScenarioOverride] = None


class UncertaintyAssessment(BaseModel):
    positional_rmse_km: float
    model_agreement_km: Optional[float] = None
    trigger_confidence: str
    trigger_buffer_pct: float
    justification: str


class InsuranceEvaluateResponse(BaseModel):
    """Aggregate parametric insurance trigger and payout liquidity evaluation."""

    total_contracts: int
    triggers_active: int
    total_payout_inr: float
    total_households: int
    uncertainty_assessment: Optional[UncertaintyAssessment] = None
    evaluation_id: Optional[str] = Field(default=None, description="Unique identifier for the evaluation session")
    results: List[InsuranceTriggerResult] = Field(default_factory=list, description="Contract evaluation outcomes")
    approval_state: ApprovalState = Field(default=ApprovalState.DRAFT, description="Human-in-the-loop approval state")
    approved_by: Optional[str] = Field(default=None, description="Officer / Dispatcher identifier who approved")
    approved_at: Optional[datetime] = Field(default=None, description="Timestamp of liquidity approval")
    rejection_reason: Optional[str] = Field(default=None, description="Reason if rejected")


class ChatMessage(BaseModel):
    """User message payload for Dialogflow / conversational agent."""

    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    """Assistant reply from conversational agent."""

    reply: str
    intent: str
    session_id: str


class ExposureReasoningRequest(BaseModel):
    """Request payload for Gemini multimodal exposure reasoning."""

    district_name: str
    cyclone_id: str
    scenario: Optional[ScenarioOverride] = None


class ExposureReasoningResponse(BaseModel):
    """Response payload containing narrative exposure analysis and critical assets."""

    district_name: str
    narrative: str
    critical_assets: List[Dict[str, Any]]
    recommended_actions: List[str]
    confidence: str
    reasoning_source: str = "gemini-3.7-flash-multimodal"


class GeminiForecastRequest(BaseModel):
    """Request payload for in-context Gemini cyclone forecasting."""

    cyclone_id: str
    recent_point_count: int = 4  # how many recent points to send to Gemini
    end_index: Optional[int] = None  # which point is the "current" observation
    recent_point_indices: Optional[List[int]] = None
    scenario: Optional[ScenarioOverride] = None


class GeminiForecastPoint(BaseModel):
    """Single predicted trajectory point from Gemini."""

    lead_hours: int
    lat: float
    lon: float
    wind_kmph: float
    pressure_hpa: float


class GeminiForecastResponse(BaseModel):
    """Response payload containing Gemini in-context trajectory forecast and reasoning."""

    cyclone_id: str
    model: str
    forecast: List[GeminiForecastPoint]
    reasoning: str
    confidence: str
    method: str
    error: Optional[str] = None


class RainfallDamageRequest(BaseModel):
    """Request payload for terrain-aware rainfall damage pathway."""

    district_name: str
    cyclone_id: Optional[str] = None
    scenario: Optional[ScenarioOverride] = None


class DamagePathway(BaseModel):
    """Specific hazard pathway (flash flood or landslide) resulting from rainfall."""

    hazard_type: str
    risk_level: str
    trigger_rainfall_mm: Optional[float] = None
    current_rainfall_mm: Optional[float] = None
    runoff_potential: Optional[float] = None
    susceptibility_index: Optional[float] = None
    slope_deg: Optional[float] = None
    cumulative_rainfall_72h_mm: Optional[float] = None


class RainfallDamageResponse(BaseModel):
    """Terrain-aware rainfall damage assessment response."""

    district: str
    terrain_type: str
    elevation_m: float
    primary_hazard: str
    pathways: List[DamagePathway]
    data_sources: List[str] = Field(
        default_factory=lambda: ["IMD rainfall forecast", "30m DEM", "GSI slope data"]
    )


class TriageAsset(BaseModel):
    """Prioritized infrastructure asset assessed for pre-landfall operational action."""

    asset_id: str
    name: str
    type: str
    district: Optional[str] = None
    state: Optional[str] = None
    triage_score: float
    distance_to_forecast_km: float
    reason: str


class TriageRequest(BaseModel):
    """Request payload to rank critical infrastructure for a cyclone."""

    cyclone_id: str
    top_n: int = 10
    scenario: Optional[ScenarioOverride] = None


class TriageResponse(BaseModel):
    """Ranked infrastructure triage recommendations."""

    cyclone_id: str
    total_assets_evaluated: int
    top_priority_assets: List[TriageAsset]


class AssetStatusUpdate(BaseModel):
    """Payload to update an infrastructure asset's runtime operational status."""

    asset_id: str
    status: str  # OPERATIONAL | OFFLINE | DAMAGED | FULL | EVACUATING
    reason: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None  # e.g., {"beds_available": 45, "generator": "offline"}


class AssetStatusResponse(BaseModel):
    """Response containing current asset operational status and historical audits."""

    asset_id: str
    current_status: str
    status: Optional[str] = None
    reason: Optional[str] = None
    updated_by: Optional[str] = None
    updated_at: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    history: List[Dict[str, Any]] = []





