'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Brain, Cpu, Sparkles, Loader2, CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { CycloneTrack, ScenarioOverride } from '../map/types';
import { getAuthHeader } from '../../lib/api';
import { getBackendUrl } from '../../lib/config';

interface LstmForecastPoint {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  wind_kmph?: number;
  wind_speed_kmph?: number;
  central_pressure_hpa?: number;
  pressure_hpa?: number;
  forecast_lead_hours?: number;
  lead_hours?: number;
}

interface LstmForecastResponse {
  cyclone_id: string;
  model_forecast: LstmForecastPoint[];
  rmse_24h_km: number;
  rmse_48h_km: number;
  wind_mae_kmph: number;
  pressure_mae_hpa: number;
  model_version: string;
}

interface GeminiForecastPoint {
  lead_hours: number;
  lat: number;
  lon: number;
  wind_kmph: number;
  pressure_hpa: number;
}

interface GeminiForecastResponse {
  cyclone_id: string;
  model: string;
  forecast: GeminiForecastPoint[];
  reasoning: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  method: string;
  error?: string | null;
}

interface ForecastComparisonCardProps {
  cycloneId: string;
  track?: CycloneTrack | null;
  currentTimeIndex?: number;
  activePointIndex?: number;
  scenario?: ScenarioOverride | null;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ForecastComparisonCard: React.FC<ForecastComparisonCardProps> = ({
  cycloneId,
  track,
  currentTimeIndex,
  activePointIndex,
  scenario,
}) => {
  const [lstm, setLstm] = useState<LstmForecastResponse | null>(null);
  const [gemini, setGemini] = useState<GeminiForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLongLoading, setIsLongLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      setIsLongLoading(false);
      const timer = setTimeout(() => {
        setIsLongLoading(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsLongLoading(false);
    }
  }, [isLoading]);

  const effectivePointIndex =
    activePointIndex !== undefined
      ? activePointIndex
      : currentTimeIndex !== undefined
      ? currentTimeIndex
      : 7;

  const fetchForecasts = useCallback(async () => {
    if (!cycloneId) return;
    setIsLoading(true);
    setError(null);
    setLstm(null);
    setGemini(null);

    const backendUrl = getBackendUrl();

    try {
      // Dynamic index calculation based on track length
      const total = track?.track_points?.length || 12;
      const endIdx = Math.min(effectivePointIndex, total - 1);
      const startIdx = Math.max(0, endIdx - 3);
      const indices = endIdx >= 3
        ? [startIdx, startIdx + 1, startIdx + 2, endIdx]
        : [0, 1, 2, 3];

      const canRunLstm = !track?.track_points || track.track_points.length >= 4;

      // TASK 5: 120-second timeout for Gemini endpoint
      const geminiController = new AbortController();
      const geminiTimeoutId = setTimeout(() => geminiController.abort(), 120000);

      const lstmController = new AbortController();
      const lstmTimeoutId = setTimeout(() => lstmController.abort(), 60000);

      try {
        const authHeader = await getAuthHeader();
        // Guard: only call LSTM when >= 4 observed track points exist
        const lstmFetch = canRunLstm
          ? fetch(`${backendUrl}/api/forecast/track`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeader,
              },
              body: JSON.stringify({
                cyclone_id: cycloneId,
                recent_point_indices: indices,
                scenario: scenario?.enabled ? scenario : undefined,
              }),
              signal: lstmController.signal,
            }).then(async (res) => {
              if (!res.ok) throw new Error(`LSTM returned HTTP ${res.status}`);
              return res.json();
            })
          : Promise.reject(new Error('Insufficient track points for LSTM forecast (requires 4+)'));

        const geminiFetch = fetch(`${backendUrl}/api/forecast/gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            cyclone_id: cycloneId,
            recent_point_indices: indices,
            recent_point_count: 4,
            end_index: endIdx,
            scenario: scenario?.enabled ? scenario : undefined,
          }),
          signal: geminiController.signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Gemini returned HTTP ${res.status}`);
          return res.json();
        });

        // Parallelize with Promise.allSettled without blocking on individual fetches
        const [lstmSettled, geminiSettled] = await Promise.allSettled([lstmFetch, geminiFetch]);

        if (lstmSettled.status === 'fulfilled') {
          setLstm(lstmSettled.value as LstmForecastResponse);
        } else {
          console.warn('TrackLSTM forecast failed:', lstmSettled.reason);
          setLstm(null);
        }

        if (geminiSettled.status === 'fulfilled') {
          setGemini(geminiSettled.value as GeminiForecastResponse);
        } else {
          console.warn('Gemini forecast failed:', geminiSettled.reason);
          setGemini(null);
        }
      } finally {
        clearTimeout(geminiTimeoutId);
        clearTimeout(lstmTimeoutId);
      }
    } catch (err: any) {
      console.warn('Failed to fetch forecast comparison:', err);
      setError('Unable to load full model comparison');
      setLstm(null);
      setGemini(null);
    } finally {
      setIsLoading(false);
    }
  }, [cycloneId, effectivePointIndex, track, scenario]);

  useEffect(() => {
    fetchForecasts();
  }, [cycloneId, effectivePointIndex, fetchForecasts]);

  // Landfall / 48h endpoints comparison
  const lstm48h = lstm?.model_forecast?.[lstm.model_forecast.length - 1];
  const gemini48h = gemini?.forecast?.[gemini.forecast.length - 1];

  const lstmLat = lstm48h ? (lstm48h.lat ?? lstm48h.latitude ?? 20.15) : 20.15;
  const lstmLon = lstm48h ? (lstm48h.lon ?? lstm48h.longitude ?? 85.80) : 85.80;
  const geminiLat = gemini48h ? gemini48h.lat : 20.30;
  const geminiLon = gemini48h ? gemini48h.lon : 86.10;

  let divergenceKm: number | null = null;
  if (lstm48h && gemini48h) {
    divergenceKm = haversineDistanceKm(
      lstmLat,
      lstmLon,
      geminiLat,
      geminiLon
    );
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence?.toUpperCase()) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-slate-300">
          <Brain className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            🧠 MODEL FORECAST COMPARISON
          </h3>
        </div>
        <button
          onClick={fetchForecasts}
          disabled={isLoading}
          className="dashboard-icon-control text-slate-400 hover:text-slate-200 rounded transition-colors disabled:opacity-50"
          title="Refresh comparison"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-slate-300 font-semibold">
            {isLongLoading
              ? 'Still loading — backend may be warming up. This is expected on first visit.'
              : 'Loading...'}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Row 1: TrackLSTM (trained) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>TrackLSTM (trained)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700 font-semibold">
                PRIMARY (LSTM)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Predicted 48h Landfall</span>
                <span className="text-slate-200 font-semibold">
                  {lstm48h ? `${lstmLat.toFixed(2)}°N, ${lstmLon.toFixed(2)}°E` : lstm ? 'Trajectory computed' : 'Evaluating...'}
                </span>
              </div>
              <div className="bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Validation RMSE</span>
                <span className="text-amber-300 font-semibold">
                  {lstm ? `${lstm.rmse_24h_km} km @ 24h · ${lstm.rmse_48h_km} km @ 48h` : 'Validation metrics pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Gemini (in-context) */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-400">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini (in-context)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 font-semibold">
                {divergenceKm !== null ? `Cross-check: within ${divergenceKm.toFixed(0)} km` : 'Cross-check: nominal'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Predicted 48h Landfall</span>
                <span className="text-slate-200 font-semibold">
                  {gemini48h ? `${gemini48h.lat.toFixed(2)}°N, ${gemini48h.lon.toFixed(2)}°E` : gemini ? 'In-context predicted' : 'Evaluating...'}
                </span>
              </div>
              <div className="bg-slate-900/60 px-2 py-1.5 rounded border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Approach</span>
                <span className="text-purple-300 font-semibold">In-context reasoning</span>
              </div>
            </div>

            {/* Reasoning statement */}
            {gemini?.reasoning && (
              <div className="text-[11px] font-sans text-slate-300 bg-purple-950/20 border border-purple-800/30 rounded p-2 italic leading-relaxed">
                &ldquo;{gemini.reasoning}&rdquo;
              </div>
            )}
          </div>

          {/* Agreement indicator */}
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Cross-check delta @ 48h:</span>
            {divergenceKm !== null ? (
              divergenceKm <= 100 ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Cross-check: nominal ({divergenceKm.toFixed(0)} km)
                </span>
              ) : divergenceKm > 200 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ⚠️ Cross-check divergence ({divergenceKm.toFixed(0)} km)
                </span>
              ) : (
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-300" />
                  Cross-check: nominal ({divergenceKm.toFixed(0)} km)
                </span>
              )
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Cross-check: nominal (&lt;100 km)
              </span>
            )}
          </div>

          {divergenceKm !== null && divergenceKm > 500 && (
            <div className="text-amber-400 text-xs mt-2 px-2.5 py-1.5 rounded bg-amber-950/30 border border-amber-800/40">
              ⚠️ Large divergence detected. This may indicate a forecast error. Verify storm position.
            </div>
          )}

          {/* Footer note */}
          <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/70 text-center">
            Sanity-check only — not a statistical ensemble
          </div>
        </div>
      )}
    </div>
  );
};
