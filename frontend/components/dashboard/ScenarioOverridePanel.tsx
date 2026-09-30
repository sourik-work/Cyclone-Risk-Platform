'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CycloneTrack, ScenarioOverride } from '../map/types';
import { Sliders, RotateCcw, AlertTriangle, Play, ShieldAlert } from 'lucide-react';
import { AccordionPanel } from './DashboardAccordion';

export interface ScenarioImpactPreviewData {
  baseline: {
    peakWind: number;
    minPressure: number;
    landfallLat: number;
    landfallLon: number;
  };
  preview: {
    overriddenPeakWind: number;
    overriddenPressure: number;
    overriddenLat: number;
    overriddenLon: number;
    estimatedPayoutCr: number;
    payoutDiffPct: number;
  };
}

interface ScenarioOverridePanelProps {
  scenario: ScenarioOverride | null;
  onApplyScenario: (scenario: ScenarioOverride | null) => void;
  track: CycloneTrack;
  onPreviewChange?: (preview: ScenarioImpactPreviewData) => void;
}

export const ScenarioOverridePanel: React.FC<ScenarioOverridePanelProps> = ({
  scenario,
  onApplyScenario,
  track,
  onPreviewChange,
}) => {
  // Local state for interactive editing before clicking "Apply Scenario"
  const [enabled, setEnabled] = useState<boolean>(scenario?.enabled ?? false);
  const [windMultiplier, setWindMultiplier] = useState<number>(scenario?.wind_multiplier ?? 1.0);
  const [pressureOffset, setPressureOffset] = useState<number>(scenario?.pressure_offset_hpa ?? 0.0);
  const [shiftLat, setShiftLat] = useState<number>(scenario?.track_shift_lat ?? 0.0);
  const [shiftLon, setShiftLon] = useState<number>(scenario?.track_shift_lon ?? 0.0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(scenario?.forward_speed_multiplier ?? 1.0);

  // Sync when parent scenario prop changes externally
  React.useEffect(() => {
    if (scenario) {
      setEnabled(scenario.enabled);
      setWindMultiplier(scenario.wind_multiplier);
      setPressureOffset(scenario.pressure_offset_hpa);
      setShiftLat(scenario.track_shift_lat);
      setShiftLon(scenario.track_shift_lon);
      setSpeedMultiplier(scenario.forward_speed_multiplier);
    } else {
      setEnabled(false);
      setWindMultiplier(1.0);
      setPressureOffset(0.0);
      setShiftLat(0.0);
      setShiftLon(0.0);
      setSpeedMultiplier(1.0);
    }
  }, [scenario]);

  // Compute baseline values from current track
  const baseline = useMemo(() => {
    let peakWind = 215;
    let minPressure = 937;
    let landfallLat = 19.8;
    let landfallLon = 85.8;

    if (track && track.track_points && track.track_points.length > 0) {
      const winds = track.track_points.map((p) => p.wind_speed_kmph || Math.round(p.wind_speed_knots * 1.852));
      const pressures = track.track_points.map((p) => p.central_pressure_hpa);
      peakWind = Math.max(...winds);
      minPressure = Math.min(...pressures);
      const lastPt = track.track_points[track.track_points.length - 1];
      landfallLat = lastPt.latitude;
      landfallLon = lastPt.longitude;
    }

    return { peakWind, minPressure, landfallLat, landfallLon };
  }, [track]);

  // Overridden preview values
  const preview = useMemo(() => {
    const overriddenPeakWind = Math.round(baseline.peakWind * windMultiplier);
    const overriddenPressure = Math.max(850, Math.min(1030, Math.round(baseline.minPressure + pressureOffset)));
    const overriddenLat = Number((baseline.landfallLat + shiftLat).toFixed(2));
    const overriddenLon = Number((baseline.landfallLon + shiftLon).toFixed(2));
    
    // Baseline insurance estimate approx ₹823 Cr (scales quadratically with wind intensity)
    const basePayoutCr = 823;
    const estimatedPayoutCr = Math.round(basePayoutCr * Math.pow(windMultiplier, 1.6));
    const payoutDiffPct = Math.round(((estimatedPayoutCr - basePayoutCr) / basePayoutCr) * 100);

    return {
      overriddenPeakWind,
      overriddenPressure,
      overriddenLat,
      overriddenLon,
      estimatedPayoutCr,
      payoutDiffPct,
    };
  }, [baseline, windMultiplier, pressureOffset, shiftLat, shiftLon]);

  useEffect(() => {
    onPreviewChange?.({ baseline, preview });
  }, [baseline, preview, onPreviewChange]);

  const handleApply = () => {
    const override: ScenarioOverride = {
      cyclone_id: track.name ? track.name.toLowerCase() : track.id,
      wind_multiplier: Number(windMultiplier.toFixed(2)),
      pressure_offset_hpa: Number(pressureOffset.toFixed(1)),
      track_shift_lat: Number(shiftLat.toFixed(2)),
      track_shift_lon: Number(shiftLon.toFixed(2)),
      forward_speed_multiplier: Number(speedMultiplier.toFixed(2)),
      enabled: true,
    };
    setEnabled(true);
    onApplyScenario(override);
  };

  const handleReset = () => {
    setEnabled(false);
    setWindMultiplier(1.0);
    setPressureOffset(0.0);
    setShiftLat(0.0);
    setShiftLon(0.0);
    setSpeedMultiplier(1.0);
    onApplyScenario(null);
  };

  return (
    <AccordionPanel id="scenario-override" title="Scenario Override">
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Master Enable Checkbox */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  setEnabled(e.target.checked);
                  if (e.target.checked) {
                    handleApply();
                  } else {
                    onApplyScenario(null);
                  }
                }}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="font-semibold text-slate-200">Scenario Override Active</span>
            </label>
            {enabled && (
              <span className="text-[10px] font-mono text-amber-400 font-medium">
                Downstream Updated
              </span>
            )}
          </div>

          {/* Sliders Grid */}
          <div className="space-y-3">
            {/* 1. Wind Multiplier */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Wind Speed Multiplier</span>
                <span className="font-mono text-amber-400 font-bold">{windMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={windMultiplier}
                onChange={(e) => setWindMultiplier(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.5× (-50%)</span>
                <span>1.0× (Actual)</span>
                <span>1.5× (+50%)</span>
              </div>
            </div>

            {/* 2. Pressure Offset */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Pressure Offset (hPa)</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {pressureOffset > 0 ? `+${pressureOffset}` : pressureOffset} hPa
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="1"
                value={pressureOffset}
                onChange={(e) => setPressureOffset(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-30 hPa (Intensified)</span>
                <span>0</span>
                <span>+30 hPa (Weakened)</span>
              </div>
            </div>

            {/* 3. Track Shift North/South */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Track Shift N / S</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {shiftLat > 0 ? `+${shiftLat.toFixed(1)}° N` : shiftLat < 0 ? `${shiftLat.toFixed(1)}° S` : '0.0°'}
                </span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={shiftLat}
                onChange={(e) => setShiftLat(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-1.0° S (~110km)</span>
                <span>0.0°</span>
                <span>+1.0° N (~110km)</span>
              </div>
            </div>

            {/* 4. Track Shift East/West */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Track Shift E / W</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {shiftLon > 0 ? `+${shiftLon.toFixed(1)}° E` : shiftLon < 0 ? `${shiftLon.toFixed(1)}° W` : '0.0°'}
                </span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.1"
                value={shiftLon}
                onChange={(e) => setShiftLon(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-1.0° W</span>
                <span>0.0°</span>
                <span>+1.0° E</span>
              </div>
            </div>

            {/* 5. Forward Speed Multiplier */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">Forward Speed Multiplier</span>
                <span className="font-mono text-indigo-400 font-bold">{speedMultiplier.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.5× (Slow/Stalling)</span>
                <span>1.0×</span>
                <span>2.0× (Fast Transit)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApply}
              className="flex-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply Scenario</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              title="Reset to Actual Track"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </AccordionPanel>
  );
};

export const ScenarioImpactPreviewPanel: React.FC<{
  data: ScenarioImpactPreviewData | null;
}> = ({ data }) => (
  <AccordionPanel id="downstream-impact-preview" title="Downstream Impact Preview">
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
      {data ? (
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded border border-slate-800/80 bg-slate-900/80 p-2">
            <span className="block text-[10px] text-slate-500">Peak Wind</span>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-400">{data.baseline.peakWind}</span>
              <span className="text-slate-600">→</span>
              <span className="font-bold text-amber-300">{data.preview.overriddenPeakWind} km/h</span>
            </div>
          </div>
          <div className="rounded border border-slate-800/80 bg-slate-900/80 p-2">
            <span className="block text-[10px] text-slate-500">Min Pressure</span>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-400">{data.baseline.minPressure}</span>
              <span className="text-slate-600">→</span>
              <span className="font-bold text-cyan-300">{data.preview.overriddenPressure} hPa</span>
            </div>
          </div>
          <div className="rounded border border-slate-800/80 bg-slate-900/80 p-2">
            <span className="block text-[10px] text-slate-500">Landfall Lat/Lon</span>
            <div className="flex items-baseline gap-1 text-[10px]">
              <span className="text-slate-400">{data.baseline.landfallLat}°, {data.baseline.landfallLon}°</span>
              <span className="text-slate-600">→</span>
              <span className="font-bold text-emerald-300">{data.preview.overriddenLat}°, {data.preview.overriddenLon}°</span>
            </div>
          </div>
          <div className="rounded border border-slate-800/80 bg-slate-900/80 p-2">
            <span className="block text-[10px] text-slate-500">Est. Insurance Payout</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-indigo-300">₹{data.preview.estimatedPayoutCr} Cr</span>
              <span className={`text-[10px] ${data.preview.payoutDiffPct >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ({data.preview.payoutDiffPct >= 0 ? `+${data.preview.payoutDiffPct}` : data.preview.payoutDiffPct}%)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Scenario projections are initializing.</p>
      )}
    </div>
  </AccordionPanel>
);
