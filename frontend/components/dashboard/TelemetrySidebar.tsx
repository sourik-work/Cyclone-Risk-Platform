'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  AnticipatoryAdvisory,
  CycloneTrack,
  DistrictProperties,
  getAdvisoryTextForLanguage,
  HazardSummary,
  InfrastructureFeatureCollection,
  MultilingualAdvisories,
  RainfallForecast,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  SurgeSimulation,
  TrackPoint,
} from '../map/types';
import {
  FALLBACK_ADVISORY,
  SEED_MULTILINGUAL_ADVISORIES,
  SEED_ALL_COASTAL_VULNERABILITY,
} from '../../lib/seedData';
import { SEED_INFRASTRUCTURE_DATA } from '../../lib/infrastructureSeed';
import {
  Wind,
  Gauge,
  Compass,
  Navigation,
  Shield,
  AlertTriangle,
  Users,
  Waves,
  Sparkles,
  Loader2,
  Cpu,
  MapPin,
  Volume2,
  Pause,
  Radio,
  X,
  Languages,
  Zap,
  Building2,
  CloudRain,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AlertSubscription } from './AlertSubscription';
import { InsuranceTriggerPanel } from './InsuranceTriggerPanel';
import { ExposureReasoningCard } from './ExposureReasoningCard';
import { ForecastComparisonCard } from './ForecastComparisonCard';
import { RainfallDamagePanel } from './RainfallDamagePanel';
import { TriageRankingCard } from './TriageRankingCard';
import { getAuthHeader } from '../../lib/api';

interface TelemetrySidebarProps {
  track: CycloneTrack;
  activePointIndex: number;
  selectedDistrict: DistrictProperties | null;
  currentLanguage: SupportedLanguage;
  advisory?: AnticipatoryAdvisory | null;
  isLoadingAdvisory?: boolean;
  selectedState?: string;
  onSelectState?: (state: string) => void;
  allDistricts?: DistrictProperties[];
  onSelectDistrict?: (district: DistrictProperties) => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  infrastructureData?: InfrastructureFeatureCollection | null;
  mode?: 'historical' | 'live';
  hasActiveCyclone?: boolean;
  liveData?: any;
  selectedStormId?: string;
}

const formatCount = (val: number): string => {
  return new Intl.NumberFormat('en-US').format(val);
};

const COASTAL_STATES = ['Odisha', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu'];

function pcmToWav(
  pcmBytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Blob {
  const dataLength = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // file size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true); // num channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, (sampleRate * numChannels * bitsPerSample) / 8, true); // byte rate
  view.setUint16(32, (numChannels * bitsPerSample) / 8, true); // block align
  view.setUint16(34, bitsPerSample, true); // bits per sample

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataLength, true); // data size

  // Write PCM data
  const bytes = new Uint8Array(buffer, 44);
  bytes.set(pcmBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

function playViaWebSpeech(text: string, language: string): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.reject(new Error('Web Speech API is not supported in this browser'));
  }

  const raw = (language || 'en').toLowerCase();
  const langKey = raw.startsWith('hi')
    ? 'hi'
    : raw.startsWith('en')
    ? 'en'
    : raw.startsWith('ta')
    ? 'ta'
    : raw.startsWith('te')
    ? 'te'
    : raw.startsWith('bn')
    ? 'bn'
    : raw.startsWith('or') || raw.startsWith('od')
    ? 'or'
    : 'en';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();

  // Find hi-IN voice (e.g. Google हिन्दी or Microsoft Kalpana or any hi-IN / hi voice)
  const hindiVoice =
    voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
    voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.includes('हिन्दी')
    );

  if (langKey === 'en') {
    const enVoice =
      voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (enVoice) {
      utterance.voice = enVoice;
      utterance.lang = enVoice.lang || 'en-IN';
    } else if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
  } else if (langKey === 'hi') {
    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = hindiVoice.lang || 'hi-IN';
    } else {
      utterance.lang = 'hi-IN';
    }
  } else {
    // Regional languages: ta, te, bn, or
    // Check if native voice is installed
    const nativeVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(langKey)
    );

    if (nativeVoice) {
      utterance.voice = nativeVoice;
      utterance.lang = nativeVoice.lang;
    } else {
      // Fallback to hi-IN voice (Google हिन्दी)
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.lang = 'hi-IN';
    }
  }

  window.speechSynthesis.cancel();

  return new Promise<void>((resolve, reject) => {
    utterance.onend = () => {
      resolve();
    };
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve();
      } else {
        reject(e);
      }
    };
    window.speechSynthesis.speak(utterance);
  });
}

function getExpectedVoiceSource(
  language: string
): 'browser-hindi' | 'browser-english' | 'browser-fallback' {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return 'browser-fallback';
  }
  const raw = (language || 'en').toLowerCase();
  if (raw.startsWith('hi')) return 'browser-hindi';
  if (raw.startsWith('en')) {
    const voices = window.speechSynthesis.getVoices();
    const hasEn = voices.some((v) => v.lang.toLowerCase().startsWith('en'));
    return hasEn ? 'browser-english' : 'browser-fallback';
  }
  const langKey = raw.startsWith('ta')
    ? 'ta'
    : raw.startsWith('te')
    ? 'te'
    : raw.startsWith('bn')
    ? 'bn'
    : raw.startsWith('or') || raw.startsWith('od')
    ? 'or'
    : raw;

  const voices = window.speechSynthesis.getVoices();
  const hasNative = voices.some((v) => v.lang.toLowerCase().startsWith(langKey));
  return hasNative ? 'browser-hindi' : 'browser-fallback';
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  track,
  activePointIndex,
  selectedDistrict,
  currentLanguage,
  advisory,
  isLoadingAdvisory = false,
  selectedState = 'Odisha',
  onSelectState,
  allDistricts,
  onSelectDistrict,
  onLanguageChange,
  infrastructureData,
  mode = 'historical',
  hasActiveCyclone,
  liveData,
  selectedStormId,
}) => {
  const currentPoint: TrackPoint = track.track_points[activePointIndex] || track.track_points[0];
  const [localAdvisoryOverride, setLocalAdvisoryOverride] = useState<AnticipatoryAdvisory | null>(null);
  const [isApprovalActionLoading, setIsApprovalActionLoading] = useState<boolean>(false);

  useEffect(() => {
    setLocalAdvisoryOverride(null);
  }, [advisory?.advisory_id]);

  const currentAdvisory = localAdvisoryOverride || advisory;
  const effectiveAdvisory = currentAdvisory || FALLBACK_ADVISORY;
  const isAuthorizedDispatcher = true;

  const approveAdvisory = async () => {
    if (!currentAdvisory?.advisory_id) return;
    setIsApprovalActionLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const authHeader = await getAuthHeader();
      const res = await fetch(`${backendUrl}/api/advisories/${currentAdvisory.advisory_id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          approved_by: 'Authorized Operational Dispatcher',
          notes: 'Approved anticipatory advisory for regional emergency broadcast to DISCOM & ODRAF.',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalAdvisoryOverride(updated);
      }
    } catch (err) {
      console.warn('Failed to approve advisory:', err);
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const rejectAdvisory = async () => {
    if (!currentAdvisory?.advisory_id) return;
    setIsApprovalActionLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const authHeader = await getAuthHeader();
      const res = await fetch(`${backendUrl}/api/advisories/${currentAdvisory.advisory_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          reason: 'Operational safety review: advisory held pending ground validation.',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalAdvisoryOverride(updated);
      }
    } catch (err) {
      console.warn('Failed to reject advisory:', err);
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  // Future track points defining the uncertainty cone
  const forecastTrackPoints = useMemo(() => {
    if (!track.track_points || track.track_points.length === 0) return [];
    return track.track_points.slice(activePointIndex);
  }, [track.track_points, activePointIndex]);

  // Check if a point is within any future forecast point's cone radius
  const isPointInCone = useCallback(
    (lat: number, lon: number): boolean => {
      if (!forecastTrackPoints || forecastTrackPoints.length === 0) return false;
      const R = 6371;
      return forecastTrackPoints.some((pt, idx) => {
        const radius =
          pt.cone_radius_km && pt.cone_radius_km > 0
            ? pt.cone_radius_km
            : Math.max(35, (idx + 1) * 25);
        const dLat = ((pt.latitude - lat) * Math.PI) / 180;
        const dLon = ((pt.longitude - lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((pt.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = R * c;
        return distKm <= radius;
      });
    },
    [forecastTrackPoints]
  );

  // TTS & Broadcast state
  type VoiceSource = 'gemini' | 'browser-hindi' | 'browser-english' | 'browser-fallback' | null;
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [voiceSource, setVoiceSource] = useState<VoiceSource>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setVoiceSource(null);
  }, [currentLanguage]);

  const showToast = (toastMessage: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message: toastMessage, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Active state determination
  const activeState = selectedState || selectedDistrict?.state_name || 'Odisha';

  // All coastal districts across India
  const districts =
    allDistricts && allDistricts.length > 0
      ? allDistricts
      : SEED_ALL_COASTAL_VULNERABILITY.features.map((f) => f.properties);

  // Filter districts by active state
  const stateDistricts = districts.filter(
    (d) => d.state_name.toLowerCase() === activeState.toLowerCase()
  );

  const handleStateClick = (state: string) => {
    if (onSelectState) {
      onSelectState(state);
    }
    // Auto-select first district in that state if current selection belongs to a different state
    const targetDistricts = districts.filter(
      (d) => d.state_name.toLowerCase() === state.toLowerCase()
    );
    if (targetDistricts.length > 0 && onSelectDistrict) {
      onSelectDistrict(targetDistricts[0]);
    }
  };

  // Compute district-level infrastructure assets, coastal exposure warning, and cone intersection
  const districtInfrastructure = useMemo(() => {
    const data = infrastructureData || SEED_INFRASTRUCTURE_DATA;
    const targetDistrictName = selectedDistrict?.district_name || 'Puri';
    const targetState = selectedDistrict?.state_name || activeState;

    const distNameLower = targetDistrictName.toLowerCase();
    const stateNameLower = targetState.toLowerCase();

    // 1. Substations
    const substations = data.features
      .filter((f) => {
        const p = f.properties;
        const stateMatch = p.state?.toLowerCase() === stateNameLower;
        const distMatch = p.district?.toLowerCase() === distNameLower;
        return stateMatch && distMatch && p.asset_type === 'SUBSTATION';
      })
      .map((f) => {
        const coords = f.geometry.coordinates as [number, number];
        const atRisk = isPointInCone(coords[1], coords[0]);
        return { ...f.properties, is_at_risk: atRisk };
      });

    // 2. Arterial Roads
    const roads = data.features
      .filter((f) => {
        const p = f.properties;
        const stateMatch = p.state?.toLowerCase() === stateNameLower;
        const distMatch =
          p.districts_served?.some((d) => d.toLowerCase() === distNameLower) ||
          p.district?.toLowerCase() === distNameLower;
        return stateMatch && distMatch && p.asset_type === 'ARTERIAL_ROAD';
      })
      .map((f) => {
        const coords = f.geometry.coordinates as [number, number][];
        const atRisk = coords.some(([lon, lat]) => isPointInCone(lat, lon));
        return { ...f.properties, is_at_risk: atRisk };
      });

    // 3. Hospitals
    const hospitals = data.features
      .filter((f) => {
        const p = f.properties;
        const stateMatch = p.state?.toLowerCase() === stateNameLower;
        const distMatch = p.district?.toLowerCase() === distNameLower;
        return (
          stateMatch &&
          distMatch &&
          ['DISTRICT_HOSPITAL', 'MEDICAL_COLLEGE', 'PHC'].includes(p.facility_type || '')
        );
      })
      .map((f) => {
        const coords = f.geometry.coordinates as [number, number];
        const atRisk = isPointInCone(coords[1], coords[0]);
        return { ...f.properties, is_at_risk: atRisk };
      });

    // 4. Cyclone Shelters
    const shelters = data.features
      .filter((f) => {
        const p = f.properties;
        const stateMatch = p.state?.toLowerCase() === stateNameLower;
        const distMatch = p.district?.toLowerCase() === distNameLower;
        return stateMatch && distMatch && p.facility_type === 'CYCLONE_SHELTER';
      })
      .map((f) => {
        const coords = f.geometry.coordinates as [number, number];
        const atRisk = isPointInCone(coords[1], coords[0]);
        return { ...f.properties, is_at_risk: atRisk };
      });

    const totalHospitalBeds = hospitals.reduce((acc, h) => acc + (h.bed_capacity || 0), 0);
    const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.shelter_capacity || 0), 0);

    // Warning badge if any asset within 5km of coast
    const allDistrictFacilities = [...substations, ...hospitals, ...shelters];
    const coastalAssets = allDistrictFacilities.filter(
      (a) => a.distance_from_coast_km != null && a.distance_from_coast_km <= 5.0
    );

    return {
      substations,
      roads,
      hospitals,
      shelters,
      totalHospitalBeds,
      totalShelterCapacity,
      hasCoastalWarning: coastalAssets.length > 0,
      coastalAssetsCount: coastalAssets.length,
    };
  }, [infrastructureData, selectedDistrict, activeState, isPointInCone]);

  // Hazard Forecast State (Rainfall Accumulation & Storm Surge Hydrodynamics)
  const [hazardData, setHazardData] = useState<HazardSummary | null>(null);
  const [isLoadingHazards, setIsLoadingHazards] = useState<boolean>(false);

  // Auto-refresh rainfall + surge hazard data whenever district, state, or storm track changes
  useEffect(() => {
    let isMounted = true;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const cycloneId = track.name ? track.name.toLowerCase() : track.id;
    const targetDistrictName = selectedDistrict?.district_name || 'Puri';
    const targetState = selectedDistrict?.state_name || activeState;

    setIsLoadingHazards(true);
    setHazardData(null);
    fetch(
      `${backendUrl}/api/hazards/summary?district=${encodeURIComponent(targetDistrictName)}&cyclone_id=${encodeURIComponent(cycloneId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Hazards API returned ${res.status}`);
        return res.json();
      })
      .then((data: HazardSummary) => {
        if (isMounted) {
          setHazardData(data);
          setIsLoadingHazards(false);
        }
      })
      .catch((err) => {
        console.warn('API hazard summary failed, using deterministic local calculation:', err);
        if (isMounted) {
          const isFani = cycloneId.toLowerCase().includes('fani') || cycloneId === 'BOB-02-2019';
          const isAmphan = cycloneId.toLowerCase().includes('amphan') || cycloneId === 'BOB-01-2020';
          const maxWind = isAmphan ? 240.0 : isFani ? 205.0 : 45.0;
          const bathymetry = targetState.toLowerCase() === 'west bengal' ? 1.55 : targetState.toLowerCase() === 'odisha' ? 1.35 : 1.15;
          const surgeM = Math.round((maxWind / 100.0) * bathymetry * 1.075 * 100) / 100;
          const rain24 = Math.round((maxWind >= 180 ? 215.0 : maxWind >= 90 ? 115.0 : 38.0) * (targetDistrictName === 'Puri' ? 1.15 : 1.0) * 10) / 10;
          const rainRisk = rain24 >= 200 ? 'CRITICAL' : rain24 >= 100 ? 'HIGH' : rain24 >= 50 ? 'MEDIUM' : 'LOW';
          const overall = rainRisk === 'CRITICAL' || surgeM >= 3.0 ? 'CRITICAL' : rainRisk === 'HIGH' || surgeM >= 2.0 ? 'HIGH' : 'MEDIUM';
          setHazardData({
            district_id: selectedDistrict?.district_id || targetDistrictName,
            rainfall: {
              district_id: selectedDistrict?.district_id || targetDistrictName,
              forecast_24h_mm: rain24,
              forecast_48h_mm: Math.round(rain24 * 1.72 * 10) / 10,
              forecast_72h_mm: Math.round(rain24 * 2.18 * 10) / 10,
              risk_level: rainRisk,
            },
            surge: {
              cyclone_id: cycloneId,
              district_id: selectedDistrict?.district_id || targetDistrictName,
              max_surge_m: surgeM,
              inundation_area_km2: Math.round(75.0 * surgeM * 2.0 * 0.72 * 10) / 10,
              affected_population: Math.round(420000 * Math.min(0.7, (surgeM / 6.0) * 0.5)),
              affected_assets: {
                hospitals_at_risk: districtInfrastructure.hospitals.length || 2,
                shelters_activated: districtInfrastructure.shelters.length || 1,
                power_substations_at_risk: districtInfrastructure.substations.length || 1,
                roads_submerged_km: 28.5,
              },
              inundation_polygon: { type: 'Feature', coordinates: [] },
            },
            overall_risk: overall,
          });
          setIsLoadingHazards(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrict?.district_name, selectedDistrict?.district_id, selectedDistrict?.state_name, selectedState, activeState, track.id, track.name, districtInfrastructure]);

  const hazardOverallRisk = hazardData?.overall_risk || 'HIGH';
  const hazardRainRisk = hazardData?.rainfall?.risk_level || 'HIGH';
  const rainfall24h = hazardData?.rainfall?.forecast_24h_mm ?? 195.0;
  const rainfall48h = hazardData?.rainfall?.forecast_48h_mm ?? 325.0;
  const rainfall72h = hazardData?.rainfall?.forecast_72h_mm ?? 440.0;
  const surgeHeight = hazardData?.surge?.max_surge_m ?? 3.2;
  const surgeArea = hazardData?.surge?.inundation_area_km2 ?? 280.0;
  const surgePop = hazardData?.surge?.affected_population ?? 115000;
  const surgeAssets = hazardData?.surge?.affected_assets ?? {
    hospitals_at_risk: districtInfrastructure.hospitals.length || 2,
    shelters_activated: districtInfrastructure.shelters.length || 1,
    roads_submerged_km: 30.0,
    power_substations_at_risk: districtInfrastructure.substations.length || 1,
  };

  // Language mapping: strictly accesses the NEW nested structure advisory.multilingual_advisories[language]
  const langKey = (() => {
    const raw = (currentLanguage || 'english').toLowerCase();
    const map: Record<string, keyof MultilingualAdvisories> = {
      odia: 'odia',
      or: 'odia',
      bengali: 'bengali',
      bn: 'bengali',
      telugu: 'telugu',
      te: 'telugu',
      tamil: 'tamil',
      ta: 'tamil',
      hindi: 'hindi',
      hi: 'hindi',
      english: 'english',
      en: 'english',
    };
    return map[raw] || 'english';
  })();

  const nestedAdvisories = effectiveAdvisory.multilingual_advisories;
  const emergencyMessages = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.message as Record<string, string>;
  const emergencyHeadlines = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.headline as Record<string, string>;
  const emergencyActions = SEED_MULTILINGUAL_ADVISORIES.EMERGENCY.action as Record<string, string>;

  // Picks text from the NEW nested structure: advisory.multilingual_advisories[language]
  const message =
    (nestedAdvisories && nestedAdvisories[langKey as keyof MultilingualAdvisories]) ||
    getAdvisoryTextForLanguage(nestedAdvisories, currentLanguage) ||
    nestedAdvisories?.english ||
    emergencyMessages[langKey] ||
    emergencyMessages.english;

  const headline =
    emergencyHeadlines[langKey] ||
    effectiveAdvisory.headline ||
    'ANTICIPATORY ACTION ADVISORY';

  const actions = effectiveAdvisory.recommended_actions || [];

  const fallbackLangName = (() => {
    const raw = (currentLanguage || 'en').toLowerCase();
    if (raw.startsWith('ta')) return 'Tamil';
    if (raw.startsWith('te')) return 'Telugu';
    if (raw.startsWith('bn')) return 'Bengali';
    if (raw.startsWith('or') || raw.startsWith('od')) return 'Odia';
    if (raw.startsWith('hi')) return 'Hindi';
    if (raw.startsWith('en')) return 'English';
    return 'Regional';
  })();

  const windKmph =
    currentPoint.wind_speed_kmph || Math.round(currentPoint.wind_speed_knots * 1.852);
  const gustKmph =
    currentPoint.gust_speed_kmph || Math.round(windKmph * 1.25);

  const playViaGeminiWav = (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const binaryString = window.atob(audioBase64);
        const pcmBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmBytes[i] = binaryString.charCodeAt(i);
        }
        const blob = pcmToWav(pcmBytes);
        const url = URL.createObjectURL(blob);

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        objectUrlRef.current = url;

        audio.onended = () => {
          setTtsState('idle');
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          resolve();
        };

        audio.onpause = () => {
          resolve();
        };

        audio.onerror = () => {
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          reject(new Error('Audio playback failed'));
        };

        audio
          .play()
          .then(() => {
            setTtsState('playing');
          })
          .catch((err) => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  };

  const handlePlayAdvisory = async () => {
    if (ttsState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTtsState('idle');
      return;
    }

    if (ttsState === 'loading') return;

    if (ttsState === 'error') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }

    // Get text from advisory.multilingual_advisories[currentLanguage]
    const advisoryText =
      (nestedAdvisories && nestedAdvisories[langKey as keyof MultilingualAdvisories]) ||
      getAdvisoryTextForLanguage(nestedAdvisories, currentLanguage) ||
      '';

    if (!advisoryText || !advisoryText.trim()) {
      showToast('No advisory text available', 'error');
      setTtsState('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    setTtsState('loading');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/advisories/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: advisoryText,
          language: currentLanguage,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = { error: `HTTP ${res.status}` };
      }

      // Check if Gemini audio returned valid base64
      // If error contains "429" OR audio_base64 is empty/null/short -> fallback
      const hasGeminiAudio = Boolean(data?.audio_base64 && data.audio_base64.length > 1000);
      const isQuotaOrError = !res.ok || Boolean(data?.error) || !hasGeminiAudio;

      if (!isQuotaOrError && hasGeminiAudio) {
        // Gemini TTS path
        setVoiceSource('gemini');
        await playViaGeminiWav(data.audio_base64);
      } else {
        // Fallback: Web Speech API with smart voice routing
        console.warn(
          'Gemini TTS unavailable (quota or error: %s), using Web Speech API fallback',
          data?.error || `HTTP ${res.status}`
        );
        const expectedSource = getExpectedVoiceSource(currentLanguage);
        setVoiceSource(expectedSource);
        setTtsState('playing');
        try {
          await playViaWebSpeech(advisoryText, currentLanguage);
        } finally {
          setTtsState('idle');
        }
      }
    } catch (err: any) {
      console.warn('Gemini TTS unavailable, using Web Speech API fallback:', err);
      const expectedSource = getExpectedVoiceSource(currentLanguage);
      setVoiceSource(expectedSource);
      setTtsState('playing');
      try {
        await playViaWebSpeech(advisoryText, currentLanguage);
      } catch (fallbackErr: any) {
        console.error('Web Speech API fallback failed:', fallbackErr);
        showToast('Voice synthesis unavailable — try again', 'error');
        setTtsState('error');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      } finally {
        setTtsState('idle');
      }
    }
  };

  return (
    <>
      <aside className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-1 select-none">
      {/* 1. Storm Telemetry Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              STORM TELEMETRY • {track.basin}
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>CYCLONE {track.name.toUpperCase()}</span>
              <span className="text-xs font-mono font-normal text-slate-400">({track.id})</span>
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            {currentPoint.category}
          </span>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sustained Wind</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {windKmph}{' '}
              <span className="text-[11px] font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Gusts to {gustKmph} km/h ({currentPoint.wind_speed_knots} kts)
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span>Central Pressure</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-100">
              {currentPoint.central_pressure_hpa}{' '}
              <span className="text-[11px] font-normal text-slate-400">hPa</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentPoint.central_pressure_hpa < 950 ? 'Extremely Intense' : 'Standard Depression'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Position (Lat/Lon)</span>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-200">
              {currentPoint.latitude.toFixed(2)}°N, {currentPoint.longitude.toFixed(2)}°E
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {currentPoint.is_forecast ? `Lead: +${currentPoint.forecast_lead_hours}h` : 'Observed RSMC'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Movement</span>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-200">
              {currentPoint.forward_speed_kmph || 18} km/h @ {currentPoint.heading_degrees || 35}°
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Bearing: North-Northeast</div>
          </div>
        </div>
      </div>

      {/* 2. Coastal District Vulnerability Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              COASTAL IMPACT ASSESSMENT
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeState.toUpperCase()} RISK GRID
          </span>
        </div>

        {/* State Selector: 4 Coastal States Dropdown */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <label htmlFor="state-selector-dropdown" className="flex items-center gap-1.5 cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Coastal State:</span>
            </label>
            <span className="text-cyan-400 font-bold font-mono">{activeState}</span>
          </div>
          <div className="relative">
            <select
              id="state-selector-dropdown"
              name="state-selector-dropdown"
              value={activeState}
              onChange={(e) => handleStateClick(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 font-medium text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all cursor-pointer shadow-inner"
            >
              {COASTAL_STATES.map((state) => (
                <option key={state} value={state} className="bg-slate-900 text-slate-100 py-1">
                  {state}
                </option>
              ))}
            </select>
          </div>
          {/* Quick-switch state buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {COASTAL_STATES.map((state) => {
              const isSelected = activeState.toLowerCase() === state.toLowerCase();
              return (
                <button
                  key={state}
                  id={`btn-state-${state.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleStateClick(state)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center truncate cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-[1.02]'
                      : 'text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800'
                  }`}
                  title={`Switch to ${state} coastal districts`}
                >
                  {state}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtered District Selector List */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{activeState} Districts:</span>
            <span className="text-slate-500">{stateDistricts.length} active</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {stateDistricts.map((d) => {
              const isSelected =
                selectedDistrict?.district_name.toLowerCase() === d.district_name.toLowerCase();
              const score = (d.cyclone_risk_score ?? d.vulnerability_score ?? 0.75) * 100;
              return (
                <button
                  key={d.district_id || d.district_name}
                  id={`btn-district-${d.district_name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => onSelectDistrict && onSelectDistrict(d)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-400/40'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{d.district_name}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      score >= 80
                        ? 'bg-red-500/20 text-red-300'
                        : score >= 70
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {score.toFixed(0)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected District Deep-Dive Details */}
        {selectedDistrict ? (
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-100">{selectedDistrict.district_name}</h4>
                <p className="text-[11px] text-slate-400">
                  {selectedDistrict.state_name} • Coastline: {selectedDistrict.coastal_length_km ?? selectedDistrict.coastline_km} km
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400">Risk Score</span>
                <div className="text-sm font-bold font-mono text-red-400">
                  {((selectedDistrict.cyclone_risk_score ?? selectedDistrict.vulnerability_score ?? 0.75) * 100).toFixed(0)}% CRITICAL
                </div>
              </div>
            </div>

            {/* Risk Bar Meter */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(selectedDistrict.cyclone_risk_score ?? selectedDistrict.vulnerability_score ?? 0.75) * 100}%`,
                }}
              />
            </div>

            {/* District Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <Waves className="w-3 h-3 text-cyan-400" /> Storm Surge
                </div>
                <div className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                  {selectedDistrict.storm_surge_risk_m ?? selectedDistrict.inundation_risk ?? 4.0} meters
                </div>
                <div className="text-[10px] text-slate-500">Inundation Threat</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                <div className="text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Kutcha Population
                </div>
                <div suppressHydrationWarning className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                  {formatCount(selectedDistrict.vulnerable_population ?? selectedDistrict.kutcha_population ?? 0)}
                </div>
                <div className="text-[10px] text-slate-500">Require Evacuation</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg col-span-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Shelter Capacity vs Need
                  </span>
                  <span suppressHydrationWarning className="text-[11px] font-mono text-red-400 font-semibold">
                    Deficit: -
                    {formatCount(
                      Math.max(
                        0,
                        (selectedDistrict.vulnerable_population ?? selectedDistrict.kutcha_population ?? 0) -
                          selectedDistrict.shelter_capacity
                      )
                    )}
                  </span>
                </div>
                <div suppressHydrationWarning className="text-xs font-mono text-slate-200 mt-1">
                  Cap: {formatCount(selectedDistrict.shelter_capacity)} in {selectedDistrict.shelter_count ?? selectedDistrict.evac_shelters} shelters
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-4 text-center border border-dashed border-slate-800 rounded-lg">
            Select any coastal district above or click on its map polygon to view exposure and evacuation deficits.
          </div>
        )}
      </div>

      {/* 2.5 Infrastructure Exposure Card (Phase 1, Workstream 1) */}
      <div
        id="infrastructure-exposure-card"
        className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              INFRASTRUCTURE EXPOSURE
            </h3>
          </div>
          <span className="text-[10px] text-amber-400 font-mono font-semibold">
            {(selectedDistrict?.district_name || activeState).toUpperCase()}
          </span>
        </div>

        {/* Warning badge if any asset within 5km of coast */}
        {districtInfrastructure.hasCoastalWarning && (
          <div
            id="coastal-exposure-warning-badge"
            className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold text-amber-200">CRITICAL COASTAL EXPOSURE:</span>{' '}
              <span>{districtInfrastructure.coastalAssetsCount} asset(s) located within 5km of shoreline</span>
            </div>
          </div>
        )}

        {/* Summary metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Substations */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Substations
              </span>
              <span className="font-mono font-bold text-amber-400">
                {districtInfrastructure.substations.length}
              </span>
            </div>
            <div className="space-y-1">
              {districtInfrastructure.substations.length > 0 ? (
                districtInfrastructure.substations.map((s, idx) => (
                  <div key={s.asset_id || idx} className="flex items-center justify-between text-[11px] gap-1">
                    <span className="text-slate-300 truncate text-[10px]" title={s.name}>
                      {s.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.is_at_risk && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                          AT RISK
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-slate-400">{s.voltage_kv}kV</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic">No grid substations</div>
              )}
            </div>
          </div>

          {/* Arterial Roads */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Navigation className="w-3.5 h-3.5 text-blue-400" /> Arterial Roads
              </span>
              <span className="font-mono font-bold text-blue-400">
                {districtInfrastructure.roads.length}
              </span>
            </div>
            <div className="space-y-1">
              {districtInfrastructure.roads.length > 0 ? (
                districtInfrastructure.roads.map((r, idx) => (
                  <div key={r.road_id || idx} className="flex items-center justify-between text-[11px] gap-1">
                    <span className="text-slate-300 truncate text-[10px]" title={r.name}>
                      {r.name} ({r.road_class})
                    </span>
                    {r.is_at_risk && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 shrink-0 animate-pulse">
                        AT RISK
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic">No arterial roads</div>
              )}
            </div>
          </div>

          {/* Hospitals */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-rose-400" /> Hospitals
              </span>
              <span className="font-mono font-bold text-rose-400">
                {districtInfrastructure.totalHospitalBeds} beds
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {districtInfrastructure.hospitals.length} facilities
            </div>
            <div className="space-y-1">
              {districtInfrastructure.hospitals.map((h, idx) => (
                <div key={h.facility_id || idx} className="flex items-center justify-between text-[11px] gap-1">
                  <span className="text-slate-300 truncate text-[10px]" title={h.name}>
                    {h.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {h.is_at_risk && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                        AT RISK
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400">{h.bed_capacity}b</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shelters */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Shelters
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {districtInfrastructure.totalShelterCapacity} cap
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {districtInfrastructure.shelters.length} cyclone shelters
            </div>
            <div className="space-y-1">
              {districtInfrastructure.shelters.map((sh, idx) => (
                <div key={sh.facility_id || idx} className="flex items-center justify-between text-[11px] gap-1">
                  <span className="text-slate-300 truncate text-[10px]" title={sh.name}>
                    {sh.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {sh.is_at_risk && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                        AT RISK
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400">{sh.shelter_capacity}p</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2.55 Gemini Exposure Reasoning Card (Workstream 11b: Multimodal Reasoning over SAR + Infrastructure) */}
      <ExposureReasoningCard
        key={`exposure-${track.id || selectedStormId}-${selectedDistrict?.district_name || 'Puri'}`}
        districtName={selectedDistrict?.district_name || 'Puri'}
        cycloneId={track.id || (selectedStormId === 'amphan' ? 'BOB-01-2020' : 'BOB-02-2019')}
      />

      {/* 2.58 Infrastructure Triage Ranking (Workstream 16: Operational Criticality Priority Ranking) */}
      <TriageRankingCard
        cycloneId={track.id || (selectedStormId === 'amphan' ? 'BOB-01-2020' : 'BOB-02-2019')}
        stormName={track.name || (selectedStormId === 'amphan' ? 'Amphan' : 'Fani')}
      />

      {/* 2.6 Hazard Forecast Card (Workstream 2: Rainfall Damage Pathway & Storm Surge Modeling) */}
      <div
        id="hazard-forecast-card"
        className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3.5 transition-all duration-300"
      >
        {/* Header with Title, Loading, and Overall Risk Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Waves className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              HAZARD FORECAST
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingHazards && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
            <span
              id="hazard-overall-risk-badge"
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                hazardOverallRisk === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : hazardOverallRisk === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                  : hazardOverallRisk === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              }`}
            >
              OVERALL RISK: {hazardOverallRisk}
            </span>
          </div>
        </div>

        {/* District & Modeling Meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Target: <strong className="text-slate-200">{selectedDistrict?.district_name || 'Puri'}</strong> ({selectedDistrict?.state_name || activeState})</span>
          <span>Hydrodynamic: <strong className="text-cyan-400">Physics-Lite</strong></span>
        </div>

        {/* 1. Rainfall Accumulation Forecast */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rainfall Accumulation
            </span>
            <span
              id="rainfall-risk-badge"
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                hazardRainRisk === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : hazardRainRisk === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                  : hazardRainRisk === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              }`}
            >
              {hazardRainRisk}
            </span>
          </div>

          {/* 3-column Rainfall Accumulation (24h, 48h, 72h) */}
          <div id="rainfall-forecast-grid" className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">24h Rain</div>
              <div className="text-sm font-mono font-bold text-blue-300">{rainfall24h} mm</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">48h Rain</div>
              <div className="text-sm font-mono font-bold text-blue-400">{rainfall48h} mm</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">72h Rain</div>
              <div className="text-sm font-mono font-bold text-blue-500">{rainfall72h} mm</div>
            </div>
          </div>
        </div>

        {/* 2. Storm Surge Inundation Section */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Waves className="w-3.5 h-3.5 text-cyan-400" /> Storm Surge Hydrodynamics
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              Buffer: {(surgeHeight * 2).toFixed(1)} km
            </span>
          </div>

          {/* 3-column Surge Simulation (Max Height, Inundation Area, Affected Pop) */}
          <div id="surge-simulation-grid" className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">Peak Surge</div>
              <div className="text-sm font-mono font-bold text-cyan-300">{surgeHeight} m</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">Inundation</div>
              <div className="text-sm font-mono font-bold text-cyan-400">{surgeArea} km²</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-mono">Affected Pop</div>
              <div className="text-sm font-mono font-bold text-rose-300">{formatCount(surgePop)}</div>
            </div>
          </div>

          {/* Key Exposed Infrastructure Assets */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/50">
            <span>Exposed:</span>
            <span className="text-slate-300 truncate text-[10px]">
              🏥 {surgeAssets.hospitals_at_risk || 1} hosp • 🏕️ {surgeAssets.shelters_activated || 1} shelters • 🛣️ {surgeAssets.roads_submerged_km || 25} km
            </span>
          </div>
        </div>
      </div>

      {/* 2.65 Distinct Terrain-Aware Rainfall Damage Pathway Model (Workstream 15) */}
      <RainfallDamagePanel
        districtName={selectedDistrict?.district_name || 'Puri'}
        cycloneId={track.id || (selectedStormId === 'amphan' ? 'BOB-01-2020' : 'BOB-02-2019')}
      />

      {/* FCM Push Alert Subscription Card */}
      <AlertSubscription currentState={selectedState || 'Odisha'} />

      {/* Parametric Insurance Triggers Card */}
      <InsuranceTriggerPanel
        key={`insurance-${track?.id || selectedStormId}`}
        cycloneId={
          mode === 'live'
            ? liveData?.active_cyclone?.cyclone_id || 'calm-baseline'
            : track?.id || (selectedStormId === 'amphan' ? 'BOB-01-2020' : 'BOB-02-2019')
        }
        mode={mode}
        hasActiveCyclone={mode === 'live' && (hasActiveCyclone !== undefined ? hasActiveCyclone : !!liveData?.active_cyclone)}
        cycloneName={mode === 'live' ? (liveData?.active_cyclone?.name || null) : (track?.name || (selectedStormId === 'amphan' ? 'Amphan' : 'Fani'))}
        cycloneCategory={mode === 'live' ? (liveData?.active_cyclone?.current_status || null) : (track?.current_status || 'Super Cyclonic Storm')}
        currentState={selectedState || 'Odisha'}
      />

      {/* 3. Gemini Multilingual Anticipatory Action Early Warning */}
      <div className="bg-gradient-to-b from-red-950/40 to-slate-900/90 backdrop-blur-md border border-red-500/30 rounded-xl p-4 shadow-xl space-y-3 relative overflow-hidden transition-all duration-300">
        {/* Top subtle glow bar when loading */}
        {isLoadingAdvisory && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 animate-pulse" />
        )}

        {/* Header with Title, Powered by Badge, and Window Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-red-500/20 pb-2.5">
          <div className="flex items-center gap-2 text-red-400 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-300 truncate">
                  ANTICIPATORY ADVISORY
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Powered by Gemini 3.7 Flash
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-medium truncate">
                {isLoadingAdvisory || !advisory
                  ? 'Synthesizing advisory...'
                  : effectiveAdvisory.severity_level?.replace(/_/g, ' ') || 'ALERT'}
                {!isLoadingAdvisory && advisory && effectiveAdvisory.target_districts?.length
                  ? ` • ${effectiveAdvisory.target_districts.join(', ')}`
                  : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLoadingAdvisory && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Synthesizing...</span>
              </span>
            )}
            <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-bold border border-red-500/30 whitespace-nowrap shadow-sm">
              T-{effectiveAdvisory.lead_time_hours ?? 18}h WINDOW
            </span>
          </div>
        </div>

        {/* Voice Delivery & Language Control Action Bar */}
        <div className="flex flex-col gap-2 pt-0.5 pb-1">
          <div className="flex items-center justify-between gap-2">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 min-w-0">
              <label htmlFor="advisory-lang-select" className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
                <Languages className="w-3 h-3 text-cyan-400" />
                <span>Lang:</span>
              </label>
              <select
                id="advisory-lang-select"
                value={currentLanguage}
                onChange={(e) => onLanguageChange && onLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-inner"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Play Advisory Button (4 States) */}
            <button
              id="btn-play-advisory"
              onClick={handlePlayAdvisory}
              disabled={ttsState === 'loading' || isLoadingAdvisory || !advisory}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none ${
                ttsState === 'playing'
                  ? 'bg-[#00e5ff] text-slate-950 border border-[#00e5ff] shadow-[0_0_16px_rgba(0,229,255,0.6)]'
                  : ttsState === 'loading'
                  ? 'bg-slate-950 border border-slate-700 text-cyan-400/60 cursor-not-allowed opacity-70'
                  : ttsState === 'error'
                  ? `bg-red-950/40 border border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)] ${
                      isShaking ? 'animate-shake' : ''
                    }`
                  : 'bg-slate-950/90 hover:bg-cyan-950/40 border border-cyan-500/50 hover:border-cyan-400 text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.2)]'
              }`}
              title="Synthesize and play pre-landfall voice advisory via Gemini Flash TTS"
            >
              {ttsState === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Synthesizing...</span>
                </>
              ) : ttsState === 'playing' ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-950 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>Play Advisory</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Source Badge (No badge when idle) */}
          {voiceSource && (
            <div className="flex items-center justify-end -mt-0.5">
              <span
                id="voice-source-badge"
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shadow-sm transition-colors ${
                  voiceSource === 'gemini'
                    ? 'bg-cyan-950/60 text-[#00e5ff] border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                    : voiceSource === 'browser-hindi' || voiceSource === 'browser-english'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                    : 'bg-amber-950/60 text-[#f59e0b] border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                }`}
              >
                {voiceSource === 'gemini'
                  ? '🎙 Gemini 3.1 TTS'
                  : voiceSource === 'browser-hindi'
                  ? '🎙 Browser voice: Hindi'
                  : voiceSource === 'browser-english'
                  ? '🎙 Browser voice: English'
                  : `⚠️ Hindi voice fallback (native ${fallbackLangName} not installed)`}
              </span>
            </div>
          )}

          {/* Fallback Notice for Native Voice Pack */}
          {voiceSource === 'browser-fallback' ? (
            <div
              id="voice-fallback-notice"
              className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-md flex items-center gap-2 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                Native {fallbackLangName} voice not installed. Using Hindi voice — install voice pack from Windows Settings for native pronunciation.
              </span>
            </div>
          ) : (currentLanguage === 'or' || currentLanguage === 'odia') ? (
            <div
              id="odia-tts-notice"
              className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>Odia voice using Hindi fallback — pronunciation may vary</span>
            </div>
          ) : null}

          {/* Broadcast to Community Radios Button */}
          <button
            id="btn-broadcast-radios"
            onClick={() => setShowBroadcastModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950/90 hover:bg-amber-950/40 border border-amber-500/60 hover:border-amber-400 text-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            title="Simulate regional loudspeaker dispatch to community radio stations"
          >
            <Radio className="w-3.5 h-3.5 text-[#f59e0b] animate-pulse" />
            <span>Broadcast to Community Radios</span>
          </button>
        </div>

        {/* Advisory Body: Loading skeleton or actual content */}
        {isLoadingAdvisory || !advisory ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-center bg-slate-950/60 rounded-lg border border-red-500/20 p-4">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <p className="text-xs text-amber-300 font-mono font-semibold">
              Synthesizing Gemini Multilingual Anticipatory Advisory...
            </p>
            <p className="text-[10px] text-slate-500">
              Evaluating pre-landfall trajectory & coastal risk parameters
            </p>
          </div>
        ) : (
          <>
            {/* Human-in-the-Loop Approval Gate Banner */}
            {currentAdvisory?.approval_state === 'PENDING_APPROVAL' && (
              <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-3 my-2 shadow-md">
                <div className="text-amber-200 text-xs font-semibold flex items-center gap-1.5 font-mono">
                  <span>⏸ PENDING HUMAN APPROVAL</span>
                </div>
                <div className="text-amber-100 text-xs mt-1 leading-relaxed">
                  This advisory has not been dispatched. An authorized officer must approve before broadcast.
                </div>
                {isAuthorizedDispatcher && (
                  <div className="flex gap-2 mt-2.5">
                    <button
                      id="btn-approve-advisory"
                      onClick={approveAdvisory}
                      disabled={isApprovalActionLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1 disabled:opacity-50"
                    >
                      {isApprovalActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'} Approve & Dispatch
                    </button>
                    <button
                      id="btn-reject-advisory"
                      onClick={rejectAdvisory}
                      disabled={isApprovalActionLoading}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-mono font-bold cursor-pointer transition-colors shadow flex items-center gap-1 disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentAdvisory?.approval_state === 'DISPATCHED' && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-lg p-2.5 my-2 flex items-center justify-between text-xs text-emerald-200 font-mono">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✓ DISPATCHED TO AUTHORITIES</span>
                </div>
                <span className="text-[10px] text-emerald-400">
                  {currentAdvisory.approved_by ? `Approved by ${currentAdvisory.approved_by}` : 'Approved & Broadcast'}
                </span>
              </div>
            )}

            {currentAdvisory?.approval_state === 'REJECTED' && (
              <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-2.5 my-2 text-xs text-rose-200 font-mono">
                <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>✕ ADVISORY REJECTED</span>
                </div>
                <div className="text-[11px] text-rose-200 mt-1">
                  Reason: {currentAdvisory.rejection_reason || 'Rejected by operational reviewer'}
                </div>
              </div>
            )}

            {/* Multilingual Headline */}
            <div className="text-xs font-bold text-red-300 leading-tight">
              {headline}
            </div>

            {/* Dynamic Storm Surge & Wind Impact Highlights */}
            {(effectiveAdvisory.max_expected_wind_kmph || effectiveAdvisory.max_expected_surge_m) && (
              <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                {effectiveAdvisory.max_expected_wind_kmph && (
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                    Peak Wind: <span className="text-amber-400 font-bold">{effectiveAdvisory.max_expected_wind_kmph} km/h</span>
                  </span>
                )}
                {effectiveAdvisory.max_expected_surge_m && (
                  <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                    Max Surge: <span className="text-cyan-400 font-bold">+{effectiveAdvisory.max_expected_surge_m}m</span>
                  </span>
                )}
              </div>
            )}

            {/* Multilingual Detailed Warning */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {message}
            </p>

            {/* Recommended Immediate Actions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                TRIGGER PROTOCOL:
              </div>
              {actions.length > 0 ? (
                <div className="space-y-1.5">
                  {actions.map((act, idx) => (
                    <div key={idx} className="text-xs text-slate-300 pl-2 border-l-2 border-amber-500/50">
                      <span className="text-[10px] font-mono font-bold text-amber-400 mr-1.5">[{act.category}]</span>
                      <span>{act.action}</span>
                      {act.target_audience && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          Target: {act.target_audience} ({act.urgency?.replace(/_/g, ' ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-300 pl-2 border-l-2 border-amber-500/50">
                  {emergencyActions[langKey] ||
                    emergencyActions.english ||
                    emergencyActions.en}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 4. TrackLSTM Model Validation Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-yellow-400">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              MODEL VALIDATION
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 font-semibold">
            TrackLSTM v1
          </span>
        </div>

        {/* Training Badge */}
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[10px] font-mono leading-tight text-slate-300">
            Trained on IMD best-track data with synthetic augmentation
          </span>
        </div>

        {/* Validation Metric Grids */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Position RMSE @ 24h</div>
            <div className="text-sm font-bold text-yellow-400 mt-0.5">85.6 km</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Position RMSE @ 48h</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">155.6 km</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Wind Speed MAE</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">7.3 km/h</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Pressure MAE</div>
            <div className="text-sm font-bold text-indigo-400 mt-0.5">2.9 hPa</div>
          </div>
        </div>

        {/* Model Architecture & Training Metadata */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Model:</span>
            <span className="text-slate-200 font-semibold">LSTM 2-layer, 119,872 params</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Training samples:</span>
            <span className="text-slate-200 font-semibold">8,484</span>
          </div>
        </div>
      </div>

      {/* 5. Dual Model Forecast Comparison Card */}
      <ForecastComparisonCard
        key={`forecast-comp-${track?.id || selectedStormId}`}
        cycloneId={track?.id || (selectedStormId === 'amphan' ? 'BOB-01-2020' : 'BOB-02-2019')}
        track={track}
        activePointIndex={activePointIndex}
        currentTimeIndex={activePointIndex}
      />
    </aside>

    {/* Broadcast to Community Radio Network Modal */}
    {showBroadcastModal && (
      <div
        id="broadcast-community-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
        onClick={() => setShowBroadcastModal(false)}
      >
        <div
          className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100 relative shadow-[0_0_30px_rgba(245,158,11,0.15)] select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
                  SIMULATED BROADCAST — Community Radio Network
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Anticipatory Public Warning & Loudspeaker Dispatch
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Broadcast Details Grid */}
          <div className="space-y-2.5 text-xs font-mono bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">District:</span>
              <span className="text-cyan-300 font-bold">{selectedDistrict?.district_name || 'All Coastal Districts'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Network:</span>
              <span className="text-slate-200">All India Radio + 847 community loudspeakers</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Coverage:</span>
              <span className="text-emerald-400 font-semibold">92% of affected coastal area</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Schedule:</span>
              <span className="text-amber-300">Every 30 minutes for 6 hours</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="text-slate-400">Languages:</span>
              <span className="text-slate-200">Odia, Bengali, Telugu, Tamil, Hindi, English</span>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider block">Target Audience:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs font-sans pl-1">
              <li>Fisherfolk in coastal villages</li>
              <li>Kutcha households in low-lying zones</li>
              <li>Populations without smartphone access</li>
            </ul>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              id="btn-confirm-broadcast"
              onClick={() => {
                setShowBroadcastModal(false);
                showToast('Broadcast scheduled · 847 loudspeakers · next dispatch in 30 min', 'success');
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md hover:shadow-emerald-500/25 cursor-pointer"
            >
              Confirm Broadcast
            </button>
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Toast Notification Container */}
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-mono font-medium shadow-2xl border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/80 text-emerald-300 shadow-emerald-500/20'
              : 'bg-slate-900/95 border-red-500/80 text-red-300 shadow-red-500/20'
          }`}
        >
          {toast.type === 'success' ? (
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </>
);
};
