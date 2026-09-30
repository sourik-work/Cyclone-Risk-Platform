'use client';

import React, { useState, useEffect } from 'react';
import { AccordionPanel } from './DashboardAccordion';
import {
  BellRing,
  Radio,
  Smartphone,
  Mail,
  FileCode,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building,
  Users,
  Clock,
  RefreshCw,
  PhoneCall,
  Check,
  X,
} from 'lucide-react';
import { getBackendUrl } from '../../lib/config';

interface AlertSubscriptionProps {
  currentState?: string;
}

interface RecipientAuthority {
  id: string;
  name: string;
  category: string;
  recipientCount: number;
  selected: boolean;
}

interface DispatchLogEntry {
  id: string;
  timestamp: string;
  authorities: string[];
  channels: string[];
  status: 'DELIVERED' | 'DISPATCHED' | 'ACKNOWLEDGED';
  ackPct: number;
  latencyMs: number;
}

const INITIAL_AUTHORITIES: RecipientAuthority[] = [
  { id: 'odraf-seoc', name: 'ODRAF State Emergency Operations Center (SEOC)', category: 'Emergency Response', recipientCount: 142, selected: true },
  { id: 'ndrf-04', name: 'NDRF 04 Battalion Coastal Command (Mundali)', category: 'Disaster Force', recipientCount: 88, selected: true },
  { id: 'optcl-grid', name: 'OPTCL / DISCOM Power Grid Dispatch & Substation Ops', category: 'Energy Lifelines', recipientCount: 215, selected: true },
  { id: 'collector-puri', name: 'District Collectorate Puri & Jagatsinghpur Control Room', category: 'Civil Administration', recipientCount: 64, selected: true },
  { id: 'fisheries-dept', name: 'Directorate of Fisheries (Coastal Marine Fleet Broadcast)', category: 'Maritime & Fishing', recipientCount: 18400, selected: true },
  { id: 'shelter-sarpanch', name: 'Cyclone Shelter Management & Coastal Sarpanch Net', category: 'Grassroots First Responders', recipientCount: 847, selected: true },
];

export const AlertSubscription: React.FC<AlertSubscriptionProps> = ({
  currentState = 'Odisha',
}) => {
  const [authorities, setAuthorities] = useState<RecipientAuthority[]>(INITIAL_AUTHORITIES);
  const [channels, setChannels] = useState<{ [key: string]: boolean }>({
    sms: true,
    cap: true,
    radio: true,
    ivr: false,
    email: true,
  });

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [dispatcherId, setDispatcherId] = useState<string>('DISP-OD-9402 (Senior Controller)');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchStage, setDispatchStage] = useState<'idle' | 'queued' | 'handshake' | 'broadcasting' | 'complete'>('idle');
  const [activeDispatchLogs, setActiveDispatchLogs] = useState<DispatchLogEntry[]>([
    {
      id: 'DISP-2026-8921',
      timestamp: '14 min ago',
      authorities: ['ODRAF SEOC', 'OPTCL Power Grid', 'Puri Collectorate'],
      channels: ['SMS', 'CAP v1.2', 'Radio'],
      status: 'ACKNOWLEDGED',
      ackPct: 98.4,
      latencyMs: 380,
    },
    {
      id: 'DISP-2026-8919',
      timestamp: '1h 05m ago',
      authorities: ['NDRF 04 Battalion', 'Fisheries Marine Fleet'],
      channels: ['CAP v1.2', 'SMS'],
      status: 'DELIVERED',
      ackPct: 95.1,
      latencyMs: 410,
    },
  ]);

  const toggleAuthority = (id: string) => {
    setAuthorities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const toggleChannel = (key: string) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalRecipients = authorities
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.recipientCount, 0);

  const selectedChannelsList = Object.entries(channels)
    .filter(([_, v]) => v)
    .map(([k]) => k.toUpperCase());

  const handleExecuteDispatch = async () => {
    setIsDispatching(true);
    setDispatchStage('queued');

    // Realistic pipeline stage stepping
    await new Promise((r) => setTimeout(r, 600));
    setDispatchStage('handshake');
    await new Promise((r) => setTimeout(r, 700));
    setDispatchStage('broadcasting');
    await new Promise((r) => setTimeout(r, 900));
    setDispatchStage('complete');

    const newLog: DispatchLogEntry = {
      id: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      authorities: authorities.filter((a) => a.selected).map((a) => a.name.split(' ')[0] + ' ' + a.name.split(' ')[1]),
      channels: selectedChannelsList,
      status: 'ACKNOWLEDGED',
      ackPct: 99.2,
      latencyMs: 340,
    };

    setActiveDispatchLogs((prev) => [newLog, ...prev]);

    setTimeout(() => {
      setIsDispatching(false);
      setIsApprovalModalOpen(false);
      setDispatchStage('idle');
    }, 1200);
  };

  return (
    <AccordionPanel id="emergency-push-alerts" title="Emergency Alerting & Dispatch Pipeline">
      <div
        id="operational-alert-dispatch-card"
        className="card-glass p-4 space-y-4 text-slate-200 text-xs"
      >
        {/* Header with Sandboxed Mode Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-slate-100 uppercase tracking-wide text-[11px]">
                Multi-Channel Emergency Alert Pipeline
              </h3>
              <p className="text-[10px] text-slate-400">Target Region: <strong className="text-slate-300">{currentState}</strong></p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            SANDBOXED OPERATIONAL PIPELINE
          </span>
        </div>

        {/* 1. Recipient Authority Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              Designated Authority Recipient Directory
            </span>
            <span className="text-cyan-400 text-[10px]">
              {totalRecipients.toLocaleString()} endpoints selected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {authorities.map((auth) => (
              <button
                key={auth.id}
                type="button"
                onClick={() => toggleAuthority(auth.id)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors ${
                  auth.selected
                    ? 'bg-slate-800/90 border-cyan-500/40 text-slate-200'
                    : 'bg-slate-950/50 border-white/[0.04] text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      auth.selected
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'border-slate-600'
                    }`}
                  >
                    {auth.selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="truncate text-[11px] font-medium">{auth.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                  {auth.recipientCount} units
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Multi-Channel Distribution Protocols */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <span className="block text-[11px] font-mono text-slate-300 font-bold">
            Supported Protocol Channels
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => toggleChannel('sms')}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                channels.sms ? 'bg-blue-600/25 border-blue-500/50 text-blue-200' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Cell</span>
            </button>

            <button
              type="button"
              onClick={() => toggleChannel('cap')}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                channels.cap ? 'bg-purple-600/25 border-purple-500/50 text-purple-200' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>CAP v1.2</span>
            </button>

            <button
              type="button"
              onClick={() => toggleChannel('radio')}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                channels.radio ? 'bg-amber-600/25 border-amber-500/50 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>AIR Radio</span>
            </button>

            <button
              type="button"
              onClick={() => toggleChannel('ivr')}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                channels.ivr ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>IVR Voice</span>
            </button>

            <button
              type="button"
              onClick={() => toggleChannel('email')}
              className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${
                channels.email ? 'bg-rose-600/25 border-rose-500/50 text-rose-200' : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>SEOC Mail</span>
            </button>
          </div>
        </div>

        {/* 3. Human-In-The-Loop Approval Action */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setIsApprovalModalOpen(true)}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Review &amp; Authorize Emergency Dispatch</span>
          </button>
        </div>

        {/* 4. Real-time Sandboxed Audit Dispatch Trail */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">Live Dispatch Audit Trail (Sandboxed Log)</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACK Gateway Active
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[10px] font-mono">
            {activeDispatchLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-950/70 border border-white/[0.05] flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="font-bold text-cyan-400">{log.id}</span>
                    <span>•</span>
                    <span className="text-slate-400 truncate max-w-[160px]">{log.authorities.join(', ')}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Via {log.channels.join(' + ')} · {log.timestamp}
                  </div>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    {log.ackPct}% ACK
                  </span>
                  <div className="text-[9px] text-slate-500">{log.latencyMs}ms latency</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HUMAN-IN-THE-LOOP APPROVAL MODAL */}
        {isApprovalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-red-500/40 shadow-2xl p-6 text-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Human-In-The-Loop Dispatch Authorization</span>
                </div>
                {!isDispatching && (
                  <button
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs space-y-2">
                <p className="text-red-200 font-semibold">
                  You are authorizing an emergency anticipatory alert broadcast for {currentState}.
                </p>
                <div className="font-mono text-[11px] text-slate-300 space-y-1">
                  <div><strong>Recipients:</strong> {totalRecipients.toLocaleString()} field endpoints</div>
                  <div><strong>Selected Channels:</strong> {selectedChannelsList.join(', ')}</div>
                  <div><strong>Authorized Controller:</strong> {dispatcherId}</div>
                </div>
              </div>

              {/* Real-time Stage Progression Display */}
              {isDispatching && (
                <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-xs space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>
                      {dispatchStage === 'queued' && 'Stage 1/4: Cryptographic Payload Signing...'}
                      {dispatchStage === 'handshake' && 'Stage 2/4: Handshaking with CAP v1.2 Gateway & Telecom Nodes...'}
                      {dispatchStage === 'broadcasting' && 'Stage 3/4: Multi-Channel Broadcast in Transit (Cell Broadcast + Sirens)...'}
                      {dispatchStage === 'complete' && 'Stage 4/4: Dispatched! Receiving Telemetry Acknowledgment Receipts...'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-500"
                      style={{
                        width:
                          dispatchStage === 'queued'
                            ? '25%'
                            : dispatchStage === 'handshake'
                            ? '55%'
                            : dispatchStage === 'broadcasting'
                            ? '85%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {!isDispatching && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteDispatch}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Broadcast Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AccordionPanel>
  );
};
