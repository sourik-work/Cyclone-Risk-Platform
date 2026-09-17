'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ControlHeader } from '../components/dashboard/ControlHeader';
import { TelemetrySidebar } from '../components/dashboard/TelemetrySidebar';
import { TimeScrubber } from '../components/dashboard/TimeScrubber';
import { CycloneMap } from '../components/map/CycloneMap';
import { MapControls } from '../components/map/MapControls';
import {
  AnticipatoryAdvisory,
  DistrictProperties,
  MapLayerToggles,
  SupportedLanguage,
} from '../components/map/types';
import {
  FALLBACK_ADVISORY,
  SEED_AMPHAN_TRACK,
  SEED_FANI_TRACK,
  SEED_ODISHA_VULNERABILITY,
} from '../lib/seedData';

export default function Home() {
  const [selectedStormId, setSelectedStormId] = useState<string>('fani');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('english');
  const [advisory, setAdvisory] = useState<AnticipatoryAdvisory | null>(null);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState<boolean>(false);

  // Select active track based on storm choice
  const activeTrack = useMemo(() => {
    return selectedStormId === 'amphan' ? SEED_AMPHAN_TRACK : SEED_FANI_TRACK;
  }, [selectedStormId]);

  // Default active point to landfall or peak intensity (~index 8 for Fani, index 6 for Amphan)
  const defaultIndex = useMemo(() => {
    return Math.min(8, activeTrack.track_points.length - 1);
  }, [activeTrack]);

  const [activePointIndex, setActivePointIndex] = useState<number>(defaultIndex);

  // When storm changes, reset activePointIndex to default
  const handleSelectStorm = (stormId: string) => {
    setSelectedStormId(stormId);
    const track = stormId === 'amphan' ? SEED_AMPHAN_TRACK : SEED_FANI_TRACK;
    setActivePointIndex(Math.min(6, track.track_points.length - 1));
  };

  // Default selected district: Kendrapara or Puri
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProperties | null>(
    SEED_ODISHA_VULNERABILITY.features[0]?.properties || null
  );

  // Calls POST /api/advisories/generate whenever storm, track point, or district changes
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
        if (err.name === 'AbortError') {
          return;
        }
        console.warn(
          'Failed to generate advisory from backend API, falling back to static dictionary:',
          err
        );
        setAdvisory(FALLBACK_ADVISORY);
      } finally {
        setIsLoadingAdvisory(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      fetchAdvisory(
        activeTrack.id,
        activePointIndex,
        selectedDistrict?.district_name,
        controller.signal
      );
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeTrack.id, activePointIndex, selectedDistrict?.district_name, fetchAdvisory]);

  const [layerToggles, setLayerToggles] = useState<MapLayerToggles>({
    showTrack: true,
    showForecastCone: true,
    showVulnerability: false, // Disabled: replaced by live Earth Engine satellite raster
    showWindRadii: false,
    showShelters: false,
    showEarthEngine: true, // Enabled: Real-time GEE satellite overlay
  });

  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Global Mission Control Header */}
      <ControlHeader
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        stormStatus={activeTrack.current_status}
      />

      {/* Main Operations Center Layout */}
      <div className="flex-1 p-4 lg:p-6 flex flex-col gap-4 max-w-[1750px] w-full mx-auto">
        {/* Layer and System Control Bar */}
        <MapControls
          layerToggles={layerToggles}
          onToggleLayer={handleToggleLayer}
          selectedStormId={selectedStormId}
          onSelectStorm={handleSelectStorm}
        />

        {/* Dynamic Display Grid: Map (Left) & Telemetry/Advisories (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[640px]">
          {/* Left Column: Interactive Map & Simulation Scrubber */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 min-h-[500px] h-[600px] relative rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <CycloneMap
                track={activeTrack}
                activePointIndex={activePointIndex}
                vulnerabilityData={SEED_ODISHA_VULNERABILITY}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={setSelectedDistrict}
                layerToggles={layerToggles}
              />
            </div>

            {/* Time Simulation Scrubber */}
            <TimeScrubber
              track={activeTrack}
              activePointIndex={activePointIndex}
              onSelectIndex={setActivePointIndex}
            />
          </div>

          {/* Right Column: Storm Telemetry, District Risk & Gemini Multilingual Advisory */}
          <TelemetrySidebar
            track={activeTrack}
            activePointIndex={activePointIndex}
            selectedDistrict={selectedDistrict}
            currentLanguage={currentLanguage}
            advisory={advisory}
            isLoadingAdvisory={isLoadingAdvisory}
          />
        </div>
      </div>
    </main>
  );
}
