'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuthHeader } from '../../lib/api';

export interface AuditEventItem {
  event_type: string;
  timestamp?: string | null;
  actor?: string | null;
  resource_id?: string | null;
  reason?: string | null;
  headline?: string | null;
}

interface AuditLogResponse {
  events: AuditEventItem[];
  total: number;
}

export interface AuditLogPanelProps {
  className?: string;
}

const eventTypeStyles: Record<string, string> = {
  GENERATED: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  DRAFT: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  PENDING_APPROVAL: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  ADVISORY_EVENT: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  INSURANCE_APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  DISPATCHED: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  INSURANCE_TRIGGERED: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  INSURANCE_EVENT: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  INSURANCE: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

export function formatRelativeTime(timestamp?: string | null): string {
  if (!timestamp) return 'just now';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'just now';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 0) return 'just now';
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'just now';
  }
}

export function truncateId(id?: string | null): string {
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ className }) => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const fetchAuditEvents = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const authHeader = await getAuthHeader();
      const res = await fetch(`${backendUrl}/api/audit/recent?limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      if (res.ok) {
        const data: AuditLogResponse = await res.json();
        setEvents(data.events || []);
      } else {
        console.warn('Audit events fetch returned status:', res.status);
      }
    } catch (err) {
      console.warn('Failed to fetch audit events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditEvents();
  }, [fetchAuditEvents]);

  return (
    <div
      id="audit-log-panel"
      className={`card-glass rounded-2xl p-4 transition-all duration-300 select-none ${className || ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div
          className="flex items-center gap-2 cursor-pointer select-none group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm">📋</span>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary group-hover:text-cyan-400 transition-colors">
            AUDIT LOG
          </h3>
          <span
            id="audit-log-count-badge"
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/10"
          >
            {events.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="btn-refresh-audit-log"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchAuditEvents();
            }}
            disabled={loading}
            title="Refresh audit log"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            id="btn-toggle-audit-log"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsed State */}
      {!isExpanded ? (
        <div
          id="audit-log-collapsed-summary"
          onClick={() => setIsExpanded(true)}
          className="pt-2.5 flex items-center justify-between text-xs text-text-secondary cursor-pointer hover:text-text-primary transition-colors font-mono"
        >
          <span className="text-[11px]">
            {events.length} recent {events.length === 1 ? 'event' : 'events'} · Click to expand
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
        </div>
      ) : (
        /* Expanded State */
        <div id="audit-log-expanded-list" className="pt-2.5 space-y-1">
          <div
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-between pb-1.5 text-[10px] text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors font-mono"
          >
            <span>Showing last {Math.min(events.length, 20)} events · Click to collapse</span>
            <ChevronUp className="w-3 h-3" />
          </div>

          {events.length === 0 ? (
            <div className="py-4 text-center text-xs text-text-tertiary font-mono">
              No events yet. Generate an advisory to see activity.
            </div>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {events.slice(0, 20).map((event, idx) => (
                <div
                  key={event.resource_id ? `${event.resource_id}-${idx}` : idx}
                  className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${
                      eventTypeStyles[event.event_type] ||
                      'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}
                  >
                    {event.event_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-primary truncate">
                      {event.headline || event.reason || truncateId(event.resource_id) || 'System event'}
                    </div>
                    <div className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{formatRelativeTime(event.timestamp)}</span>
                      <span>·</span>
                      <span className="truncate max-w-[120px]">{event.actor || 'system'}</span>
                      {event.resource_id && (
                        <span className="font-mono text-[9px] text-slate-400 opacity-80">
                          ({truncateId(event.resource_id)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogPanel;
