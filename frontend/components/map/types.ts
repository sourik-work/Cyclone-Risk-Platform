/**
 * Type definitions for Cyclone Platform map visualization and dashboard.
 */

export type CycloneCategory =
  | 'Low Pressure Area'
  | 'Depression'
  | 'Deep Depression'
  | 'Cyclonic Storm'
  | 'Severe Cyclonic Storm'
  | 'Very Severe Cyclonic Storm'
  | 'Extremely Severe Cyclonic Storm'
  | 'Super Cyclonic Storm'
  | 'Well Marked Low';

export interface TrackPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  wind_speed_knots: number;
  wind_speed_kmph?: number;
  gust_speed_kmph?: number;
  central_pressure_hpa: number;
  category: CycloneCategory;
  is_forecast: boolean;
  forecast_lead_hours?: number;
  cone_radius_km?: number;
  heading_degrees?: number;
  forward_speed_kmph?: number;
}

export interface CycloneTrack {
  id: string;
  name: string;
  season_year: number;
  basin: string;
  current_status: string;
  genesis_time: string;
  dissipation_time?: string;
  track_points: TrackPoint[];
}

export interface DistrictProperties {
  district_id: string;
  district_name: string;
  state_name: string;
  total_population: number;
  vulnerable_population: number;
  coastal_length_km: number;
  average_elevation_m: number;
  cyclone_risk_score: number;
  storm_surge_risk_m: number;
  shelter_capacity: number;
  shelter_count: number;
  hospital_count: number;
  primary_language: 'Odia' | 'Bengali' | 'Telugu' | 'Tamil' | 'Hindi';
  secondary_language?: string;
  population?: number;
  kutcha_population?: number;
  coastline_km?: number;
  elevation_m?: number;
  vulnerability_score?: number;
  inundation_risk?: number;
  evac_shelters?: number;
}

export interface DistrictFeature {
  type: 'Feature';
  properties: DistrictProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface VulnerabilityFeatureCollection {
  type: 'FeatureCollection';
  name?: string;
  features: DistrictFeature[];
}

export interface MapLayerToggles {
  showTrack: boolean;
  showForecastCone: boolean;
  showVulnerability: boolean;
  showWindRadii: boolean;
  showShelters: boolean;
  showEarthEngine?: boolean;
  showAiForecast?: boolean;
  showPowerGrid?: boolean;
  showRoads?: boolean;
  showHospitals?: boolean;
  showRainfall?: boolean;
  showSurge?: boolean;
}

export interface InfrastructureProperties {
  asset_id?: string;
  facility_id?: string;
  road_id?: string;
  name: string;
  asset_type?: 'SUBSTATION' | 'TRANSMISSION_LINE' | 'ARTERIAL_ROAD' | string;
  facility_type?: 'DISTRICT_HOSPITAL' | 'MEDICAL_COLLEGE' | 'PHC' | 'CYCLONE_SHELTER' | string;
  road_class?: 'NH' | 'SH' | 'MDR' | string;
  state: string;
  district?: string;
  districts_served?: string[];
  voltage_kv?: number;
  capacity_mva?: number;
  operator?: string;
  latitude?: number;
  longitude?: number;
  bed_capacity?: number | null;
  shelter_capacity?: number | null;
  has_generator?: boolean;
  elevation_m?: number;
  distance_from_coast_km?: number;
  length_km?: number;
  criticality?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  is_at_risk?: boolean;
}

export interface InfrastructureFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: any;
  };
  properties: InfrastructureProperties;
}

export interface InfrastructureFeatureCollection {
  type: 'FeatureCollection';
  name?: string;
  features: InfrastructureFeature[];
}

export interface ForecastTrackPoint {
  lead_hours: number;
  lat: number;
  lon: number;
  wind_kmph: number;
  pressure_hpa: number;
}

export interface ForecastTrackResponse {
  cyclone_id: string;
  model_forecast: ForecastTrackPoint[];
  imd_official_forecast: Array<{
    lead_hours: number;
    lat: number;
    lon: number;
    wind_kmph: number;
    pressure_hpa: number;
    category?: string;
    is_forecast?: boolean;
    timestamp?: string;
  }>;
  rmse_24h_km: number;
  rmse_48h_km: number;
  wind_mae_kmph: number;
  pressure_mae_hpa: number;
  model_version: string;
  training_samples: number;
  model_params: number;
}

export type SupportedLanguage =
  | 'english'
  | 'odia'
  | 'bengali'
  | 'telugu'
  | 'tamil'
  | 'hindi'
  | 'en'
  | 'or'
  | 'bn'
  | 'te'
  | 'ta'
  | 'hi';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'english', name: 'English', nativeName: 'English' },
  { code: 'odia', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
];

export interface MultilingualAdvisories {
  english: string;
  odia: string;
  bengali: string;
  telugu: string;
  tamil: string;
  hindi: string;
}

export interface ActionItem {
  category: string;
  action: string;
  urgency: string;
  target_audience: string;
}

export type ApprovalState = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DISPATCHED';

export interface AnticipatoryAdvisory {
  advisory_id: string;
  cyclone_id: string;
  issued_at: string;
  severity_level: 'WATCH' | 'ALERT' | 'WARNING' | 'EMERGENCY_ACTION' | 'MONITORING' | string;
  approval_state?: ApprovalState;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  lead_time_hours?: number | null;
  estimated_landfall_time?: string | null;
  estimated_landfall_location?: string | null;
  max_expected_wind_kmph?: number | null;
  max_expected_surge_m?: number | null;
  target_districts: any[];
  headline: string;
  multilingual_advisories: MultilingualAdvisories;
  recommended_actions: ActionItem[];
  model?: string;
}

export const getAdvisoryTextForLanguage = (
  advisories?: MultilingualAdvisories | null,
  lang: SupportedLanguage | string = 'english'
): string => {
  if (!advisories) return '';

  const normalizedKey: keyof MultilingualAdvisories = (() => {
    switch (lang.toLowerCase()) {
      case 'or':
      case 'odia':
        return 'odia';
      case 'bn':
      case 'bengali':
        return 'bengali';
      case 'te':
      case 'telugu':
        return 'telugu';
      case 'ta':
      case 'tamil':
        return 'tamil';
      case 'hi':
      case 'hindi':
        return 'hindi';
      case 'en':
      case 'english':
      default:
        return 'english';
    }
  })();

  // Direct lookup on advisory.multilingual_advisories[language]
  return advisories[normalizedKey] || advisories.english || '';
};

export interface LiveCycloneResponse {
  active_cyclone: CycloneTrack | null;
  last_updated: string;
  source: string;
  status: 'active' | 'monitoring';
  message: string;
}

export interface RainfallForecast {
  district_id: string;
  forecast_24h_mm: number;
  forecast_48h_mm: number;
  forecast_72h_mm: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
}

export interface SurgeSimulation {
  cyclone_id: string;
  district_id: string;
  max_surge_m: number;
  inundation_polygon: {
    type: string;
    geometry?: {
      type: string;
      coordinates: number[][][];
    };
    coordinates?: number[][][];
    properties?: Record<string, any>;
  };
  inundation_area_km2: number;
  affected_population: number;
  affected_assets: {
    hospitals_at_risk?: number;
    shelters_activated?: number;
    power_substations_at_risk?: number;
    roads_submerged_km?: number;
    [key: string]: any;
  };
}

export interface HazardSummary {
  district_id: string;
  rainfall: RainfallForecast;
  surge?: SurgeSimulation | null;
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
}


