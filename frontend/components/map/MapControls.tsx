'use client';

import React from 'react';
import { MapLayerToggles } from './types';
import { Compass, ShieldAlert, Sparkles, Satellite, Cpu } from 'lucide-react';

interface MapControlsProps {
  layerToggles: MapLayerToggles;
  onToggleLayer: (layerKey: keyof MapLayerToggles) => void;
  selectedStormId: string;
  onSelectStorm: (stormId: string) => void;
  mode?: 'historical' | 'live';
  liveStormName?: string;
  hasActiveCyclone?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layerToggles,
  onToggleLayer,
  selectedStormId,
  onSelectStorm,
  mode = 'historical',
  liveStormName,
  hasActiveCyclone = false,
}) => {
  const isLiveMonitoring = mode === 'live' && !hasActiveCyclone;
  const isAmphan = mode === 'historical' && selectedStormId === 'amphan';
  const isEEDisabled = isLiveMonitoring || isAmphan;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 card-glass p-3">
      {/* Storm Selector / Live Status Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          {mode === 'live' ? 'Live Basin System:' : 'Historical System:'}
        </span>
        {mode === 'live' ? (
          <div className="flex items-center gap-2 bg-surface-2 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-300 mono-data">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{liveStormName || 'Bay of Bengal — Continuous Monitoring'}</span>
          </div>
        ) : (
          <div className="flex items-center bg-surface-2 border border-white/[0.06] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => onSelectStorm('fani')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedStormId === 'fani'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Fani (2019 - Puri)
            </button>
            <button
              onClick={() => onSelectStorm('amphan')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedStormId === 'amphan'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Amphan (2020 - Bay of Bengal)
            </button>
          </div>
        )}
      </div>

      {/* Layer Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggleLayer('showTrack')}
          disabled={isLiveMonitoring}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-surface-2/60 border-white/[0.04] text-text-tertiary cursor-not-allowed opacity-50'
              : layerToggles.showTrack
              ? 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title={isLiveMonitoring ? 'No active cyclone track in monitoring mode' : 'Toggle Track Line'}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Track Line</span>
        </button>

        {/* AI Forecast Toggle Button (LSTM Track Forecaster) */}
        <button
          id="toggle-layer-ai-forecast"
          onClick={() => onToggleLayer('showAiForecast')}
          disabled={isLiveMonitoring}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-surface-2/60 border-white/[0.04] text-text-tertiary cursor-not-allowed opacity-50'
              : layerToggles.showAiForecast
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 font-semibold shadow-sm'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title={isLiveMonitoring ? 'No forecast in monitoring mode' : 'Toggle AI LSTM Forecast Trajectory'}
        >
          <Cpu className="w-3.5 h-3.5 text-yellow-400" />
          <span>AI Forecast</span>
        </button>

        <button
          onClick={() => onToggleLayer('showForecastCone')}
          disabled={isLiveMonitoring}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-surface-2/60 border-white/[0.04] text-text-tertiary cursor-not-allowed opacity-50'
              : layerToggles.showForecastCone
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title={isLiveMonitoring ? 'No forecast cone in monitoring mode' : 'Toggle Forecast Cone'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Forecast Cone</span>
        </button>

        <button
          id="toggle-layer-vulnerability"
          onClick={() => onToggleLayer('showVulnerability')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            layerToggles.showVulnerability
              ? 'bg-red-500/15 border-red-500/30 text-red-400'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title="Toggle State Coastal District Vulnerability Polygon Overlay"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Vulnerability Grid</span>
        </button>

        {/* Task 5: 3 Infrastructure Exposure Layer Toggles */}
        <button
          id="toggle-power-grid"
          onClick={() => onToggleLayer('showPowerGrid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            layerToggles.showPowerGrid
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title="Toggle Power Grid (Substations & Transmission Lines)"
        >
          <span>⚡ Power Grid</span>
        </button>

        <button
          id="toggle-roads"
          onClick={() => onToggleLayer('showRoads')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            layerToggles.showRoads
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-sm'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title="Toggle Arterial Roads (NH/SH/MDR)"
        >
          <span>🛣 Roads</span>
        </button>

        <button
          id="toggle-hospitals"
          onClick={() => onToggleLayer('showHospitals')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            layerToggles.showHospitals
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title="Toggle Hospitals, PHCs & Cyclone Shelters"
        >
          <span>🏥 Hospitals</span>
        </button>

        {/* Earth Engine Satellite Overlay Toggle - Disabled in Live Monitoring & Amphan */}
        <button
          id="toggle-layer-earth-engine"
          onClick={() => onToggleLayer('showEarthEngine')}
          disabled={isEEDisabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isEEDisabled
              ? 'bg-surface-2/60 border-white/[0.04] text-text-tertiary cursor-not-allowed opacity-50'
              : layerToggles.showEarthEngine
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-surface-2 border-white/[0.06] text-text-tertiary hover:text-text-primary'
          }`}
          title={
            isLiveMonitoring
              ? 'Earth Engine flood SAR data disabled during live monitoring (calm basin)'
              : isAmphan
              ? 'Flood extent data available for Fani 2019 only — Amphan tile pending'
              : 'Toggle Earth Engine Satellite Overlay'
          }
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Earth Engine</span>
          {isLiveMonitoring && (
            <span className="text-[10px] font-mono text-slate-500">(Disabled)</span>
          )}
          {isAmphan && (
            <span className="text-[10px] font-mono text-amber-400 font-semibold">(Pending)</span>
          )}
        </button>

        {/* Small badge explaining pending flood data for Amphan */}
        {isAmphan && (
          <span
            id="amphan-ee-pending-badge"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Flood extent data available for Fani 2019 only — Amphan tile pending</span>
          </span>
        )}
      </div>
    </div>
  );
};
