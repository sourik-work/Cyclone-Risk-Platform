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

export type DashboardMode = 'historical' | 'live';

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
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeIst, setTimeIst] = useState<string>('');
  const [showApacModal, setShowApacModal] = useState<boolean>(false);
  const [showReportDamage, setShowReportDamage] = useState<boolean>(false);

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
      <header className="w-full bg-[#090e17] border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
        {/* Platform Brand & Status */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border ${
              mode === 'live'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono">
                CYCLONE RISK & ANTICIPATORY PLATFORM
              </h1>
              {mode === 'live' ? (
                liveStatus === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    LIVE: ACTIVE CYCLONE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    LIVE MONITORING (IMD RSMC)
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  HISTORICAL: {stormStatus || 'ACTIVE ADVISORY'}
                </span>
              )}

              {/* Dynamic India-Scale Serving Coverage Badge */}
              <span
                id="platform-coverage-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/70 text-cyan-300 border border-cyan-500/40 shadow-sm"
              >
                <MapPin className="w-3 h-3 text-cyan-400" />
                Serving {uniqueStatesCount} states · {districtCount} districts · {formattedPopulationAtRisk} population at risk
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bay of Bengal Predictive Vulnerability & Pre-Landfall Evacuation Engine
            </p>
          </div>
        </div>

        {/* Clock, APAC Button, Mode Toggle & Language Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* APAC Scale Preview Button */}
          <button
            id="btn-apac-scale"
            onClick={() => setShowApacModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Preview Phase 2 Asia-Pacific Regional Scale Expansion"
          >
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>APAC Scale</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
              Phase 2
            </span>
          </button>

          {/* Historical vs Live Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              id="mode-toggle-historical"
              onClick={() => onModeChange('historical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                mode === 'historical'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 scale-105 border border-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
              title="Historical Cyclone Replays (Fani, Amphan)"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical</span>
            </button>
            <button
              id="mode-toggle-live"
              onClick={() => onModeChange('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                mode === 'live'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 scale-105 border border-emerald-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
              title="Live IMD RSMC New Delhi Feed"
            >
              <Radio className={`w-3.5 h-3.5 ${mode === 'live' ? '' : 'text-emerald-400 animate-pulse'}`} />
              <span>Live Feed</span>
            </button>
          </div>

          {/* UTC / IST Digital Clock */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">{timeUtc || '--:--:-- UTC'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300">{timeIst || '--:--:-- IST'}</span>
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-xl shadow-inner">
            <Globe2 className="w-4 h-4 text-slate-400 ml-1.5 mr-1 shrink-0" />
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected =
                currentLanguage === lang.code ||
                (lang.code === 'odia' && currentLanguage === 'or') ||
                (lang.code === 'or' && currentLanguage === 'odia') ||
                (lang.code === 'bengali' && currentLanguage === 'bn') ||
                (lang.code === 'bn' && currentLanguage === 'bengali') ||
                (lang.code === 'hindi' && currentLanguage === 'hi') ||
                (lang.code === 'hi' && currentLanguage === 'hindi') ||
                (lang.code === 'telugu' && currentLanguage === 'te') ||
                (lang.code === 'te' && currentLanguage === 'telugu') ||
                (lang.code === 'tamil' && currentLanguage === 'ta') ||
                (lang.code === 'ta' && currentLanguage === 'tamil') ||
                (lang.code === 'english' && currentLanguage === 'en') ||
                (lang.code === 'en' && currentLanguage === 'english');

              return (
                <button
                  key={lang.code}
                  id={`lang-btn-${lang.code}`}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 scale-105 border border-cyan-300 ring-2 ring-cyan-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title={`${lang.name} (${lang.nativeName})`}
                >
                  {lang.nativeName}
                </button>
              );
            })}
          </div>

          {/* Citizen Damage Report Button */}
          <button
            id="report-damage-btn"
            onClick={() => setShowReportDamage(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-400 transition-all duration-200 cursor-pointer shadow-sm"
            title="Submit Citizen Cyclone Damage Photo"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Report Damage</span>
          </button>

          {/* Google Firebase Auth */}
          <SignInButton />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowApacModal(false)}
        >
          <div
            className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Globe2 className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                      APAC REGIONAL EXPANSION — PHASE 2
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Multi-Basin Architecture
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Demonstrating global multi-hazard scalability beyond India across high-vulnerability Asia-Pacific coastal basins.
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

            {/* Expansion Target Countries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* 1. Bangladesh */}
              <div className="bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-3.5 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇧🇩</span>
                    <span className="font-bold text-slate-200 text-sm font-mono">Bangladesh</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Phase 2 Expansion
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  <strong>Delta Corridor:</strong> Chittagong, Cox&apos;s Bazar, Khulna, Sundarbans. Extreme storm surge amplification zone.
                </p>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span>BMD Feed Ingest</span>
                  <span>•</span>
                  <span>CPP Cyclone Shelters</span>
                </div>
              </div>

              {/* 2. Sri Lanka */}
              <div className="bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3.5 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇱🇰</span>
                    <span className="font-bold text-slate-200 text-sm font-mono">Sri Lanka</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Phase 2 Expansion
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  <strong>Coastal Zone:</strong> Northern &amp; Eastern Provinces (Jaffna, Trincomalee, Batticaloa). High inter-monsoon vulnerability.
                </p>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span>DMC Advisory API</span>
                  <span>•</span>
                  <span>Tamil &amp; Sinhala Alerting</span>
                </div>
              </div>

              {/* 3. Myanmar */}
              <div className="bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 rounded-xl p-3.5 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇲🇲</span>
                    <span className="font-bold text-slate-200 text-sm font-mono">Myanmar</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Phase 2 Expansion
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  <strong>Delta &amp; Coast:</strong> Rakhine State &amp; Ayeyarwady Delta (Sittwe, Pathein). Nargis/Mocha exposure corridor.
                </p>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span>DMH Early Warning</span>
                  <span>•</span>
                  <span>GEE SAR Flood Mapping</span>
                </div>
              </div>

              {/* 4. Philippines */}
              <div className="bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇵🇭</span>
                    <span className="font-bold text-slate-200 text-sm font-mono">Philippines</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Phase 2 Expansion
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  <strong>Typhoon Belt:</strong> Eastern Visayas &amp; Luzon (Tacloban, Bicol). Western Pacific multi-typhoon basin integration.
                </p>
                <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span>PAGASA Radar Sync</span>
                  <span>•</span>
                  <span>JTWC Dual-Basin TrackLSTM</span>
                </div>
              </div>
            </div>

            {/* Architecture Highlights Footer */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Standardized Common Alerting Protocol (CAP v1.2) &amp; WMO RSMC Integration</span>
              </div>
              <button
                onClick={() => setShowApacModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
