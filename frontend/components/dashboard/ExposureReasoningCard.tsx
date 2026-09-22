'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Brain, Sparkles, Loader2, AlertCircle, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { getAuthHeader } from '../../lib/api';

interface CriticalAsset {
  name: string;
  reason: string;
}

interface ExposureReasoningData {
  district_name: string;
  narrative: string;
  critical_assets: CriticalAsset[];
  recommended_actions: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  reasoning_source?: string;
}

interface ExposureReasoningCardProps {
  districtName: string;
  cycloneId: string;
}

export const ExposureReasoningCard: React.FC<ExposureReasoningCardProps> = ({
  districtName,
  cycloneId,
}) => {
  const [data, setData] = useState<ExposureReasoningData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExposureReasoning = useCallback(async () => {
    if (!districtName) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // TASK 5: 120-second timeout for Gemini exposure reasoning
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${backendUrl}/api/exposure/reason`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          district_name: districtName,
          cyclone_id: cycloneId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result: ExposureReasoningData = await res.json();
      setData(result);
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.warn('Exposure reasoning timed out after 120s');
        setError('Gemini reasoning timed out — backend is under load');
      } else {
        console.warn('Failed to fetch exposure reasoning:', err);
        setError('Unable to load multimodal reasoning analysis');
      }
      setData(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [districtName, cycloneId]);

  useEffect(() => {
    fetchExposureReasoning();
  }, [fetchExposureReasoning]);

  const getConfidenceBadge = (confidence: string) => {
    const conf = (confidence || 'MEDIUM').toUpperCase();
    if (conf === 'HIGH') {
      return (
        <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          CONFIDENCE: HIGH
        </span>
      );
    }
    if (conf === 'MEDIUM') {
      return (
        <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          CONFIDENCE: MEDIUM
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 bg-slate-700/50 text-slate-400 border border-slate-600/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
        CONFIDENCE: LOW
      </span>
    );
  };

  return (
    <div
      id="gemini-exposure-reasoning-card"
      className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>GEMINI EXPOSURE REASONING</span>
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && getConfidenceBadge(data.confidence)}
          <button
            onClick={fetchExposureReasoning}
            disabled={isLoading}
            title="Re-analyze exposure"
            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-300 font-mono">
            Gemini is reasoning over SAR imagery + infrastructure...
          </p>
          <p className="text-[10px] text-slate-500">
            Synthesizing Sentinel-1 SAR flood extent with OSM power grid & lifelines
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && data && !error && (
        <div className="space-y-3">
          {/* Narrative Summary */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs leading-relaxed text-slate-200">
            <p className="text-slate-300">{data.narrative}</p>
          </div>

          {/* Critical Assets List */}
          {data.critical_assets && data.critical_assets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wide text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Critical Exposed Assets</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-2 text-xs">
                {data.critical_assets.map((asset, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <div className="text-[11px] leading-snug">
                      <span className="font-semibold text-slate-200">{asset.name}:</span>{' '}
                      <span className="text-slate-400">{asset.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions List */}
          {data.recommended_actions && data.recommended_actions.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wide text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recommended Anticipatory Actions (T-12h)</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                {data.recommended_actions.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">{act}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Reasoned by Gemini 3.7 Flash · multimodal (SAR + infrastructure)</span>
            <span className="text-cyan-500/80 font-semibold">{districtName}</span>
          </div>
        </div>
      )}
    </div>
  );
};
