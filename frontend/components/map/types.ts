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

export interface AnticipatoryAdvisory {
  advisory_id: string;
  cyclone_id: string;
  issued_at: string;
  severity_level: 'WATCH' | 'ALERT' | 'WARNING' | 'EMERGENCY_ACTION';
  lead_time_hours?: number;
  estimated_landfall_time?: string | null;
  estimated_landfall_location?: string | null;
  max_expected_wind_kmph?: number | null;
  max_expected_surge_m?: number | null;
  target_districts: string[];
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

