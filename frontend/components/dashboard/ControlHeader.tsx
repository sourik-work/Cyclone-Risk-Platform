'use client';

import React, { useEffect, useState } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, DistrictProperties } from '../map/types';
import { SEED_ALL_COASTAL_VULNERABILITY } from '../../lib/seedData';
import {
  ShieldAlert,
  Globe2,
  Activity,
  History,
  Radio,
  ExternalLink,
  X,
  MapPin,
  TrendingUp,
  Layers,
  Camera,
} from 'lucide-react';
import { SignInButton } from '../auth/SignInButton';
import { ReportDamageModal } from './ReportDamageModal';
import { HowItWorksModal } from '../modals/HowItWorksModal';
import { ValidationMetricsModal } from '../modals/ValidationMetricsModal';
import { Brain, BarChart3 } from 'lucide-react';

export type DashboardMode = 'historical' | 'live';

const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  en: 'english',
  or: 'odia',
  bn: 'bengali',
  hi: 'hindi',
  te: 'telugu',
  ta: 'tamil',
  gu: 'gujarati',
  mr: 'marathi',
  kn: 'kannada',
  ml: 'malayalam',
  kok: 'konkani',
};

interface ControlHeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  stormStatus: string;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  liveStatus?: 'active' | 'monitoring' | null;
  districts?: DistrictProperties[];
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  stormStatus,
  mode = 'historical',
  onModeChange,
  liveStatus,
  districts,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('--:--:-- UTC');
  const [timeIst, setTimeIst] = useState<string>('--:--:-- IST');
  const [mounted, setMounted] = useState<boolean>(false);
  const [showApacModal, setShowApacModal] = useState<boolean>(false);
  const [showReportDamage, setShowReportDamage] = useState<boolean>(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);

  // Compute dynamic India-scale coverage metrics
  const coverageDistricts =
    districts && districts.length > 0
      ? districts
      : SEED_ALL_COASTAL_VULNERABILITY.features.map((f) => f.properties);

  const uniqueStatesCount = new Set(coverageDistricts.map((d) => d.state_name)).size;
  const districtCount = coverageDistricts.length;
  const totalVulnerablePopulation = coverageDistricts.reduce(
    (sum, d) => sum + (d.vulnerable_population ?? d.kutcha_population ?? 0),
    0
  );
  const formattedPopulationAtRisk = `${Math.floor(totalVulnerablePopulation / 1_000_000)}M+`;

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setTimeIst(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="w-full min-h-[72px] bg-surface-1/80 backdrop-blur-xl border-b border-subtle px-6 py-5 flex flex-wrap items-center justify-between gap-4 select-none z-30">
        {/* Platform Brand & Operational Status */}
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-md border ${
              mode === 'live' && liveStatus === 'active'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-slate-800/60 border-slate-700/70 text-blue-300'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${mode === 'live' && liveStatus === 'active' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-text-primary">
                Cyclone Risk & Anticipatory Platform
              </h1>
              {mode === 'live' ? (
                liveStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    Live: Active Cyclone
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Monitoring (IMD RSMC)
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                  Historical: {stormStatus || 'Active Advisory'}
                </span>
              )}

            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              India Coastal Predictive Vulnerability & Pre-Landfall Evacuation Engine
            </p>
          </div>
        </div>

        {/* Clock, APAC Button, Mode Toggle & Language Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* How It Works Pipeline Button */}
          <button
            id="btn-how-it-works"
            onClick={() => setShowHowItWorksModal(true)}
            className="dashboard-control flex items-center gap-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 transition-colors cursor-pointer"
            title="View end-to-end AI pipeline architecture and Gemini multimodal reasoning flow"
          >
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">How It Works</span>
          </button>

          {/* Model Validation & Benchmarks Button */}
          <button
            id="btn-validation-metrics"
            onClick={() => setShowValidationModal(true)}
            className="dashboard-control flex items-center gap-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 transition-colors cursor-pointer"
            title="View quantitative accuracy metrics (RMSE vs IMD baselines) and train/test holdouts"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Validation</span>
          </button>

          {/* APAC Scale Preview Button */}
          <button
            id="btn-apac-scale"
            onClick={() => setShowApacModal(true)}
            className="dashboard-control flex items-center gap-1.5 rounded-md card-glass text-slate-300 border-border-subtle transition-colors hover:bg-white/5 cursor-pointer"
            title="Preview Phase 2 Asia-Pacific Regional Scale Expansion"
          >
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <span>APAC Scale</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Phase 2
            </span>
          </button>

          {/* Historical vs Live Mode Toggle */}
          <div className="flex items-center card-glass p-1 rounded-md shadow-inner border-border-subtle">
            <button
              id="mode-toggle-historical"
              onClick={() => onModeChange('historical')}
              className={`dashboard-control flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'historical'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/40'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
              }`}
              title="Historical Cyclone Replays (Fani, Amphan)"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical</span>
            </button>
            <button
              id="mode-toggle-live"
              onClick={() => onModeChange('live')}
              className={`dashboard-control flex items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'live'
                  ? 'bg-blue-600/25 text-blue-100 border border-blue-500/40'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
              }`}
              title="Live IMD RSMC New Delhi Feed"
            >
              <Radio className={`w-3.5 h-3.5 ${mode === 'live' ? '' : 'text-slate-400'}`} />
              <span>Live Feed</span>
            </button>
          </div>

          <div
            role="toolbar"
            aria-label="Dashboard actions"
            className="flex h-10 items-center gap-1 rounded-md border border-border-subtle bg-surface-2/70 p-1"
          >
            <div className="flex h-8 items-center gap-2 px-2 font-mono text-[11px] text-text-secondary">
              <Activity className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
              <span>{mounted ? timeUtc : '--:--:-- UTC'}</span>
              <span className="text-text-tertiary" aria-hidden="true">·</span>
              <span>{mounted ? timeIst : '--:--:-- IST'}</span>
            </div>
            <button
              id="report-damage-btn"
              onClick={() => setShowReportDamage(true)}
              className="dashboard-control inline-flex items-center gap-1.5 rounded text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              title="Submit Citizen Cyclone Damage Photo"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Report</span>
            </button>
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Citizen Damage Report Modal */}
      {showReportDamage && (
        <ReportDamageModal
          isOpen={showReportDamage}
          onClose={() => setShowReportDamage(false)}
          defaultState={coverageDistricts[0]?.state_name || 'Odisha'}
          defaultDistrict={coverageDistricts[0]?.district_name || 'Puri'}
        />
      )}

      {/* APAC Scale Phase 2 Expansion Modal */}
      {showApacModal && (
        <div
          id="apac-scale-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto"
          onClick={() => setShowApacModal(false)}
        >
          <div
            className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-slate-100 relative my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Globe2 className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                    APAC SCALABILITY (DESIGNED, NOT DEPLOYED) &amp; ARCHITECTURAL PORTABILITY
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Genuine modular portability designed for Asia-Pacific cyclone basins, with a fully operational Live India Demo.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-apac-modal"
                onClick={() => setShowApacModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architectural Portability Swap-in Module Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Architectural Portability (Swap-In Modules)</span>
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                      <th className="p-2.5 font-semibold">Layer</th>
                      <th className="p-2.5 font-semibold">India Implementation</th>
                      <th className="p-2.5 font-semibold">APAC Swap-In Module</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Storm track data</td>
                      <td className="p-2.5">IMD RSMC New Delhi XML/HTML scrapers</td>
                      <td className="p-2.5 text-indigo-300 font-medium">JTWC (Pacific), PAGASA (Philippines), BMKG (Indonesia) API adapters</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Satellite imagery</td>
                      <td className="p-2.5">Google Earth Engine Sentinel-1 SAR</td>
                      <td className="p-2.5 text-emerald-300 font-medium">Same — GEE is global</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Infrastructure</td>
                      <td className="p-2.5">OpenStreetMap + state DISCOM</td>
                      <td className="p-2.5 text-cyan-300 font-medium">Same OSM + national grid authority</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Vulnerability</td>
                      <td className="p-2.5">Census + NDMA statistics</td>
                      <td className="p-2.5 text-amber-300 font-medium">National census bureau data</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Language</td>
                      <td className="p-2.5">6 Indian languages</td>
                      <td className="p-2.5 text-purple-300 font-medium">Bengali (Bangladesh), Sinhala + Tamil (Sri Lanka), Burmese (Myanmar), Tagalog (Philippines)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-200">Insurance partner</td>
                      <td className="p-2.5">NDRP</td>
                      <td className="p-2.5 text-teal-300 font-medium">CCRIF (Caribbean pattern), national risk pools</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Planned Country Adapters (Phase 2) */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Planned Country Adapters (Phase 2)</span>
                <span className="text-[10px] text-slate-500 font-normal">~200 LOC per track adapter</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* 1. Sri Lanka */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🇱🇰</span> Sri Lanka
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      ~200 LOC adapter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    JTWC + Met Dept adapters, Tamil + Sinhala TTS alerting.
                  </p>
                </div>

                {/* 2. Myanmar */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🇲🇲</span> Myanmar
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      ~200 LOC adapter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    JTWC + DMH adapters, Burmese TTS alerting.
                  </p>
                </div>

                {/* 3. Philippines */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🇵🇭</span> Philippines
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      ~200 LOC adapter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    PAGASA + JTWC adapters, Tagalog + Cebuano TTS alerting.
                  </p>
                </div>

                {/* 4. Indonesia */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🇮🇩</span> Indonesia
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      ~200 LOC adapter
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    BMKG adapter, Bahasa Indonesia + Javanese TTS alerting.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Summary Callout */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400 leading-relaxed">
              Each new country requires: <strong>(1)</strong> a track data adapter (~200 LOC), <strong>(2)</strong> a vulnerability GeoJSON (~4 districts to demonstrate), <strong>(3)</strong> additional TTS language models. The core prediction, exposure, advisory, and insurance pipelines work unchanged.
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowApacModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Pipeline Architecture Modal */}
      <HowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />

      {/* Quantitative Model Validation & Benchmarks Modal */}
      <ValidationMetricsModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
      />
    </>
  );
};
