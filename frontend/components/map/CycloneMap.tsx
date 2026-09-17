'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import {
  CycloneTrack,
  DistrictProperties,
  ForecastTrackResponse,
  MapLayerToggles,
  TrackPoint,
  VulnerabilityFeatureCollection,
} from './types';
import { MapFallbackRadar } from './MapFallbackRadar';
import { Radio, Layers, Satellite, Sliders, Cpu, Compass } from 'lucide-react';

const AUTHENTICATED_EE_TILE_URL =
  'https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}?key=AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw';

interface CycloneMapProps {
  track: CycloneTrack;
  activePointIndex: number;
  vulnerabilityData: VulnerabilityFeatureCollection;
  selectedDistrict: DistrictProperties | null;
  onSelectDistrict: (district: DistrictProperties) => void;
  layerToggles: MapLayerToggles;
  mode?: 'historical' | 'live';
  hasActiveCyclone?: boolean;
  onToggleLayer?: (layerKey: keyof MapLayerToggles) => void;
}

/**
 * 1. Earth Engine ImageMapType Overlay
 * Mounts Google Earth Engine raster tiles via ImageMapType with 0.7 opacity.
 * Substitutes {z}/{x}/{y} dynamically on every tile request.
 */
const EarthEngineTileOverlay: React.FC<{
  tileUrl: string;
  opacity?: number;
  visible?: boolean;
}> = ({ tileUrl, opacity = 0.7, visible = true }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || !tileUrl) return;

    // Create google.maps.ImageMapType for Google Earth Engine satellite raster overlay
    const eeMapType = new google.maps.ImageMapType({
      getTileUrl: (coord: google.maps.Point, zoom: number): string => {
        // Dynamically replace {z}/{x}/{y} placeholders intact for each requested tile
        return tileUrl
          .replace('{z}', String(zoom))
          .replace('{x}', String(coord.x))
          .replace('{y}', String(coord.y));
      },
      tileSize: new google.maps.Size(256, 256),
      name: 'Google Earth Engine Satellite Overlay',
      maxZoom: 18,
      minZoom: 0,
      opacity: opacity, // Overlay opacity set to 0.7 so base map remains visible
    });

    // Push into map.overlayMapTypes
    map.overlayMapTypes.push(eeMapType);

    return () => {
      // Clean up overlay when layer toggled off or unmounted
      const overlays = map.overlayMapTypes.getArray();
      const index = overlays.indexOf(eeMapType);
      if (index !== -1) {
        map.overlayMapTypes.removeAt(index);
      }
    };
  }, [map, tileUrl, opacity, visible]);

  return null;
};

/**
 * 2. Separate Storm Track Layer for Google Maps
 * Renders observed track line, forecast line, observation points, and storm eye.
 */
const GoogleMapsTrackLayer: React.FC<{
  track: CycloneTrack;
  activePointIndex: number;
  visible?: boolean;
}> = ({ track, activePointIndex, visible = true }) => {
  const map = useMap();

  const activePoint: TrackPoint =
    track.track_points[activePointIndex] || track.track_points[0];

  const pastPoints = useMemo(
    () => track.track_points.slice(0, activePointIndex + 1),
    [track, activePointIndex]
  );

  const forecastPoints = useMemo(
    () => track.track_points.slice(activePointIndex),
    [track, activePointIndex]
  );

  useEffect(() => {
    if (!map || !visible || typeof google === 'undefined') return;

    // 1. Observed trajectory polyline
    const pastPath = pastPoints.map((p) => ({ lat: p.latitude, lng: p.longitude }));
    const pastPolyline = new google.maps.Polyline({
      map,
      path: pastPath,
      geodesic: true,
      strokeColor: '#00e5ff', // bright cyan
      strokeOpacity: 0.95,
      strokeWeight: 4,
      zIndex: 20,
    });

    // 2. Forecast trajectory polyline (dashed amber)
    let forecastPolyline: google.maps.Polyline | null = null;
    if (forecastPoints.length > 1) {
      const forecastPath = forecastPoints.map((p) => ({ lat: p.latitude, lng: p.longitude }));
      forecastPolyline = new google.maps.Polyline({
        map,
        path: forecastPath,
        geodesic: true,
        strokeColor: '#f59e0b', // amber
        strokeOpacity: 0.0,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.9,
              strokeColor: '#f59e0b',
              scale: 3,
            },
            offset: '0',
            repeat: '14px',
          },
        ],
        zIndex: 19,
      });
    }

    // 3. Past point circle markers
    const pointMarkers: google.maps.Marker[] = pastPoints.map((p, idx) => {
      const isEye = idx === pastPoints.length - 1;
      return new google.maps.Marker({
        map,
        position: { lat: p.latitude, lng: p.longitude },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isEye ? 8 : 4.5,
          fillColor: isEye ? '#ef4444' : '#06b6d4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: isEye ? 2.5 : 1,
        },
        title: `${track.name} - ${p.category} (${p.wind_speed_kmph || Math.round(p.wind_speed_knots * 1.852)} km/h)`,
        zIndex: isEye ? 30 : 21,
      });
    });

    return () => {
      pastPolyline.setMap(null);
      if (forecastPolyline) forecastPolyline.setMap(null);
      pointMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, visible, pastPoints, forecastPoints, track.name]);

  return (
    <>
      {/* Active Storm Center Marker */}
      {visible && (
        <Marker
          position={{ lat: activePoint.latitude, lng: activePoint.longitude }}
          title={`CYCLONE ${track.name.toUpperCase()}: ${activePoint.category}`}
        />
      )}
    </>
  );
};

/**
 * 3. Separate Forecast Uncertainty Cone Layer for Google Maps
 * Renders 24h/48h forecast cone polygon envelope across Bay of Bengal.
 */
const GoogleMapsUncertaintyConeLayer: React.FC<{
  track: CycloneTrack;
  activePointIndex: number;
  visible?: boolean;
}> = ({ track, activePointIndex, visible = true }) => {
  const map = useMap();

  const forecastPoints = useMemo(
    () => track.track_points.slice(activePointIndex),
    [track, activePointIndex]
  );

  useEffect(() => {
    if (!map || !visible || forecastPoints.length < 2 || typeof google === 'undefined') return;

    // Calculate left and right envelope coordinates based on cone_radius_km
    const leftCoords: { lat: number; lng: number }[] = [];
    const rightCoords: { lat: number; lng: number }[] = [];

    forecastPoints.forEach((pt, idx) => {
      const radiusKm = pt.cone_radius_km || (idx * 25);
      const radiusDeg = radiusKm / 111.0; // 1 deg approx 111 km

      // Perpendicular displacement
      leftCoords.push({
        lat: pt.latitude,
        lng: pt.longitude - radiusDeg,
      });
      rightCoords.unshift({
        lat: pt.latitude,
        lng: pt.longitude + radiusDeg,
      });
    });

    const conePolygon = new google.maps.Polygon({
      map,
      paths: [...leftCoords, ...rightCoords],
      fillColor: '#f59e0b',
      fillOpacity: 0.22,
      strokeColor: '#d97706',
      strokeOpacity: 0.75,
      strokeWeight: 1.5,
      zIndex: 10,
    });

    return () => {
      conePolygon.setMap(null);
    };
  }, [map, visible, forecastPoints]);

  return null;
};

/**
 * 4. AI Forecast Trajectory Layer (TrackLSTM)
 * Renders the 48-hour LSTM predicted trajectory (dashed yellow) starting from the last observed point.
 */
const GoogleMapsAiForecastLayer: React.FC<{
  track: CycloneTrack;
  activePointIndex: number;
  visible?: boolean;
}> = ({ track, activePointIndex, visible = true }) => {
  const map = useMap();
  const [aiForecast, setAiForecast] = useState<ForecastTrackResponse | null>(null);

  // Fetch forecast whenever track changes or layer becomes visible
  useEffect(() => {
    if (!visible || !track.track_points || track.track_points.length < 4) {
      return;
    }

    let isMounted = true;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const cycloneId = track.name ? track.name.toLowerCase() : track.id;

    // Use the 4 observed points leading up to the active point
    const endIdx = Math.max(3, Math.min(activePointIndex, track.track_points.length - 1));
    const startIdx = Math.max(0, endIdx - 3);
    const recentIndices = [startIdx, startIdx + 1, startIdx + 2, startIdx + 3];

    fetch(`${backendUrl}/api/forecast/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cyclone_id: cycloneId,
        recent_point_indices: recentIndices,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Forecast API returned ${res.status}`);
        return res.json();
      })
      .then((data: ForecastTrackResponse) => {
        if (isMounted) {
          setAiForecast(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch AI forecast from TrackLSTM service:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [track.id, track.name, track.track_points, activePointIndex, visible]);

  useEffect(() => {
    if (!map || !visible || !aiForecast || typeof google === 'undefined') return;

    const activePoint = track.track_points[activePointIndex] || track.track_points[0];

    // Trajectory starting from the last observed point
    const forecastCoords = [
      { lat: activePoint.latitude, lng: activePoint.longitude },
      ...aiForecast.model_forecast.map((p) => ({ lat: p.lat, lng: p.lon })),
    ];

    // Dashed yellow line for TrackLSTM prediction
    const aiPolyline = new google.maps.Polyline({
      map,
      path: forecastCoords,
      geodesic: true,
      strokeColor: '#facc15', // yellow-400
      strokeOpacity: 0.0,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1.0,
            strokeColor: '#facc15',
            scale: 3.5,
          },
          offset: '0',
          repeat: '14px',
        },
      ],
      zIndex: 25,
    });

    // Circular yellow waypoint markers at 12h, 24h, 36h, 48h
    const waypointMarkers: google.maps.Marker[] = [];
    aiForecast.model_forecast.forEach((pt) => {
      if ([12, 24, 36, 48].includes(pt.lead_hours)) {
        const marker = new google.maps.Marker({
          map,
          position: { lat: pt.lat, lng: pt.lon },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#facc15',
            fillOpacity: 1,
            strokeColor: '#713f12',
            strokeWeight: 2,
          },
          title: `TrackLSTM T+${pt.lead_hours}h Forecast: ${pt.wind_kmph} km/h, ${pt.pressure_hpa} hPa`,
          zIndex: 26,
        });
        waypointMarkers.push(marker);
      }
    });

    return () => {
      aiPolyline.setMap(null);
      waypointMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, visible, aiForecast, activePointIndex, track.track_points]);

  return null;
};

export const CycloneMap: React.FC<CycloneMapProps> = ({
  track,
  activePointIndex,
  vulnerabilityData,
  selectedDistrict,
  onSelectDistrict,
  layerToggles,
  mode = 'historical',
  hasActiveCyclone = false,
  onToggleLayer,
}) => {
  const isLive = mode === 'live';
  const isMonitoring = isLive && !hasActiveCyclone;

  // When mode === 'historical': render Earth Engine overlay, track line, forecast cone, and markers as normal.
  // When mode === 'live': hide ALL historical layers.
  // If active_cyclone is null (monitoring status), show ONLY the base Google Map with NO overlays.
  // If active_cyclone is not null, render the live cyclone track instead.
  const effectiveShowEE = !isLive && layerToggles.showEarthEngine !== false;
  const effectiveShowTrack = isLive ? (hasActiveCyclone && layerToggles.showTrack) : layerToggles.showTrack;
  const effectiveShowForecastCone = isLive ? (hasActiveCyclone && layerToggles.showForecastCone) : layerToggles.showForecastCone;
  const effectiveShowAiForecast = isLive ? (hasActiveCyclone && Boolean(layerToggles.showAiForecast)) : Boolean(layerToggles.showAiForecast);

  // Read key and tile URL from env with fallback to authenticated credentials
  const envKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBWf8E_V67W3PenTBi2Q5OR2MU-DDCk1jw';

  const envEeUrl =
    process.env.NEXT_PUBLIC_EE_TILE_URL || AUTHENTICATED_EE_TILE_URL;

  const [apiKey, setApiKey] = useState<string>(envKey);
  const [eeTileUrl, setEeTileUrl] = useState<string>(envEeUrl);
  const [eeOpacity, setEeOpacity] = useState<number>(0.7); // Configured at 0.7 opacity
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const [tempEeUrlInput, setTempEeUrlInput] = useState<string>(envEeUrl);

  // Default to Google Maps mode when key is present
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('google');

  const handleSaveConfig = () => {
    if (tempKeyInput.trim()) {
      setApiKey(tempKeyInput.trim());
      setMapMode('google');
    }
    if (tempEeUrlInput.trim()) {
      setEeTileUrl(tempEeUrlInput.trim());
    }
    setShowConfigModal(false);
  };

  // Dark control-room map styling for Google Maps base layer
  const darkMapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#09101d' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#09101d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#38bdf8' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#475569' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#172238' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#0f172a' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#050b16' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#0284c7' }],
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Earth Engine Overlay Active Pill (Historical Mode) */}
        {effectiveShowEE && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Satellite className="w-3.5 h-3.5" />
            <span>EARTH ENGINE 0.7 OVERLAY ACTIVE</span>
          </div>
        )}

        {/* Live Monitoring Active Pill (Live Mode - No Active Cyclone) */}
        {isMonitoring && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE BASE MAP • BASIN MONITORING</span>
          </div>
        )}

        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 text-xs">
          <button
            onClick={() => setMapMode('google')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              mapMode === 'google'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Google Maps + EE
          </button>
          <button
            onClick={() => setMapMode('radar')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              mapMode === 'radar'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Control Radar
          </button>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          title="Configure Google Maps & Earth Engine Overlays"
          className="p-2 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full min-h-[500px]">
        {mapMode === 'google' && apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat: 19.2, lng: 86.2 }}
              defaultZoom={6.5}
              gestureHandling={'greedy'}
              disableDefaultUI={false}
              styles={darkMapStyles}
              className="w-full h-full rounded-xl overflow-hidden border border-slate-800"
            >
              {/* 1. Earth Engine ImageMapType Overlay (Opacity: 0.7) - Historical only */}
              <EarthEngineTileOverlay
                tileUrl={eeTileUrl}
                opacity={eeOpacity}
                visible={effectiveShowEE}
              />

              {/* 2. Storm Track Separate Layer (Observed + Forecast) - Historical or Live Active */}
              <GoogleMapsTrackLayer
                track={track}
                activePointIndex={activePointIndex}
                visible={effectiveShowTrack}
              />

              {/* 3. Uncertainty Cone Separate Layer - Historical or Live Active */}
              <GoogleMapsUncertaintyConeLayer
                track={track}
                activePointIndex={activePointIndex}
                visible={effectiveShowForecastCone}
              />

              {/* 4. AI Forecast Trajectory Layer (TrackLSTM - Dashed Yellow Line) */}
              <GoogleMapsAiForecastLayer
                track={track}
                activePointIndex={activePointIndex}
                visible={effectiveShowAiForecast}
              />

              {/* NOTE: Mock vulnerability overlay is completely disabled per project instructions. Real satellite data replaces it. */}
            </Map>
          </APIProvider>
        ) : (
          <MapFallbackRadar
            track={track}
            activePointIndex={activePointIndex}
            vulnerabilityData={vulnerabilityData}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={onSelectDistrict}
            showTrack={effectiveShowTrack}
            showForecastCone={effectiveShowForecastCone}
            showVulnerability={false} // Disabled: replaced by real satellite data
            mode={mode}
            hasActiveCyclone={hasActiveCyclone}
          />
        )}

        {/* 5. Corner Legend: IMD Official (solid) vs AI Forecast (dashed) */}
        {effectiveShowAiForecast && (
          <div
            id="forecast-comparison-legend"
            className="absolute bottom-6 left-6 z-20 flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-xs font-mono select-none"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-yellow-400" />
              <span>IMD Official (solid) vs AI Forecast (dashed)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-1 rounded-full bg-[#00e5ff] shadow-sm shadow-cyan-500/50"></span>
                <span className="text-cyan-300 font-medium">IMD Official Track</span>
              </div>
              <span className="text-[10px] text-slate-500">Official Bulletin</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-yellow-400"></span>
                <span className="text-yellow-300 font-medium">AI Forecast</span>
              </div>
              <span className="text-[10px] text-yellow-400 font-bold">TrackLSTM</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
              <span>RMSE: 85.6 km @ 24h</span>
              <span className="text-emerald-400 font-semibold">119K Params</span>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">GIS & Earth Engine Overlays</h3>
                <p className="text-xs text-slate-400">Google Maps Platform & Authenticated Earth Engine Tiles</p>
              </div>
            </div>

            {/* Earth Engine Tile URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Earth Engine Tile URL (ImageMapType)</span>
                <span className="text-[10px] text-emerald-400 font-mono">AUTHENTICATED</span>
              </label>
              <textarea
                rows={3}
                value={tempEeUrlInput}
                onChange={(e) => setTempEeUrlInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Substitutes <code className="text-cyan-300">{"{z}/{x}/{y}"}</code> dynamically for each tile.
              </p>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Overlay Opacity (Default: 70%)</span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(eeOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={eeOpacity}
                onChange={(e) => setEeOpacity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Google Maps API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Google Maps API Key</span>
                <code className="text-[10px] text-cyan-400 font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={tempKeyInput || apiKey}
                onChange={(e) => setTempKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
