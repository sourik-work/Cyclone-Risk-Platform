'use client';

import React from 'react';
import { MapLayerToggles } from './types';
import { Compass, ShieldAlert, Sparkles, Satellite } from 'lucide-react';

interface MapControlsProps {
  layerToggles: MapLayerToggles;
  onToggleLayer: (layerKey: keyof MapLayerToggles) => void;
  selectedStormId: string;
  onSelectStorm: (stormId: string) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layerToggles,
  onToggleLayer,
  selectedStormId,
  onSelectStorm,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl">
      {/* Storm Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active System:</span>
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
      </div>

      {/* Layer Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onToggleLayer('showTrack')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            layerToggles.showTrack
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Track Line
        </button>

        <button
          onClick={() => onToggleLayer('showForecastCone')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            layerToggles.showForecastCone
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Forecast Cone
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
          Odisha Vulnerability
        </button>

        <button
          onClick={() => onToggleLayer('showEarthEngine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            layerToggles.showEarthEngine
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          Earth Engine
        </button>
      </div>
    </div>
  );
};
