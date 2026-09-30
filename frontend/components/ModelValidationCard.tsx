'use client';

import React from 'react';
import { Activity, Brain, ShieldAlert, Cpu, BarChart2, Info } from 'lucide-react';

interface MetricWithCI {
  mean: number;
  ci_95_lower: number;
  ci_95_upper: number;
}

interface ModelValidationCardProps {
  rmse24?: MetricWithCI;
  rmse48?: MetricWithCI;
  persistence24?: number;
  persistence48?: number;
  imd24?: number;
  imd48?: number;
  divergenceKm?: number;
  className?: string;
}

export const ModelValidationCard: React.FC<ModelValidationCardProps> = ({
  rmse24 = { mean: 79.5, ci_95_lower: 75.7, ci_95_upper: 83.6 },
  rmse48 = { mean: 147.1, ci_95_lower: 140.2, ci_95_upper: 154.8 },
  persistence24 = 1205.1,
  persistence48 = 1370.3,
  imd24 = 80.0,
  imd48 = 120.0,
  divergenceKm,
  className = '',
}) => {
  return (
    <div
      id="model-validation-card"
      className={`bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h4 className="font-bold uppercase tracking-wider text-slate-200">
            Model Validation (LOSO 18-Storm Cross-Validation)
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
          AI ENSEMBLE MEMBER
        </span>
      </div>

      {/* Role Positioning Subtitle */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2 text-[11px] font-sans text-slate-300 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Track Smoothing & Divergence Detection: </span>
          TrackLSTM serves as a complementary AI ensemble member. It does not replace IMD operational NWP.
          If TrackLSTM and IMD forecast tracks diverge by &gt; 200 km, the system triggers mandatory human review.
        </div>
      </div>

      {/* Validation Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* 24h Lead Time */}
        <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>24h Lead Forecast</span>
            <span className="text-cyan-400 font-semibold">95% Bootstrap CI</span>
          </div>
          <div className="text-base font-bold text-slate-100">
            {rmse24.mean.toFixed(1)} <span className="text-xs font-normal text-slate-400">km RMSE</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1">
            <span>CI: [{rmse24.ci_95_lower.toFixed(1)}–{rmse24.ci_95_upper.toFixed(1)}] km</span>
            <span className="text-amber-400">IMD Ref: {imd24.toFixed(0)} km</span>
          </div>
        </div>

        {/* 48h Lead Time */}
        <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>48h Lead Forecast</span>
            <span className="text-cyan-400 font-semibold">95% Bootstrap CI</span>
          </div>
          <div className="text-base font-bold text-slate-100">
            {rmse48.mean.toFixed(1)} <span className="text-xs font-normal text-slate-400">km RMSE</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1">
            <span>CI: [{rmse48.ci_95_lower.toFixed(1)}–{rmse48.ci_95_upper.toFixed(1)}] km</span>
            <span className="text-amber-400">IMD Ref: {imd48.toFixed(0)} km</span>
          </div>
        </div>
      </div>

      {/* Baseline Comparison Reference */}
      <div className="bg-slate-950/90 rounded border border-slate-800/80 p-2 text-[10px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-400 font-semibold">
          <span>BASELINE BENCHMARKS (24h / 48h)</span>
          <span className="text-slate-500">Rigorous Out-of-Fold Evaluation</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-slate-900/60 p-1 rounded border border-slate-800/60">
            <span className="text-slate-400 block">IMD Operational</span>
            <span className="text-amber-300 font-bold">{imd24} / {imd48} km</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded border border-slate-800/60">
            <span className="text-slate-400 block">TrackLSTM (LOSO)</span>
            <span className="text-cyan-300 font-bold">{rmse24.mean.toFixed(1)} / {rmse48.mean.toFixed(1)} km</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded border border-slate-800/60">
            <span className="text-slate-400 block">Persistence Baseline</span>
            <span className="text-rose-400 font-bold">&gt;1,200 km</span>
          </div>
        </div>
      </div>

      {divergenceKm !== undefined && (
        <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
          <span className="text-slate-400">Active IMD-TrackLSTM Divergence:</span>
          <span className={`font-semibold flex items-center gap-1 ${divergenceKm > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {divergenceKm > 200 && <ShieldAlert className="w-3.5 h-3.5" />}
            {divergenceKm.toFixed(1)} km {divergenceKm > 200 ? '(Human Review Flagged)' : '(Nominal Concordance)'}
          </span>
        </div>
      )}
    </div>
  );
};
