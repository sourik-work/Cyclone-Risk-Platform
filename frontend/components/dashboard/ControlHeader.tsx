'use client';

import React, { useEffect, useState } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../map/types';
import { ShieldAlert, Globe2, Activity } from 'lucide-react';

interface ControlHeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  stormStatus: string;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  stormStatus,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeIst, setTimeIst] = useState<string>('');

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
    <header className="w-full bg-[#090e17] border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Platform Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono">
              CYCLONE RISK & ANTICIPATORY PLATFORM
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              {stormStatus || 'ACTIVE ADVISORY'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Bay of Bengal Predictive Vulnerability & Pre-Landfall Evacuation Engine
          </p>
        </div>
      </div>

      {/* Clock & Language Controls */}
      <div className="flex items-center gap-4">
        {/* UTC / IST Digital Clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs text-slate-300">
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
      </div>
    </header>
  );
};
