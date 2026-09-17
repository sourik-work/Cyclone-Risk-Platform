'use client';

import React from 'react';
import {
  AnticipatoryAdvisory,
  CycloneTrack,
  DistrictProperties,
  getAdvisoryTextForLanguage,
  MultilingualAdvisories,
  SupportedLanguage,
  TrackPoint,
} from '../map/types';
import {
  FALLBACK_ADVISORY,
  SEED_MULTILINGUAL_ADVISORIES,
  SEED_ALL_COASTAL_VULNERABILITY,
} from '../../lib/seedData';
import {
  Wind,
  Gauge,
  Compass,
  Navigation,
  Shield,
  AlertTriangle,
  Users,
  Waves,
  Sparkles,
  Loader2,
  Cpu,
  MapPin,
} from 'lucide-react';

interface TelemetrySidebarProps {
  track: CycloneTrack;
  activePointIndex: number;
  selectedDistrict: DistrictProperties | null;
  currentLanguage: SupportedLanguage;
  advisory?: AnticipatoryAdvisory | null;
  isLoadingAdvisory?: boolean;
  selectedState?: string;
  onSelectState?: (state: string) => void;
  allDistricts?: DistrictProperties[];
  onSelectDistrict?: (district: DistrictProperties) => void;
}

const formatCount = (val: number): string => {
  return new Intl.NumberFormat('en-US').format(val);
};

const COASTAL_STATES = ['Odisha', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu'];

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  track,
  activePointIndex,
  selectedDistrict,
  currentLanguage,
  advisory,
  isLoadingAdvisory = false,
  selectedState = 'Odisha',
  onSelectState,
  allDistricts,
  onSelectDistrict,
}) => {
  const currentPoint: TrackPoint = track.track_points[activePointIndex] || track.track_points[0];
  const effectiveAdvisory = advisory || FALLBACK_ADVISORY;

  // Active state determination
  const activeState = selectedState || selectedDistrict?.state_name || 'Odisha';

  // All coastal districts across India
  const districts =
    allDistricts && allDistricts.length > 0
      ? allDistricts
      : SEED_ALL_COASTAL_VULNERABILITY.features.map((f) => f.properties);

  // Filter districts by active state
  const stateDistricts = districts.filter(
    (d) => d.state_name.toLowerCase() === activeState.toLowerCase()
  );

  const handleStateClick = (state: string) => {
    if (onSelectState) {
      onSelectState(state);
    }
    // Auto-select first district in that state if current selection belongs to a different state
    const targetDistricts = districts.filter(
      (d) => d.state_name.toLowerCase() === state.toLowerCase()
    );
    if (targetDistricts.length > 0 && onSelectDistrict) {
      onSelectDistrict(targetDistricts[0]);
    }
  };

  // Language mapping: strictly accesses the NEW nested structure advisory.multilingual_advisories[language]
  const langKey = (() => {
    const raw = (currentLanguage || 'english').toLowerCase();
    const map: Record<string, keyof MultilingualAdvisories> = {
      odia: 'odia',
      or: 'odia',
      bengali: 'bengali',
      bn: 'bengali',
      telugu: 'telugu',
      te: 'telugu',
      tamil: 'tamil',
      ta: 'tamil',
      hindi: 'hindi',
      hi: 'hindi',
      english: 'english',
      en: 'english',
    };
    return map[raw] || 'english';
  })();

  const nestedAdvisories = effectiveAdvisory.multilingual_advisories;
  const emergencyMessages = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.message as Record<string, string>;
  const emergencyHeadlines = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.headline as Record<string, string>;
  const emergencyActions = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.action as Record<string, string>;

  // Picks text from the NEW nested structure: advisory.multilingual_advisories[language]
  const message =
    (nestedAdvisories && nestedAdvisories[langKey as keyof MultilingualAdvisories]) ||
    getAdvisoryTextForLanguage(nestedAdvisories, currentLanguage) ||
    nestedAdvisories?.english ||
    emergencyMessages[langKey] ||
    emergencyMessages.english;

  const headline =
    emergencyHeadlines[langKey] ||
    effectiveAdvisory.headline ||
    'ANTICIPATORY ACTION ADVISORY';

  const actions = effectiveAdvisory.recommended_actions || [];

  const windKmph =
    currentPoint.wind_speed_kmph || Math.round(currentPoint.wind_speed_knots * 1.852);
  const gustKmph =
    currentPoint.gust_speed_kmph || Math.round(windKmph * 1.25);

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-1 select-none">
      {/* 1. Storm Telemetry Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              STORM TELEMETRY • {track.basin}
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>CYCLONE {track.name.toUpperCase()}</span>
              <span className="text-xs font-mono font-normal text-slate-400">({track.id})</span>
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            {currentPoint.category}
          </span>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sustained Wind</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {windKmph}{' '}
              <span className="text-[11px] font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Gusts to {gustKmph} km/h ({currentPoint.wind_speed_knots} kts)
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span>Central Pressure</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {currentPoint.central_pressure_hpa}{' '}
              <span className="text-[11px] font-normal text-slate-400">hPa</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentPoint.central_pressure_hpa < 950 ? 'Extremely Intense' : 'Standard Depression'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Position (Lat/Lon)</span>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-200">
              {currentPoint.latitude.toFixed(2)}°N, {currentPoint.longitude.toFixed(2)}°E
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentPoint.is_forecast ? `Lead: +${currentPoint.forecast_lead_hours}h` : 'Observed RSMC'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Movement</span>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-200">
              {currentPoint.forward_speed_kmph || 18} km/h @ {currentPoint.heading_degrees || 35}°
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Bearing: North-Northeast</div>
          </div>
        </div>
      </div>

      {/* 2. Coastal District Vulnerability Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              COASTAL IMPACT ASSESSMENT
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeState.toUpperCase()} RISK GRID
          </span>
        </div>

        {/* State Selector: 4 Coastal States Dropdown */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <label htmlFor="state-selector-dropdown" className="flex items-center gap-1.5 cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Coastal State:</span>
            </label>
            <span className="text-cyan-400 font-bold font-mono">{activeState}</span>
          </div>
          <div className="relative">
            <select
              id="state-selector-dropdown"
              name="state-selector-dropdown"
              value={activeState}
              onChange={(e) => handleStateClick(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-medium text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer shadow-inner"
            >
              {COASTAL_STATES.map((state) => (
                <option key={state} value={state} className="bg-slate-900 text-slate-100 py-1">
                  {state}
                </option>
              ))}
            </select>
          </div>
          {/* Quick-switch state buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {COASTAL_STATES.map((state) => {
              const isSelected = activeState.toLowerCase() === state.toLowerCase();
              return (
                <button
                  key={state}
                  id={`btn-state-${state.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleStateClick(state)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center truncate cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-[1.02]'
                      : 'text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800'
                  }`}
                  title={`Switch to ${state} coastal districts`}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtered District Selector List */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{activeState} Districts:</span>
            <span className="text-slate-500">{stateDistricts.length} active</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {stateDistricts.map((d) => {
              const isSelected =
                selectedDistrict?.district_name.toLowerCase() === d.district_name.toLowerCase();
              const score = (d.cyclone_risk_score ?? d.vulnerability_score ?? 0.75) * 100;
              return (
                <button
                  key={d.district_id || d.district_name}
                  id={`btn-district-${d.district_name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onSelectDistrict && onSelectDistrict(d)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-400/40'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{d.district_name}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      score >= 80
                        ? 'bg-red-500/20 text-red-300'
                        : score >= 70
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {score.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected District Deep-Dive Details */}
        {selectedDistrict ? (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-100">{selectedDistrict.district_name}</h4>
                <p className="text-[11px] text-slate-400">
                  {selectedDistrict.state_name} • Coastline: {selectedDistrict.coastal_length_km ?? selectedDistrict.coastline_km} km
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400">Risk Score</span>
                <div className="text-sm font-bold font-mono text-red-400">
                  {((selectedDistrict.cyclone_risk_score ?? selectedDistrict.vulnerability_score ?? 0.75) * 100).toFixed(0)}% CRITICAL
                </div>
              </div>
            </div>

            {/* Risk Bar Meter */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(selectedDistrict.cyclone_risk_score ?? selectedDistrict.vulnerability_score ?? 0.75) * 100}%`,
                }}
              />
            </div>

            {/* District Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <Waves className="w-3 h-3 text-cyan-400" /> Storm Surge
                </div>
                <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                  {selectedDistrict.storm_surge_risk_m ?? selectedDistrict.inundation_risk ?? 4.0} meters
                </div>
                <div className="text-[10px] text-slate-500">Inundation Threat</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Kutcha Population
                </div>
                <div suppressHydrationWarning className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                  {formatCount(selectedDistrict.vulnerable_population ?? selectedDistrict.kutcha_population ?? 0)}
                </div>
                <div className="text-[10px] text-slate-500">Require Evacuation</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg col-span-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Shelter Capacity vs Need
                  </span>
                  <span suppressHydrationWarning className="text-[11px] font-mono text-red-400 font-semibold">
                    Deficit: -
                    {formatCount(
                      Math.max(
                        0,
                        (selectedDistrict.vulnerable_population ?? selectedDistrict.kutcha_population ?? 0) -
                          selectedDistrict.shelter_capacity
                      )
                    )}
                  </span>
                </div>
                <div suppressHydrationWarning className="text-xs font-mono text-slate-200 mt-1">
                  Cap: {formatCount(selectedDistrict.shelter_capacity)} in {selectedDistrict.shelter_count ?? selectedDistrict.evac_shelters} shelters
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-800 rounded-lg">
            Select any coastal district above or click on its map polygon to view exposure and evacuation deficits.
          </div>
        )}
      </div>

      {/* 3. Gemini Multilingual Anticipatory Action Early Warning */}
      <div className="bg-gradient-to-b from-red-950/40 to-slate-900/90 backdrop-blur-md border border-red-500/30 rounded-xl p-4 shadow-xl space-y-3 relative overflow-hidden transition-all duration-300">
        {/* Top subtle glow bar when loading */}
        {isLoadingAdvisory && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 animate-pulse" />
        )}

        {/* Header with Title, Powered by Badge, and Window Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-red-500/20 pb-2.5">
          <div className="flex items-center gap-2 text-red-400 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-300 truncate">
                  ANTICIPATORY ADVISORY
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Powered by Gemini 3.7 Flash
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-medium truncate">
                {effectiveAdvisory.severity_level?.replace(/_/g, ' ') || 'ALERT'}
                {effectiveAdvisory.target_districts?.length ? ` • ${effectiveAdvisory.target_districts.join(', ')}` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLoadingAdvisory && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Synthesizing...</span>
              </span>
            )}
            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-bold border border-red-500/30 whitespace-nowrap shadow-sm">
              T-{effectiveAdvisory.lead_time_hours ?? 18}h WINDOW
            </span>
          </div>
        </div>

        {/* Multilingual Headline */}
        <div className="text-xs font-bold text-red-300 leading-tight">
          {headline}
        </div>

        {/* Dynamic Storm Surge & Wind Impact Highlights */}
        {(effectiveAdvisory.max_expected_wind_kmph || effectiveAdvisory.max_expected_surge_m) && (
          <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
            {effectiveAdvisory.max_expected_wind_kmph && (
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                Peak Wind: <span className="text-amber-400 font-bold">{effectiveAdvisory.max_expected_wind_kmph} km/h</span>
              </span>
            )}
            {effectiveAdvisory.max_expected_surge_m && (
              <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                Max Surge: <span className="text-cyan-400 font-bold">+{effectiveAdvisory.max_expected_surge_m}m</span>
              </span>
            )}
          </div>
        )}

        {/* Multilingual Detailed Warning */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          {message}
        </p>

        {/* Recommended Immediate Actions */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            TRIGGER PROTOCOL:
          </div>
          {actions.length > 0 ? (
            <div className="space-y-1.5">
              {actions.map((act, idx) => (
                <div key={idx} className="text-xs text-slate-300 pl-2 border-l-2 border-amber-500/50">
                  <span className="text-[10px] font-mono font-bold text-amber-400 mr-1.5">[{act.category}]</span>
                  <span>{act.action}</span>
                  {act.target_audience && (
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      Target: {act.target_audience} ({act.urgency?.replace(/_/g, ' ')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-300 pl-2 border-l-2 border-amber-500/50">
              {emergencyActions[langKey] ||
                emergencyActions.english ||
                emergencyActions.en}
            </div>
          )}
        </div>
      </div>

      {/* 4. TrackLSTM Model Validation Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-yellow-400">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              MODEL VALIDATION
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 font-semibold">
            TrackLSTM v1
          </span>
        </div>

        {/* Training Badge */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[10px] font-mono leading-tight text-slate-300">
            Trained on IMD best-track data with synthetic augmentation
          </span>
        </div>

        {/* Validation Metric Grids */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Position RMSE @ 24h</div>
            <div className="text-sm font-bold text-yellow-400 mt-0.5">85.6 km</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Position RMSE @ 48h</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">155.6 km</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Wind Speed MAE</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">7.3 km/h</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Pressure MAE</div>
            <div className="text-sm font-bold text-indigo-400 mt-0.5">2.9 hPa</div>
          </div>
        </div>

        {/* Model Architecture & Training Metadata */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Model:</span>
            <span className="text-slate-200 font-semibold">LSTM 2-layer, 119,872 params</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Training samples:</span>
            <span className="text-slate-200 font-semibold">8,484</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
