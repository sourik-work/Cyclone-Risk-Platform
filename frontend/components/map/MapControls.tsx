'use client';

import React, { useState } from 'react';
import { MapLayerToggles } from './types';
import { Building2, Compass, Cpu, Layers, Route, Satellite, ShieldAlert, Sparkles, Zap, type LucideIcon } from 'lucide-react';

interface MapControlsProps {
  selectedStormId: string;
  onSelectStorm: (stormId: string) => void;
  mode?: 'historical' | 'live';
  liveStormName?: string;
  hasActiveCyclone?: boolean;
}

interface MapLayerMenuProps {
  layerToggles: MapLayerToggles;
  onToggleLayer: (layerKey: keyof MapLayerToggles) => void;
  mode: 'historical' | 'live';
  hasActiveCyclone: boolean;
  trackPointCount?: number;
  isAmphan: boolean;
  amphanTileUrl: string | null;
}

const LAYER_OPTIONS: Array<{ key: keyof MapLayerToggles; label: string; Icon: LucideIcon }> = [
  { key: 'showTrack', label: 'Track Line', Icon: Compass },
  { key: 'showAiForecast', label: 'AI Forecast', Icon: Cpu },
  { key: 'showForecastCone', label: 'Forecast Cone', Icon: Sparkles },
  { key: 'showVulnerability', label: 'Vulnerability Grid', Icon: ShieldAlert },
  { key: 'showPowerGrid', label: 'Power Grid', Icon: Zap },
  { key: 'showRoads', label: 'Roads', Icon: Route },
  { key: 'showHospitals', label: 'Hospitals', Icon: Building2 },
  { key: 'showEarthEngine', label: 'Earth Engine', Icon: Satellite },
];

export const MapControls: React.FC<MapControlsProps> = ({
  selectedStormId,
  onSelectStorm,
  mode = 'historical',
  liveStormName,
  hasActiveCyclone = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 card-glass p-3">
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
              className={`dashboard-control rounded-lg font-medium transition-colors ${
                selectedStormId === 'fani'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Fani (2019 - Puri)
            </button>
            <button
              onClick={() => onSelectStorm('amphan')}
              className={`dashboard-control rounded-lg font-medium transition-colors ${
                selectedStormId === 'amphan'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Amphan (2020 - Bay of Bengal)
            </button>
            <button
              id="btn-storm-sidr"
              onClick={() => onSelectStorm('sidr')}
              className={`dashboard-control rounded-lg font-medium transition-colors ${
                selectedStormId === 'sidr'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Cyclone Sidr 2007 (Bangladesh)
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export const MapLayerMenu: React.FC<MapLayerMenuProps> = ({
  layerToggles,
  onToggleLayer,
  mode,
  hasActiveCyclone,
  trackPointCount,
  isAmphan,
  amphanTileUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLiveMonitoring = mode === 'live' && !hasActiveCyclone;
  const hasInsufficientHistory = trackPointCount !== undefined && trackPointCount < 4;
  const activeCount = LAYER_OPTIONS.filter(({ key }) => layerToggles[key]).length;
  const isDisabled = (key: keyof MapLayerToggles) => {
    if (key === 'showTrack' || key === 'showForecastCone') return isLiveMonitoring;
    if (key === 'showAiForecast') return isLiveMonitoring || hasInsufficientHistory;
    if (key === 'showEarthEngine') return isLiveMonitoring || (isAmphan && !amphanTileUrl);
    return false;
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Map layers, ${activeCount} active`}
        aria-expanded={isOpen}
        aria-controls="map-layer-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="dashboard-control flex items-center gap-2 rounded-md border border-slate-700/80 bg-slate-950/95 text-slate-300 shadow-lg backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-slate-100"
      >
        <Layers className="h-4 w-4" aria-hidden="true" />
        <span>Layers</span>
        {activeCount > 0 && (
          <span className="min-w-5 rounded bg-slate-800 px-1 text-center text-[10px] text-slate-300">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="map-layer-menu"
          role="group"
          aria-label="Map layers"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-700/90 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Map layers
          </div>
          <div className="flex flex-col gap-1">
            {LAYER_OPTIONS.map(({ key, label, Icon }) => {
              const disabled = isDisabled(key);
              const active = Boolean(layerToggles[key]);
              const title =
                key === 'showAiForecast' && hasInsufficientHistory
                  ? `AI Forecast requires 4+ observed points. Current track has ${trackPointCount}.`
                  : key === 'showEarthEngine' && isAmphan && !amphanTileUrl
                    ? 'Sentinel-1 tiles are available for Fani; Amphan generation is pending.'
                    : disabled
                      ? 'Unavailable while monitoring for an active cyclone.'
                      : `Toggle ${label}`;

              return (
                <button
                  key={key}
                  type="button"
                  id={`toggle-layer-${key}`}
                  aria-pressed={active}
                  disabled={disabled}
                  title={title}
                  onClick={() => onToggleLayer(key)}
                  className={`dashboard-control flex items-center justify-between rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    active
                      ? 'border-blue-500/35 bg-blue-500/15 text-blue-200'
                      : 'border-slate-700/50 bg-slate-900/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-cyan-300' : 'bg-slate-700'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
