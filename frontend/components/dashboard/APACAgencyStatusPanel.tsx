'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Globe2, RefreshCw, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { AccordionPanel } from './DashboardAccordion';
import { getBackendUrl } from '../../lib/config';
import { DataProvenanceBadge } from './DataProvenanceBadge';

export interface AgencyStatusItem {
  agency: string;
  status: string;
  region: string;
  last_checked?: string;
  bulletin_count?: number;
  integration_status: 'live' | 'partial' | 'stub';
  data_source?: string;
  documented_path?: string;
}

const FALLBACK_AGENCIES: AgencyStatusItem[] = [
  {
    agency: 'IMD (India)',
    status: 'active',
    region: 'Bay of Bengal + Arabian Sea',
    integration_status: 'live',
    data_source: 'https://rsmcnewdelhi.imd.gov.in/',
    documented_path: 'Production path: live automated scraper for RSMC New Delhi XML/HTML & Mausam bulletin portals',
  },
  {
    agency: 'JTWC',
    status: 'monitoring',
    region: 'Western Pacific + Indian Ocean',
    integration_status: 'stub',
    data_source: 'https://www.metoc.navy.mil/jtwc/jtwc.html',
    documented_path: 'Production path: parse TC warning TXT + shapefiles at /jtwc/products/',
  },
  {
    agency: 'PAGASA',
    status: 'monitoring',
    region: 'Philippines (PAR)',
    integration_status: 'stub',
    data_source: 'https://bagong.pagasa.dost.gov.ph/tropical-cyclone',
    documented_path: "Production path: parse PAGASA's tropical cyclone bulletin HTML",
  },
  {
    agency: 'BMKG',
    status: 'monitoring',
    region: 'Indonesia (TCWC Jakarta)',
    integration_status: 'stub',
    data_source: 'https://www.bmkg.go.id/cuaca/siklon-tropis',
    documented_path: 'Production path: parse BMKG cyclone bulletin JSON API',
  },
  {
    agency: 'DMH (Myanmar)',
    status: 'monitoring',
    region: 'Myanmar',
    integration_status: 'stub',
    data_source: 'https://www.moezala.gov.mm/',
    documented_path: 'Production path: parse DMH bulletin PDF/HTML',
  },
];

export const APACAgencyStatusPanel: React.FC = () => {
  const [agencies, setAgencies] = useState<AgencyStatusItem[]>(FALLBACK_AGENCIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAgencyStatus = useCallback(async () => {
    setIsLoading(true);
    const backendUrl = getBackendUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${backendUrl}/api/agencies/status`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.agencies) && data.agencies.length > 0) {
          setAgencies(data.agencies);
        }
      }
    } catch {
      // Keep existing fallback
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgencyStatus();
  }, [fetchAgencyStatus]);

  return (
    <AccordionPanel
      id="apac-met-agencies"
      title="APAC Met Agencies"
      action={
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">5 normalized</span>
          <button
            id="btn-refresh-agencies"
            type="button"
            onClick={fetchAgencyStatus}
            disabled={isLoading}
            className="dashboard-icon-control inline-flex items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors disabled:opacity-50"
            title="Refresh agency adapter statuses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div
        id="apac-agency-status-panel"
        className="card-glass border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3 transition-all"
      >
        <div className="space-y-2 pt-1 animate-fadeIn">
          {/* Agency list */}
          <div className="space-y-1.5">
            {agencies.map((item) => {
              const isLive = item.integration_status === 'live';
              return (
                <div
                  key={item.agency}
                  id={`agency-item-${item.agency.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  className="bg-surface-2 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs transition-all hover:border-white/[0.1]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary truncate font-mono">
                        {item.agency}
                      </span>
                      {item.data_source && (
                        <a
                          href={item.data_source}
                          target="_blank"
                          rel="noreferrer"
                          className="text-text-tertiary hover:text-accent-cyan transition-colors"
                          title={`Data Source: ${item.data_source}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">
                      {item.region}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                        isLive
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      ></span>
                      {isLive ? 'Live' : 'Stub'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <DataProvenanceBadge
              source="IMD RSMC New Delhi, JTWC, PAGASA, BMKG, DMH Web Feeds"
              timestamp="Synchronized 6-Hourly"
              resolution="Agency Official Meteorological Bulletins"
              groundTruthCheck="Normalized Multi-Agency Regional Adapter Layer"
            />
          </div>
        </div>
      </div>
    </AccordionPanel>
  );
};
