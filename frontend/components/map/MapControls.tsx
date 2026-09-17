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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl">
      {/* Storm Selector / Live Status Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {mode === 'live' ? 'Live Basin System:' : 'Historical System:'}
        </span>
        {mode === 'live' ? (
          <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{liveStormName || 'Bay of Bengal — Continuous Monitoring'}</span>
          </div>
        ) : (
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSelectStorm('fani')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                selectedStormId === 'fani'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fani (2019 - Puri)
            </button>
            <button
              onClick={() => onSelectStorm('amphan')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                selectedStormId === 'amphan'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-slate-950/60 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
              : layerToggles.showTrack
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-slate-950/60 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
              : layerToggles.showAiForecast
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 font-semibold shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={isLiveMonitoring ? 'No forecast in monitoring mode' : 'Toggle AI LSTM Forecast Trajectory'}
        >
          <Cpu className="w-3.5 h-3.5 text-yellow-400" />
          <span>AI Forecast</span>
        </button>

        <button
          onClick={() => onToggleLayer('showForecastCone')}
          disabled={isLiveMonitoring}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-slate-950/60 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
              : layerToggles.showForecastCone
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={isLiveMonitoring ? 'No forecast cone in monitoring mode' : 'Toggle Forecast Cone'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Forecast Cone</span>
        </button>

        <button
          onClick={() => onToggleLayer('showVulnerability')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            layerToggles.showVulnerability
              ? 'bg-red-500/15 border-red-500/30 text-red-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Odisha Vulnerability</span>
        </button>

        {/* Earth Engine Satellite Overlay Toggle - Disabled in Live Monitoring */}
        <button
          id="toggle-layer-earth-engine"
          onClick={() => onToggleLayer('showEarthEngine')}
          disabled={isLiveMonitoring}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLiveMonitoring
              ? 'bg-slate-950/60 border-slate-800/60 text-slate-600 cursor-not-allowed opacity-50'
              : layerToggles.showEarthEngine
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={
            isLiveMonitoring
              ? 'Earth Engine flood SAR data disabled during live monitoring (calm basin)'
              : 'Toggle Earth Engine Satellite Overlay'
          }
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Earth Engine</span>
          {isLiveMonitoring && (
            <span className="text-[10px] font-mono text-slate-500">(Disabled)</span>
          )}
        </button>
      </div>
    </div>
  );
};
