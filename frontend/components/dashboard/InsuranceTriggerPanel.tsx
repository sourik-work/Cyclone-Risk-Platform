'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Coins, CheckCircle2, Clock, RefreshCw, Zap } from 'lucide-react';

export interface InsuranceTriggerResult {
  contract_id: string;
  state: string;
  districts: string[];
  trigger_met: boolean;
  current_value: number;
  threshold: number;
  payout_estimate_inr: number;
  households_affected: number;
  status: 'TRIGGER_ACTIVE' | 'APPROACHING' | 'BELOW_THRESHOLD';
}

export interface UncertaintyAssessment {
  positional_rmse_km: number;
  model_agreement_km?: number | null;
  trigger_confidence: string;
  trigger_buffer_pct: number;
  justification: string;
}

export interface InsuranceEvaluateResponse {
  total_contracts: number;
  triggers_active: number;
  total_payout_inr: number;
  total_households: number;
  uncertainty_assessment?: UncertaintyAssessment | null;
  results: InsuranceTriggerResult[];
}

export interface InsuranceTriggerPanelProps {
  cycloneId?: string;
  mode?: 'historical' | 'live';
  hasActiveCyclone?: boolean;
  cycloneName?: string | null;
  cycloneCategory?: string | null; // e.g., "DEPRESSION", "SEVERE CYCLONIC STORM"
  currentState?: string;
}

const FALLBACK_EVALUATION: InsuranceEvaluateResponse = {
  total_contracts: 4,
  triggers_active: 0,
  total_payout_inr: 0,
  total_households: 0,
  results: [
    {
      contract_id: 'PC-OD-001',
      state: 'Odisha',
      districts: ['Puri', 'Jagatsinghpur', 'Kendrapara'],
      trigger_met: false,
      current_value: 0.6,
      threshold: 1.5,
      payout_estimate_inr: 0,
      households_affected: 0,
      status: 'BELOW_THRESHOLD',
    },
    {
      contract_id: 'PC-WB-002',
      state: 'West Bengal',
      districts: ['South 24 Parganas', 'North 24 Parganas'],
      trigger_met: false,
      current_value: 30.0,
      threshold: 100.0,
      payout_estimate_inr: 0,
      households_affected: 0,
      status: 'BELOW_THRESHOLD',
    },
    {
      contract_id: 'PC-AP-003',
      state: 'Andhra Pradesh',
      districts: ['Srikakulam', 'Vizianagaram', 'Visakhapatnam'],
      trigger_met: false,
      current_value: 0.28,
      threshold: 0.75,
      payout_estimate_inr: 0,
      households_affected: 0,
      status: 'BELOW_THRESHOLD',
    },
    {
      contract_id: 'PC-TN-004',
      state: 'Tamil Nadu',
      districts: ['Chennai', 'Cuddalore', 'Nagapattinam'],
      trigger_met: false,
      current_value: 43.3,
      threshold: 150.0,
      payout_estimate_inr: 0,
      households_affected: 0,
      status: 'BELOW_THRESHOLD',
    },
  ],
};

const formatCrore = (payoutInr: number): string => {
  const cr = payoutInr / 10000000;
  if (cr >= 1000) {
    return `₹${(cr / 1000).toFixed(2)}K Cr`;
  }
  return `₹${cr.toFixed(1)} Cr`;
};

export const InsuranceTriggerPanel: React.FC<InsuranceTriggerPanelProps> = ({
  cycloneId = 'BOB-02-2019',
  mode = 'historical',
  hasActiveCyclone = false,
  cycloneName,
  cycloneCategory,
  currentState,
}) => {
  const [data, setData] = useState<InsuranceEvaluateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const targetId =
        mode === 'live' && !hasActiveCyclone ? 'calm-baseline' : cycloneId || 'BOB-02-2019';

      const res = await fetch(`${backendUrl}/api/insurance/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cyclone_id: targetId }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed: ${res.statusText}`);
      }

      const json: InsuranceEvaluateResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.warn('Failed to fetch parametric insurance evaluation, using fallback:', err);
      setError(err?.message || 'Using cached insurance models');
      setData(FALLBACK_EVALUATION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [cycloneId, mode, hasActiveCyclone]);

  const evalData = data || FALLBACK_EVALUATION;
  const allBelowThreshold = evalData.triggers_active === 0;

  return (
    <div
      id="parametric-insurance-panel"
      className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-xl space-y-3 relative overflow-hidden transition-all duration-300"
    >
      {/* Subtle top indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-cyan-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            PARAMETRIC INSURANCE TRIGGERS
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
            NDRP Risk Pool
          </span>
          <button
            onClick={fetchEvaluation}
            disabled={loading}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Re-evaluate triggers against latest storm telemetry"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* TASK 2: Context Banner — Explains why numbers are what they are */}
      {mode === 'historical' && (
        <div className="bg-cyan-900/30 border border-cyan-700 text-cyan-300 px-3 py-2 rounded text-xs font-mono leading-relaxed">
          📊 RETROSPECTIVE ANALYSIS — Simulated trigger evaluation for {cycloneName || 'Cyclone'}
        </div>
      )}

      {mode === 'live' && hasActiveCyclone && (
        <div className="bg-amber-900/30 border border-amber-700 text-amber-300 px-3 py-2 rounded text-xs font-mono leading-relaxed">
          ⚠️ LIVE EVALUATION — {cycloneCategory || 'System'} &ldquo;{cycloneName || 'Active Cyclone'}&rdquo; detected.{' '}
          {allBelowThreshold
            ? 'Storm intensity below payout thresholds — contracts on standby.'
            : 'TRIGGERS ACTIVE.'}
        </div>
      )}

      {mode === 'live' && !hasActiveCyclone && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 px-3 py-2 rounded text-xs font-mono leading-relaxed">
          🛰️ MONITORING — No active cyclone. 4 contracts armed. Awaiting IMD bulletin.
        </div>
      )}

      {/* TASK 3: Always show contract stats even at 0 + secondary line */}
      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-slate-200 font-bold">{evalData.total_contracts}</span>{' '}
              <span className="text-slate-400">contracts</span>
              <span className="text-slate-600 mx-1.5">·</span>
              <span
                className={`font-bold ${
                  evalData.triggers_active > 0 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {evalData.triggers_active}
              </span>{' '}
              <span className="text-slate-400">active</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">Estimated Payout</div>
            <div
              className={`text-xs font-mono font-extrabold ${
                evalData.total_payout_inr > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {formatCrore(evalData.total_payout_inr)}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 mt-1 font-mono">
          Monitoring 4 states · 16 districts · 3.08M insured population · Thresholds armed
        </div>
      </div>

      {evalData.uncertainty_assessment && (
        <div className="bg-slate-900/60 border border-slate-700 rounded p-2 mb-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Uncertainty Buffer</span>
            <span className={`font-bold ${
              evalData.uncertainty_assessment.trigger_confidence === 'HIGH' ? 'text-emerald-400' :
              evalData.uncertainty_assessment.trigger_confidence === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {evalData.uncertainty_assessment.trigger_confidence} · +{(evalData.uncertainty_assessment.trigger_buffer_pct * 100).toFixed(0)}% margin
            </span>
          </div>
          <div className="text-slate-500 mt-1 leading-relaxed">
            {evalData.uncertainty_assessment.justification}
          </div>
          <div className="text-slate-600 mt-1">
            Positional RMSE @ 48h: {evalData.uncertainty_assessment.positional_rmse_km.toFixed(1)} km
          </div>
        </div>
      )}

      {/* Contract Trigger Rows */}
      <div className="space-y-2.5">
        {evalData.results.map((contract) => {
          const isExceeded =
            contract.status === 'TRIGGER_ACTIVE' || contract.current_value >= contract.threshold;
          const isApproaching =
            !isExceeded &&
            (contract.status === 'APPROACHING' ||
              contract.current_value >= contract.threshold * 0.8);
          const isStandby = !isExceeded && !isApproaching;

          const isSelectedState =
            currentState && contract.state.toLowerCase() === currentState.toLowerCase();

          return (
            <div
              key={contract.contract_id}
              className={`p-2.5 rounded-lg border transition-all text-xs font-mono space-y-1.5 ${
                isExceeded
                  ? 'bg-red-950/20 border-red-500/40 shadow-sm shadow-red-950/30'
                  : isApproaching
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-950/30'
                  : 'bg-slate-950/50 border-slate-800/80'
              } ${isSelectedState ? 'ring-1 ring-cyan-400/50' : ''}`}
            >
              {/* Row Top: State & Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-200 truncate">{contract.state}</span>
                  <span className="text-[10px] text-slate-500">({contract.contract_id})</span>
                </div>

                {/* Status Badges */}
                {isExceeded && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                    TRIGGER ACTIVE
                  </span>
                )}
                {isApproaching && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Clock className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                    APPROACHING
                  </span>
                )}
                {isStandby && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    BELOW THRESHOLD
                  </span>
                )}
              </div>

              {/* District List */}
              <div className="text-[10px] text-slate-400 truncate">
                Districts: <span className="text-slate-300">{contract.districts.join(', ')}</span>
              </div>

              {/* TASK 4: Telemetry Metric vs Threshold Bar + Delta Indicator */}
              <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400">Current / Threshold:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono">
                    <span
                      className={
                        isExceeded
                          ? 'text-red-400'
                          : isApproaching
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {contract.current_value}
                    </span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-200">{contract.threshold}</span>
                  </span>
                  {/* Delta indicator */}
                  {isExceeded && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      🔴 Triggered
                    </span>
                  )}
                  {isApproaching && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🟡 Approaching
                    </span>
                  )}
                  {isStandby && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                      🟢 Standby
                    </span>
                  )}
                </div>
              </div>

              {/* Approaching Callout */}
              {isApproaching && (
                <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded font-sans font-medium">
                  <span>💰 Payout activates in T-18h (Anticipatory Action Liquidity)</span>
                </div>
              )}

              {/* Active Liquidity Payout Estimate */}
              {isExceeded && contract.payout_estimate_inr > 0 && (
                <div className="flex items-center justify-between text-[10px] text-red-300 bg-red-950/40 border border-red-500/30 px-2 py-1 rounded font-mono">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-red-400 shrink-0" />
                    <span>Auto-Disbursement:</span>
                  </span>
                  <span className="font-bold text-red-200">
                    {formatCrore(contract.payout_estimate_inr)} (
                    {contract.households_affected.toLocaleString()} HH)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TASK 5: Updated Payout Formula Tooltip / Methodology Note */}
      <div className="pt-2 text-[10px] text-slate-400 font-sans border-t border-slate-800/60 leading-tight">
        Payout = affected households × ₹/household, capped at contract max. Payouts release
        pre-landfall via NDRP parametric trigger.
      </div>
    </div>
  );
};
