'use client';

import React, { useState } from 'react';
import { Database, Info, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export interface DataProvenanceProps {
  source: string;
  timestamp?: string;
  resolution?: string;
  groundTruthCheck?: string;
  className?: string;
  compact?: boolean;
}

export const DataProvenanceBadge: React.FC<DataProvenanceProps> = ({
  source,
  timestamp = 'Live / Current Forecast Cycle',
  resolution = '10m - 100m Gridded',
  groundTruthCheck,
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (compact) {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 hover:text-cyan-300 transition-colors bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]"
          title="View data provenance"
        >
          <Database className="w-2.5 h-2.5 text-cyan-400" />
          <span>Provenance</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 bottom-full mb-1.5 z-50 w-64 p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 shadow-2xl text-[10px] font-mono space-y-1.5 animate-fadeIn backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-1 text-cyan-300 font-bold">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-400" /> Data Provenance
              </span>
              <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1 py-0.2 rounded border border-cyan-800">
                VERIFIED
              </span>
            </div>
            <div className="space-y-1 text-slate-300">
              <div className="flex items-start gap-1.5">
                <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span><strong>Source:</strong> {source}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Clock className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span><strong>Updated:</strong> {timestamp}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span><strong>Resolution:</strong> {resolution}</span>
              </div>
              {groundTruthCheck && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-white/[0.06] text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{groundTruthCheck}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-white/[0.05] ${className}`}
    >
      <div className="flex items-center gap-1.5 truncate">
        <Database className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="truncate text-slate-300"><strong className="text-slate-400">Source:</strong> {source}</span>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-slate-500 shrink-0">
        <span>Res: {resolution}</span>
        <span>•</span>
        <span className="text-cyan-400/80">{timestamp}</span>
      </div>
    </div>
  );
};
