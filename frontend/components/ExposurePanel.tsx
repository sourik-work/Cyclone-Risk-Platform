'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Radar, Building, Activity, Info } from 'lucide-react';

export interface CriticalAssetExposure {
  name: string;
  reason: string;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  within_cone?: boolean;
}

export interface ExposurePanelProps {
  district?: string;
  exposureLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  reasoning?: string;
  withinCone?: boolean;
  coneRadius24hKm?: number;
  coneRadius48hKm?: number;
  criticalAssets?: CriticalAssetExposure[];
  recommendedActions?: string[];
  className?: string;
}

export const ExposurePanel: React.FC<ExposurePanelProps> = ({
  district = 'Puri',
  exposureLevel = 'HIGH',
  confidence = 'MEDIUM',
  reasoning = 'Probabilistic spatial reasoning under forecast uncertainty.',
  withinCone = true,
  coneRadius24hKm = 155.8,
  coneRadius48hKm = 288.3,
  criticalAssets = [],
  recommendedActions = [],
  className = '',
}) => {
  return (
    <div
      id="gemini-exposure-panel"
      className={`bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs text-slate-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-slate-200 uppercase tracking-wider">
            Gemini Multimodal Exposure Reasoning
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              exposureLevel === 'HIGH'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {exposureLevel} EXPOSURE
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              confidence === 'HIGH'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            CONFIDENCE: {confidence}
          </span>
        </div>
      </div>

      {/* Uncertainty Cone Banner */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            95% Positional Uncertainty Cone (LOSO):
          </span>
          <span className="text-cyan-300 font-bold">
            ±{coneRadius24hKm} km @ 24h · ±{coneRadius48hKm} km @ 48h
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
          <span>Target District ({district}):</span>
          <span className={`font-semibold ${withinCone ? 'text-amber-400' : 'text-slate-300'}`}>
            {withinCone ? '⚠️ Within Cone of Uncertainty' : 'Outside Primary Cone (<50 km perimeter)'}
          </span>
        </div>
      </div>

      {/* Narrative */}
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-3 text-[11px] font-sans text-slate-300 leading-relaxed italic">
        &ldquo;{reasoning}&rdquo;
      </div>

      {/* Critical Assets List */}
      {criticalAssets.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Critical Assets at Risk ({criticalAssets.length})
          </div>
          <div className="space-y-1.5">
            {criticalAssets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded p-2 text-[11px] flex items-start justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{asset.name}</span>
                  </div>
                  <div className="text-[10px] font-sans text-slate-400 mt-0.5 leading-snug">
                    {asset.reason}
                  </div>
                </div>
                {asset.within_cone && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                    IN CONE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Anticipatory Actions (12h Pre-Landfall)
          </div>
          <ul className="space-y-1 text-[11px] font-sans text-slate-300">
            {recommendedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold font-mono">›</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExposurePanel;
