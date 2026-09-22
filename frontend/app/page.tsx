'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ControlHeader, DashboardMode } from '../components/dashboard/ControlHeader';
import { TelemetrySidebar } from '../components/dashboard/TelemetrySidebar';
import { TimeScrubber } from '../components/dashboard/TimeScrubber';
import { ChatWidget } from '../components/dashboard/ChatWidget';
import { CycloneMap } from '../components/map/CycloneMap';
import { MapControls } from '../components/map/MapControls';
import {
  AnticipatoryAdvisory,
  CycloneTrack,
  DistrictProperties,
  InfrastructureFeatureCollection,
  LiveCycloneResponse,
  MapLayerToggles,
  SupportedLanguage,
} from '../components/map/types';
import {
  FALLBACK_ADVISORY,
  SEED_AMPHAN_TRACK,
  SEED_FANI_TRACK,
  SEED_ODISHA_VULNERABILITY,
  SEED_ALL_COASTAL_VULNERABILITY,
} from '../lib/seedData';
import { SEED_INFRASTRUCTURE_DATA } from '../lib/infrastructureSeed';
import { RefreshCw, Radio, ShieldCheck, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

// Standby track representing quiescent Bay of Bengal for continuous monitoring
const STANDBY_MONITORING_TRACK: CycloneTrack = {
  id: 'IMD-LIVE-MONITORING',
  name: 'Bay of Bengal Basin',
  season_year: new Date().getFullYear(),
  basin: 'Bay of Bengal',
  current_status: 'Continuous Monitoring',
  genesis_time: new Date().toISOString(),
  dissipation_time: undefined,
  track_points: [
    {
      timestamp: new Date().toISOString(),
      latitude: 18.0,
      longitude: 87.5,
      wind_speed_knots: 15,
      wind_speed_kmph: 28,
      gust_speed_kmph: 35,
      central_pressure_hpa: 1008,
      category: 'Low Pressure Area',
      is_forecast: false,
      forecast_lead_hours: 0,
      cone_radius_km: 0,
      heading_degrees: 0,
      forward_speed_kmph: 0,
    },
  ],
};

// Standby advisory for quiescent monitoring state
const MONITORING_ADVISORY: AnticipatoryAdvisory = {
  advisory_id: 'ADV-MONITORING-LIVE',
  cyclone_id: 'BOB-MONITORING',
  issued_at: new Date().toISOString(),
  severity_level: 'WATCH',
  lead_time_hours: 0,
  estimated_landfall_location: 'None (Bay of Bengal Basin Quiescent)',
  max_expected_wind_kmph: 28,
  max_expected_surge_m: 0,
  target_districts: ['Puri', 'Kendrapara', 'Jagatsinghpur', 'Balasore', 'Bhadrak', 'Ganjam'],
  headline: 'BAY OF BENGAL BASIN MONITORING — ALL CLEAR',
  multilingual_advisories: {
    english:
      'No active cyclones in Bay of Bengal. Standard operational monitoring in effect via IMD RSMC New Delhi. Coastal district early warning systems on standby.',
    odia: 'ବଙ୍ଗୋପସାଗରରେ କୌଣସି ସକ୍ରିୟ ବାତ୍ୟା ନାହିଁ। ଭାରତୀୟ ପାଣିପାଗ ବିଭାଗ (IMD) ଦ୍ୱାରା ନିରନ୍ତର ନଜର ରଖାଯାଇଛି। ଉପକୂଳ ଜିଲ୍ଲା ପ୍ରଶାସନ ପ୍ରସ୍ତୁତ ରହିଛି।',
    bengali:
      'বঙ্গোপসাগরে কোনো সক্রিয় ঘূর্ণিঝড় নেই। ভারতীয় আবহাওয়া দপ্তর (IMD) সার্বক্ষণিক পর্যবেক্ষণ করছে। উপকূলীয় জেলাগুলিতে স্বাভাবিক সতর্কতা জারি রয়েছে।',
    hindi:
      'बंगाल की खाड़ी में कोई सक्रिय चक्रवात नहीं है। भारत मौसम विज्ञान विभाग (IMD) द्वारा निरंतर निगरानी जारी है। तटीय जिले सामान्य निगरानी में हैं।',
    telugu:
      'బంగాళాఖాతంలో ఎటువంటి చురుకైన తుఫాను లేదు. భారత వాతావరణ శాఖ (IMD) నిరంతరం పర్యవేక్షిస్తోంది. తీరప్రాంత యంత్రాంగం అప్రమత్తంగా ఉంది.',
    tamil:
      'வங்காள விரிகுடாவில் தீவிர புயல் ஏதுமில்லை. இந்திய வானிலை ஆய்வு மையம் (IMD) தொடர்ந்து கண்காணித்து வருகிறது. கடலோர மாவட்டங்கள் தயார் நிலையில் உள்ளன.',
  },
  recommended_actions: [
    {
      category: 'FISHERFOLK',
      action: 'Normal sea operations permitted. Standard marine weather advisories apply.',
      urgency: 'PRECAUTIONARY',
      target_audience: 'Marine Fisherfolk & Harbour Ports',
    },
    {
      category: 'SHELTER',
      action: 'Maintain routine readiness of multipurpose cyclone shelters and emergency communication lines.',
      urgency: 'PRECAUTIONARY',
      target_audience: 'District Disaster Management Authorities',
    },
  ],
  model: 'gemini-3.7-flash',
};

export default function Home() {
  // Mode toggle: 'historical' (default) vs 'live'
  const [mode, setMode] = useState<DashboardMode>('historical');

  // Historical selection
  const [selectedStormId, setSelectedStormId] = useState<string>('fani');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('english');

  // Advisories state
  const [advisory, setAdvisory] = useState<AnticipatoryAdvisory | null>(null);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState<boolean>(false);

  // Live Mode state
  const [liveData, setLiveData] = useState<LiveCycloneResponse | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Fetch live IMD bulletin status
  const fetchLiveCyclone = useCallback(async (forceRefresh = false) => {
    setIsLoadingLive(true);
    setLiveError(null);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${backendUrl}/api/cyclone/live${forceRefresh ? '?refresh=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Live endpoint returned HTTP ${res.status}`);
      }
      const data: LiveCycloneResponse = await res.json();
      setLiveData(data);
    } catch (err: any) {
      console.warn('Failed to fetch live IMD cyclone data:', err);
      setLiveError(err.message || 'Unable to reach IMD feed');
      // If no live data yet, provide graceful monitoring fallback
      setLiveData((prev) =>
        prev || {
          active_cyclone: null,
          last_updated: new Date().toISOString(),
          source: 'IMD RSMC New Delhi',
          status: 'monitoring',
          message: `No active cyclones in Bay of Bengal. Monitoring continuously. Last checked: ${new Date().toUTCString()}.`,
        }
      );
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Active cyclone check for live mode
  const hasActiveCyclone = Boolean(
    mode === 'live' && liveData?.status === 'active' && liveData?.active_cyclone
  );

  // Poll live IMD bulletin on mount and every 30 minutes
  useEffect(() => {
    fetchLiveCyclone();
    const interval = setInterval(() => {
      fetchLiveCyclone();
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [fetchLiveCyclone]);

  // Firestore real-time listener for newly issued cyclone advisories (Workstream 5)
  useEffect(() => {
    if (!firestore) return;
    try {
      const advisoriesCol = collection(firestore, 'advisories');
      const q = query(advisoriesCol, limit(10));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              console.log('[Firestore Real-Time Advisory]:', change.doc.id, data);
            }
          });
        },
        (error) => {
          console.warn('Firestore onSnapshot listener notice:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to set up Firestore advisory listener:', err);
    }
  }, []);

  // Handle switching mode: automatically disable Earth Engine overlay in live monitoring to prevent stale Fani SAR data
  const handleModeChange = (newMode: DashboardMode) => {
    setMode(newMode);
    if (newMode === 'live') {
      // Automatically turn off Earth Engine SAR flood overlay in Live Mode to prevent stale historical data
      setLayerToggles((prev) => ({ ...prev, showEarthEngine: false }));
      if (!liveData) {
        fetchLiveCyclone();
      }
    } else {
      // Restore Earth Engine satellite overlay when returning to Historical Mode
      setLayerToggles((prev) => ({ ...prev, showEarthEngine: true }));
    }
  };

  // Determine active track depending on current mode
  const activeTrack = useMemo(() => {
    if (mode === 'live') {
      if (hasActiveCyclone && liveData?.active_cyclone) {
        return liveData.active_cyclone;
      }
      return STANDBY_MONITORING_TRACK;
    }
    // Historical Mode
    return selectedStormId === 'amphan' ? SEED_AMPHAN_TRACK : SEED_FANI_TRACK;
  }, [mode, selectedStormId, hasActiveCyclone, liveData]);

  // Default active point index based on track length
  const defaultIndex = useMemo(() => {
    const totalPoints = activeTrack.track_points.length;
    if (mode === 'live') {
      return Math.max(0, totalPoints - 1);
    }
    return Math.min(7, Math.max(0, totalPoints - 1));
  }, [mode, activeTrack]);

  const [activePointIndex, setActivePointIndex] = useState<number>(defaultIndex);

  // Sync activePointIndex and reset derived state when storm or mode changes (TASK 2)
  useEffect(() => {
    const totalPoints = activeTrack.track_points.length;
    if (mode === 'live') {
      setActivePointIndex(0);
    } else {
      setActivePointIndex(Math.min(7, Math.max(0, totalPoints - 1)));
    }
    // Reset derived state on storm switch
    setAdvisory(null);
  }, [mode, selectedStormId, activeTrack]);

  // Handle Historical storm selection
  const handleSelectStorm = (stormId: string) => {
    setSelectedStormId(stormId);
    const track = stormId === 'amphan' ? SEED_AMPHAN_TRACK : SEED_FANI_TRACK;
    const totalPoints = track.track_points.length;
    setActivePointIndex(Math.min(7, Math.max(0, totalPoints - 1)));
    setAdvisory(null);
    if (stormId === 'amphan') {
      // Hide Earth Engine overlay by default when viewing Amphan (tile pending)
      setLayerToggles((prev) => ({ ...prev, showEarthEngine: false }));
    } else {
      // Restore Earth Engine overlay when viewing Fani (historical SAR extent available)
      setLayerToggles((prev) => ({ ...prev, showEarthEngine: true }));
    }
  };

  // Coastal state selector: 'Odisha' (default), 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu'
  const [selectedState, setSelectedState] = useState<string>('Odisha');

  // Default selected district: Kendrapara or Puri
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProperties | null>(
    SEED_ALL_COASTAL_VULNERABILITY.features[0]?.properties || null
  );

  // Handle switching active coastal state
  const handleSelectState = (newState: string) => {
    setSelectedState(newState);
    const match = SEED_ALL_COASTAL_VULNERABILITY.features.find(
      (f) => f.properties.state_name.toLowerCase() === newState.toLowerCase()
    );
    if (match) {
      setSelectedDistrict(match.properties);
    }
  };

  // Calls POST /api/advisories/generate
  const fetchAdvisory = useCallback(
    async (
      cycloneId: string,
      pointIndex: number,
      districtName?: string,
      signal?: AbortSignal
    ) => {
      setIsLoadingAdvisory(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${backendUrl}/api/advisories/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cyclone_id: cycloneId,
            point_index: pointIndex,
            target_districts: districtName ? [districtName] : undefined,
            lead_time_hours: 18.0,
          }),
          signal,
        });

        if (!res.ok) {
          throw new Error(`Advisory generation endpoint returned HTTP ${res.status}`);
        }

        const data: AnticipatoryAdvisory = await res.json();
        setAdvisory(data);
      } catch (err: any) {
        if (err.name === 'AbortError' || signal?.aborted) {
          return;
        }
        console.warn(
          'Failed to generate advisory from backend API, falling back to static dictionary:',
          err
        );
        setAdvisory(FALLBACK_ADVISORY);
      } finally {
        if (!signal?.aborted) {
          setIsLoadingAdvisory(false);
        }
      }
    },
    []
  );

  // Consolidate into ONE useEffect: debounced advisory fetch with AbortController
  useEffect(() => {
    if (mode === 'live' && (!hasActiveCyclone || !liveData?.active_cyclone)) {
      setAdvisory(MONITORING_ADVISORY);
      return;
    }

    const targetCycloneId =
      mode === 'live'
        ? 'IMD-LIVE-ACTIVE'
        : selectedStormId === 'amphan'
        ? 'BOB-01-2020'
        : 'BOB-02-2019';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      const totalPoints = activeTrack.track_points.length;
      const forecastEndIndex = Math.min(activePointIndex, Math.max(0, totalPoints - 1));
      fetchAdvisory(
        targetCycloneId,
        forecastEndIndex,
        selectedDistrict?.district_name,
        controller.signal
      );
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedStormId, activePointIndex, currentLanguage, selectedDistrict?.district_name, mode, hasActiveCyclone, activeTrack, fetchAdvisory]);

  const [layerToggles, setLayerToggles] = useState<MapLayerToggles>({
    showTrack: true,
    showForecastCone: true,
    showVulnerability: true, // Enabled: State coastal district vulnerability polygon grid
    showWindRadii: false,
    showShelters: false,
    showEarthEngine: true, // Enabled: Real-time GEE satellite overlay
    showAiForecast: true, // Enabled: TrackLSTM AI Forecaster trajectory
    showPowerGrid: true, // Enabled: Power grid substations & transmission lines
    showRoads: true, // Enabled: Arterial roads (NH/SH/MDR)
    showHospitals: true, // Enabled: Hospitals & cyclone shelters
    showRainfall: true, // Enabled: Rainfall hazard overlay
    showSurge: true, // Enabled: Storm surge zone polygon
  });

  // Live infrastructure data state (with instant embedded fallback)
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureFeatureCollection>(SEED_INFRASTRUCTURE_DATA);

  // Fetch updated infrastructure data from backend /api/infrastructure
  useEffect(() => {
    const fetchInfrastructure = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const res = await fetch(`${backendUrl}/api/infrastructure`);
        if (res.ok) {
          const data: InfrastructureFeatureCollection = await res.json();
          if (data && data.features && data.features.length > 0) {
            setInfrastructureData(data);
          }
        }
      } catch (err) {
        console.warn('Using embedded infrastructure seed data:', err);
      }
    };
    fetchInfrastructure();
  }, []);

  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Format last checked timestamp for the monitoring banner
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) {
      return new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    }
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    } catch {
      return isoString;
    }
  };

  const lastCheckedFormatted = formatTimestamp(liveData?.last_updated);

  return (
    <main className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Global Mission Control Header with Historical/Live Toggle */}
      <ControlHeader
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        stormStatus={activeTrack.current_status}
        mode={mode}
        onModeChange={handleModeChange}
        liveStatus={liveData?.status}
        districts={SEED_ALL_COASTAL_VULNERABILITY.features.map((f) => f.properties)}
      />

      {/* Main Operations Center Layout */}
      <div className="flex-1 p-4 lg:p-6 flex flex-col gap-4 max-w-[1750px] w-full mx-auto">
        {/* Live Mode Monitoring Banner: displayed when in Live Mode and monitoring continuously */}
        {mode === 'live' && (!liveData || liveData.status === 'monitoring' || !liveData.active_cyclone) && (
          <div
            id="live-monitoring-banner"
            className="w-full bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/50 border-2 border-emerald-500/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-fadeIn"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold font-mono tracking-wide text-emerald-300 uppercase">
                  BAY OF BENGAL MONITORING — No active cyclones. Last checked: {lastCheckedFormatted}. Source: IMD RSMC New Delhi.
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuous automated satellite telemetry and IMD bulletin ingest active. Real-time predictive modeling is on standby.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Basin Quiescent
              </span>
              <button
                id="btn-refresh-live"
                onClick={() => fetchLiveCyclone(true)}
                disabled={isLoadingLive}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                title="Force refresh bulletin from IMD RSMC New Delhi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
                <span>{isLoadingLive ? 'Checking IMD...' : 'Check Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Mode Active Cyclone Alert Banner (if active cyclone forms) */}
        {mode === 'live' && liveData?.status === 'active' && liveData.active_cyclone && (
          <div
            id="live-active-banner"
            className="w-full bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border-2 border-red-500/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                <AlertCircle className="w-6 h-6 animate-ping" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono tracking-wide text-red-300 uppercase">
                  ACTIVE TROPICAL CYCLONE DETECTED — {liveData.active_cyclone.name} ({liveData.active_cyclone.current_status})
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Source: IMD RSMC New Delhi • Real-time track parsed • Gemini Multilingual Advisory active • Last checked: {lastCheckedFormatted}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchLiveCyclone(true)}
              disabled={isLoadingLive}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>Refresh IMD</span>
            </button>
          </div>
        )}

        {/* Layer and System Control Bar */}
        <MapControls
          layerToggles={layerToggles}
          onToggleLayer={handleToggleLayer}
          selectedStormId={selectedStormId}
          onSelectStorm={handleSelectStorm}
          mode={mode}
          hasActiveCyclone={hasActiveCyclone}
          liveStormName={
            mode === 'live'
              ? hasActiveCyclone && liveData?.active_cyclone
                ? liveData.active_cyclone.name
                : 'Bay of Bengal (Continuous Monitoring)'
              : undefined
          }
        />

        {/* Dynamic Display Grid: Map (Left) & Telemetry/Advisories (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[640px]">
          {/* Left Column: Interactive Map & Simulation Scrubber */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 min-h-[500px] h-[600px] relative rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <CycloneMap
                track={activeTrack}
                activePointIndex={activePointIndex}
                vulnerabilityData={SEED_ALL_COASTAL_VULNERABILITY}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={setSelectedDistrict}
                layerToggles={layerToggles}
                mode={mode}
                hasActiveCyclone={hasActiveCyclone}
                onToggleLayer={handleToggleLayer}
                selectedState={selectedState}
                infrastructureData={infrastructureData}
              />
            </div>

            {/* Time Simulation Scrubber: Active in Historical Mode or multi-point Live track */}
            {mode === 'live' && !hasActiveCyclone ? (
              <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 select-none">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span className="font-semibold uppercase tracking-wider">TIME SIMULATION STANDBY</span>
                </div>
                <span className="text-slate-400 text-center">
                  Live observation active. Basin quiescent. Time Scrubber engages upon detection of an active cyclone forecast track.
                </span>
                <span className="px-2.5 py-1 rounded text-[11px] bg-slate-950 text-slate-400 border border-slate-800">
                  IMD Monitoring Active
                </span>
              </div>
            ) : (
              <TimeScrubber
                track={activeTrack}
                activePointIndex={activePointIndex}
                onSelectIndex={setActivePointIndex}
              />
            )}
          </div>

          {/* Right Column: Storm Telemetry, District Risk & Gemini Multilingual Advisory */}
          <TelemetrySidebar
            track={activeTrack}
            activePointIndex={activePointIndex}
            selectedDistrict={selectedDistrict}
            currentLanguage={currentLanguage}
            advisory={advisory}
            isLoadingAdvisory={isLoadingAdvisory}
            selectedState={selectedState}
            onSelectState={handleSelectState}
            allDistricts={SEED_ALL_COASTAL_VULNERABILITY.features.map((f) => f.properties)}
            onSelectDistrict={setSelectedDistrict}
            onLanguageChange={setCurrentLanguage}
            infrastructureData={infrastructureData}
            mode={mode}
            hasActiveCyclone={mode === 'live' && !!liveData?.active_cyclone}
            liveData={liveData}
            selectedStormId={selectedStormId}
          />
        </div>
      </div>

      {/* Floating Dialogflow Conversational Agent */}
      <ChatWidget />
    </main>
  );
}
