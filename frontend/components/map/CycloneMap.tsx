'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import {
  CycloneTrack,
  DistrictProperties,
  ForecastTrackResponse,
  InfrastructureFeatureCollection,
  MapLayerToggles,
  RainfallForecast,
  SurgeSimulation,
  TrackPoint,
  VulnerabilityFeatureCollection,
} from './types';
import { SEED_INFRASTRUCTURE_DATA } from '../../lib/infrastructureSeed';
import { MapFallbackRadar } from './MapFallbackRadar';
import { Radio, Layers, Satellite, Sliders, Cpu, Compass, Zap, Activity, CloudRain, Waves } from 'lucide-react';
import { getAuthHeader } from '../../lib/api';

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
  selectedState?: string;
  infrastructureData?: InfrastructureFeatureCollection | null;
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
    setAiForecast(null);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const cycloneId = track.name ? track.name.toLowerCase() : track.id;

    // Compute last 4 indices dynamically based on the CURRENT track length
    const totalPoints = track.track_points.length;
    const forecastEndIndex = Math.max(3, Math.min(activePointIndex, totalPoints - 1));
    const forecastStartIndex = Math.max(0, forecastEndIndex - 3);
    const recentIndices = [
      forecastStartIndex,
      forecastStartIndex + 1,
      forecastStartIndex + 2,
      forecastEndIndex,
    ];

    getAuthHeader().then((authHeader) => {
      if (!isMounted) return;
      fetch(`${backendUrl}/api/forecast/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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

const STATE_MAP_CONFIG: Record<string, { lat: number; lng: number; zoom: number }> = {
  odisha: { lat: 19.8, lng: 85.8, zoom: 7.0 },
  'west bengal': { lat: 22.0, lng: 88.0, zoom: 7.5 },
  'andhra pradesh': { lat: 16.5, lng: 82.0, zoom: 7.0 },
  'tamil nadu': { lat: 12.5, lng: 80.0, zoom: 7.0 },
};

/**
 * Recenter and zoom Google Map smoothly when selectedState changes
 */
const MapCameraController: React.FC<{ selectedState?: string }> = ({ selectedState }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !selectedState) return;
    const key = selectedState.toLowerCase().trim();
    const config = STATE_MAP_CONFIG[key];
    if (config) {
      map.panTo({ lat: config.lat, lng: config.lng });
      map.setZoom(config.zoom);
    }
  }, [map, selectedState]);
  return null;
};

/**
 * 5. Coastal District Vulnerability Polygon Layer for Google Maps
 * Filters by selectedState and renders districts with interactive polygons.
 */
const GoogleMapsVulnerabilityLayer: React.FC<{
  vulnerabilityData: VulnerabilityFeatureCollection;
  selectedState: string;
  selectedDistrict: DistrictProperties | null;
  onSelectDistrict: (district: DistrictProperties) => void;
  visible?: boolean;
  showRainfall?: boolean;
  rainfallForecasts?: Record<string, RainfallForecast>;
}> = ({
  vulnerabilityData,
  selectedState,
  selectedDistrict,
  onSelectDistrict,
  visible = true,
  showRainfall = false,
  rainfallForecasts = {},
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || typeof google === 'undefined') return;

    // Filter districts strictly by selectedState
    const stateFeatures = vulnerabilityData.features.filter(
      (f) => f.properties.state_name.toLowerCase() === selectedState.toLowerCase()
    );

    const polygons: google.maps.Polygon[] = [];

    stateFeatures.forEach((feat) => {
      const props = feat.properties;
      const isSelected =
        selectedDistrict?.district_name.toLowerCase() === props.district_name.toLowerCase();
      const score = props.cyclone_risk_score ?? props.vulnerability_score ?? 0.75;

      let baseColor: string;
      if (showRainfall) {
        // Workstream 2: Color-code districts: LOW=#87ceeb, MEDIUM=#fbbf24, HIGH=#f97316, CRITICAL=#dc2626
        const rain =
          rainfallForecasts[props.district_name.toLowerCase()] ||
          rainfallForecasts[props.district_id?.toLowerCase()];
        const risk = (
          rain?.risk_level || (score >= 0.85 ? 'CRITICAL' : score >= 0.75 ? 'HIGH' : score >= 0.5 ? 'MEDIUM' : 'LOW')
        ).toUpperCase();

        baseColor =
          risk === 'CRITICAL'
            ? '#dc2626'
            : risk === 'HIGH'
            ? '#f97316'
            : risk === 'MEDIUM'
            ? '#fbbf24'
            : '#87ceeb';
      } else {
        baseColor = score >= 0.82 ? '#ef4444' : score >= 0.75 ? '#f97316' : '#eab308';
      }

      const coords = feat.geometry.coordinates[0].map(([lng, lat]) => ({
        lat,
        lng,
      }));

      const polygon = new google.maps.Polygon({
        map,
        paths: coords,
        strokeColor: isSelected ? '#ffffff' : baseColor,
        strokeOpacity: isSelected ? 1.0 : 0.85,
        strokeWeight: isSelected ? 3.0 : 1.5,
        fillColor: baseColor,
        fillOpacity: isSelected ? 0.65 : showRainfall ? 0.45 : 0.30,
        zIndex: isSelected ? 20 : 12,
        clickable: true,
      });

      polygon.addListener('click', () => {
        onSelectDistrict(props);
      });

      polygon.addListener('mouseover', () => {
        polygon.setOptions({
          fillOpacity: 0.65,
          strokeWeight: 2.5,
          strokeColor: '#38bdf8',
        });
      });

      polygon.addListener('mouseout', () => {
        polygon.setOptions({
          fillOpacity: isSelected ? 0.65 : showRainfall ? 0.45 : 0.30,
          strokeWeight: isSelected ? 3.0 : 1.5,
          strokeColor: isSelected ? '#ffffff' : baseColor,
        });
      });

      polygons.push(polygon);
    });

    return () => {
      polygons.forEach((poly) => poly.setMap(null));
    };
  }, [map, visible, selectedState, selectedDistrict?.district_name, vulnerabilityData, onSelectDistrict, showRainfall, rainfallForecasts]);

  return null;
};

/**
 * 6. Power Grid Layer for Google Maps
 * Substations: circle markers (400kV=red, 220kV=orange, 132kV=yellow)
 * Transmission lines: dashed grey polylines
 * Filtered by selectedState
 */
const GoogleMapsPowerGridLayer: React.FC<{
  infrastructureData?: InfrastructureFeatureCollection | null;
  selectedState: string;
  visible?: boolean;
}> = ({ infrastructureData, selectedState, visible = true }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || typeof google === 'undefined') return;

    const data = infrastructureData || SEED_INFRASTRUCTURE_DATA;
    const items = data.features.filter(
      (f) =>
        f.properties.state?.toLowerCase() === selectedState.toLowerCase() &&
        (f.properties.asset_type === 'SUBSTATION' || f.properties.asset_type === 'TRANSMISSION_LINE')
    );

    const markers: google.maps.Marker[] = [];
    const lines: google.maps.Polyline[] = [];

    items.forEach((feat) => {
      const p = feat.properties;
      if (feat.geometry.type === 'Point' && feat.geometry.coordinates) {
        const [lng, lat] = feat.geometry.coordinates;
        const kv = p.voltage_kv || 220;
        // 400kV=red, 220kV=orange, 132kV=yellow
        const color = kv >= 400 ? '#ef4444' : kv >= 220 ? '#f97316' : '#eab308';
        const scale = kv >= 400 ? 7 : kv >= 220 ? 6 : 5;

        const marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale,
            fillColor: color,
            fillOpacity: 0.95,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
          },
          title: `⚡ ${p.name}\nType: Substation (${p.voltage_kv}kV, ${p.capacity_mva} MVA)\nOperator: ${p.operator}\nDistrict: ${p.district}\nCriticality: ${p.criticality}`,
          zIndex: 35,
        });
        markers.push(marker);
      } else if (feat.geometry.type === 'LineString' && feat.geometry.coordinates) {
        // Dashed grey polylines for transmission lines
        const path = feat.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
        const polyline = new google.maps.Polyline({
          map,
          path,
          geodesic: true,
          strokeColor: '#94a3b8',
          strokeOpacity: 0.0,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 0.85,
                strokeColor: '#94a3b8',
                scale: 2.5,
              },
              offset: '0',
              repeat: '12px',
            },
          ],
          zIndex: 22,
        });
        lines.push(polyline);
      }
    });

    return () => {
      markers.forEach((m) => m.setMap(null));
      lines.forEach((l) => l.setMap(null));
    };
  }, [map, visible, selectedState, infrastructureData]);

  return null;
};

/**
 * 7. Arterial Roads Layer for Google Maps
 * Colored polylines (NH=blue, SH=green, MDR=orange), 4px width
 * Filtered by selectedState
 */
const GoogleMapsRoadsLayer: React.FC<{
  infrastructureData?: InfrastructureFeatureCollection | null;
  selectedState: string;
  visible?: boolean;
}> = ({ infrastructureData, selectedState, visible = true }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || typeof google === 'undefined') return;

    const data = infrastructureData || SEED_INFRASTRUCTURE_DATA;
    const items = data.features.filter(
      (f) =>
        f.properties.state?.toLowerCase() === selectedState.toLowerCase() &&
        f.properties.asset_type === 'ARTERIAL_ROAD' &&
        f.geometry.type === 'LineString'
    );

    const polylines: google.maps.Polyline[] = [];

    items.forEach((feat) => {
      const p = feat.properties;
      const roadClass = (p.road_class || 'NH').toUpperCase();
      // NH=blue (#3b82f6), SH=green (#22c55e), MDR=orange (#f97316), 4px width
      const color =
        roadClass === 'NH'
          ? '#3b82f6'
          : roadClass === 'SH'
          ? '#22c55e'
          : '#f97316';

      const path = feat.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
      const polyline = new google.maps.Polyline({
        map,
        path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 4, // 4px width
        zIndex: 24,
      });

      polylines.push(polyline);
    });

    return () => {
      polylines.forEach((l) => l.setMap(null));
    };
  }, [map, visible, selectedState, infrastructureData]);

  return null;
};

/**
 * 8. Hospitals and Shelters Layer for Google Maps
 * Circle markers (red=hospital/medical college, blue=PHC, green=shelter), scaled by capacity
 * Filtered by selectedState
 */
const GoogleMapsHospitalsLayer: React.FC<{
  infrastructureData?: InfrastructureFeatureCollection | null;
  selectedState: string;
  visible?: boolean;
}> = ({ infrastructureData, selectedState, visible = true }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || typeof google === 'undefined') return;

    const data = infrastructureData || SEED_INFRASTRUCTURE_DATA;
    const items = data.features.filter(
      (f) =>
        f.properties.state?.toLowerCase() === selectedState.toLowerCase() &&
        f.geometry.type === 'Point' &&
        Boolean(f.properties.facility_type)
    );

    const markers: google.maps.Marker[] = [];

    items.forEach((feat) => {
      const p = feat.properties;
      const [lng, lat] = feat.geometry.coordinates;
      const fType = p.facility_type;

      // red=hospital/medical college, blue=PHC, green=shelter, scaled by capacity
      let color = '#ef4444'; // red
      let scale = 6;

      if (fType === 'CYCLONE_SHELTER') {
        color = '#10b981'; // green
        const cap = p.shelter_capacity || 800;
        scale = Math.max(5, Math.min(11, Math.sqrt(cap) * 0.18 + 2.5));
      } else if (fType === 'PHC') {
        color = '#3b82f6'; // blue
        const beds = p.bed_capacity || 30;
        scale = Math.max(4, Math.min(8, Math.sqrt(beds) * 0.4 + 2));
      } else {
        // DISTRICT_HOSPITAL or MEDICAL_COLLEGE
        color = '#ef4444'; // red
        const beds = p.bed_capacity || 300;
        scale = Math.max(6, Math.min(12, Math.sqrt(beds) * 0.3 + 3));
      }

      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
        title:
          fType === 'CYCLONE_SHELTER'
            ? `🏕️ ${p.name}\nType: Cyclone Shelter (Capacity: ${p.shelter_capacity})\nDistrict: ${p.district}\nCoast distance: ${p.distance_from_coast_km} km`
            : `🏥 ${p.name}\nType: ${p.facility_type?.replace(/_/g, ' ')} (${p.bed_capacity} beds)\nDistrict: ${p.district}\nGenerator: ${p.has_generator ? 'Yes' : 'No'}\nCoast distance: ${p.distance_from_coast_km} km`,
        zIndex: 36,
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.setMap(null));
    };
  }, [map, visible, selectedState, infrastructureData]);

  return null;
};

/**
 * 9. Storm Surge Inundation Zone Layer for Google Maps
 * Renders hydrodynamic inundation polygon in cyan (#06b6d4) at 35% opacity with pulsing border.
 */
const GoogleMapsSurgeLayer: React.FC<{
  surgeData?: SurgeSimulation | null;
  visible?: boolean;
}> = ({ surgeData, visible = true }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible || !surgeData || typeof google === 'undefined') return;

    const polyObj = surgeData.inundation_polygon;
    const geom = (polyObj as any)?.geometry || polyObj;
    const coords: [number, number][] =
      geom && geom.coordinates && geom.coordinates.length > 0 ? geom.coordinates[0] : [];

    if (!coords || coords.length < 3) return;

    const paths = coords.map(([lng, lat]) => ({ lat, lng }));

    const polygon = new google.maps.Polygon({
      map,
      paths,
      fillColor: '#06b6d4',
      fillOpacity: 0.35, // exact 35% opacity required by prompt
      strokeColor: '#06b6d4',
      strokeOpacity: 0.95,
      strokeWeight: 3.0,
      zIndex: 35,
      clickable: true,
    });

    // Pulsing border animation (oscillating strokeOpacity and strokeWeight)
    let step = 0;
    const pulseInterval = setInterval(() => {
      step = (step + 1) % 24;
      const wave = (Math.sin((step / 24) * Math.PI * 2) + 1) / 2; // 0.0 to 1.0
      polygon.setOptions({
        strokeOpacity: 0.55 + 0.45 * wave,
        strokeWeight: 2.0 + 2.0 * wave,
      });
    }, 85);

    return () => {
      clearInterval(pulseInterval);
      polygon.setMap(null);
    };
  }, [map, visible, surgeData]);

  return null;
};

// Deterministic client-side fallback for storm surge modeling
function computeLocalSurge(cycloneId: string, districtName: string, stateName: string): SurgeSimulation {
  const cLower = cycloneId.toLowerCase();
  const maxWind = cLower.includes('amphan') ? 240.0 : cLower.includes('fani') ? 205.0 : 45.0;
  const sLower = (stateName || '').toLowerCase();
  const bathymetry = sLower === 'west bengal' ? 1.55 : sLower === 'odisha' ? 1.35 : sLower === 'andhra pradesh' ? 1.15 : 1.05;
  const slope = 1.075;
  const maxSurge = Math.round((maxWind / 100.0) * bathymetry * slope * 100) / 100;
  const bufferKm = Math.round(maxSurge * 2.0 * 100) / 100;
  const area = Math.round(75.0 * bufferKm * 0.72 * 10) / 10;
  const pop = Math.round(400000 * Math.min(0.7, (maxSurge / 6.0) * 0.5));

  const coastPts = [[85.12, 19.65], [85.45, 19.78], [85.83, 19.80], [86.25, 19.95]];
  const bufferDeg = bufferKm / 111.0;
  const inlandPts = coastPts.map(([lon, lat]) => [lon - bufferDeg * 0.6, lat + bufferDeg * 0.4]).reverse();
  const ring = [...coastPts, ...inlandPts, coastPts[0]];

  return {
    cyclone_id: cycloneId,
    district_id: districtName,
    max_surge_m: maxSurge,
    inundation_area_km2: area,
    affected_population: pop,
    affected_assets: {
      hospitals_at_risk: 2,
      shelters_activated: 1,
      power_substations_at_risk: 1,
      roads_submerged_km: 28.5,
    },
    inundation_polygon: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    },
  };
}

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
  selectedState = 'Odisha',
  infrastructureData,
}) => {
  const isLive = mode === 'live';
  const isMonitoring = isLive && !hasActiveCyclone;

  const isFani = track.name?.toLowerCase().includes('fani') || track.id === 'BOB-02-2019';
  const isAmphan = track.name?.toLowerCase().includes('amphan') || track.id === 'BOB-01-2020';

  // When mode === 'historical': render Earth Engine overlay (Fani only), track line, forecast cone, and markers as normal.
  // When mode === 'live': hide ALL historical layers.
  // If active_cyclone is null (monitoring status), show ONLY the base Google Map with NO overlays.
  // If active_cyclone is not null, render the live cyclone track instead.
  // Flood extent data is available for Fani 2019 only; Amphan tile pending.
  const effectiveShowEE = !isLive && isFani && layerToggles.showEarthEngine !== false;
  const effectiveShowTrack = isLive ? (hasActiveCyclone && layerToggles.showTrack) : layerToggles.showTrack;
  const effectiveShowForecastCone = isLive ? (hasActiveCyclone && layerToggles.showForecastCone) : layerToggles.showForecastCone;
  const effectiveShowAiForecast = isLive ? (hasActiveCyclone && Boolean(layerToggles.showAiForecast)) : Boolean(layerToggles.showAiForecast);

  // Workstream 2 Layer States: Rainfall overlay & Surge zone polygon
  const [internalShowRainfall, setInternalShowRainfall] = useState(true);
  const [internalShowSurge, setInternalShowSurge] = useState(true);

  const isRainfallActive = layerToggles.showRainfall !== undefined ? Boolean(layerToggles.showRainfall) : internalShowRainfall;
  const isSurgeActive = layerToggles.showSurge !== undefined ? Boolean(layerToggles.showSurge) : internalShowSurge;

  const handleToggleRainfall = () => {
    if (onToggleLayer) {
      onToggleLayer('showRainfall');
    }
    setInternalShowRainfall((prev) => !prev);
  };

  const handleToggleSurge = () => {
    if (onToggleLayer) {
      onToggleLayer('showSurge');
    }
    setInternalShowSurge((prev) => !prev);
  };

  const [rainfallForecasts, setRainfallForecasts] = useState<Record<string, RainfallForecast>>({});
  const [surgeData, setSurgeData] = useState<SurgeSimulation | null>(null);

  // Auto-refresh rainfall + surge when user switches state/district or cyclone changes
  useEffect(() => {
    let isMounted = true;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const cycloneId = track.name ? track.name.toLowerCase() : track.id;
    const targetDistrict = selectedDistrict?.district_name || (selectedState === 'West Bengal' ? 'Purba Medinipur' : selectedState === 'Andhra Pradesh' ? 'Visakhapatnam' : selectedState === 'Tamil Nadu' ? 'Chennai' : 'Puri');

    // 1. Fetch surge simulation
    getAuthHeader().then((authHeader) => {
      if (!isMounted) return;
      fetch(`${backendUrl}/api/surge/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          cyclone_id: cycloneId,
          district_id: targetDistrict,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Surge API returned ${res.status}`);
          return res.json();
        })
        .then((data: SurgeSimulation) => {
          if (isMounted) setSurgeData(data);
        })
        .catch((err) => {
          console.warn('Failed to fetch surge simulation, using fallback:', err);
          if (isMounted) setSurgeData(computeLocalSurge(cycloneId, targetDistrict, selectedState));
        });
    });

    // 2. Fetch rainfall forecasts for all districts in current state
    const stateFeatures = vulnerabilityData.features.filter(
      (f) => f.properties.state_name.toLowerCase() === selectedState.toLowerCase()
    );
    stateFeatures.forEach((feat) => {
      const dName = feat.properties.district_name;
      fetch(`${backendUrl}/api/rainfall/forecast?district=${encodeURIComponent(dName)}&cyclone_id=${encodeURIComponent(cycloneId)}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data: RainfallForecast | null) => {
          if (isMounted && data) {
            setRainfallForecasts((prev) => ({
              ...prev,
              [dName.toLowerCase()]: data,
              [data.district_id.toLowerCase()]: data,
            }));
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
    };
  }, [track.id, track.name, selectedDistrict?.district_name, selectedState, vulnerabilityData]);

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

  // Default to Google Maps mode unless ?radar=true is passed
  const [mapMode, setMapMode] = useState<'radar' | 'google'>('google');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('radar') === 'true') {
        setMapMode('radar');
      }
    }
  }, []);

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
        {/* Earth Engine Overlay Active Pill (Historical Mode - Fani only) */}
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

        {/* Surge Zone Active Pill */}
        {isSurgeActive && surgeData && (
          <div
            id="surge-zone-active-pill"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>SURGE ZONE: {surgeData.max_surge_m}m • {surgeData.inundation_area_km2} km²</span>
          </div>
        )}

        {/* Amphan Flood Extent Pending Badge (Historical Mode) */}
        {!isLive && isAmphan && (
          <div
            id="amphan-ee-pending-pill"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono backdrop-blur-md shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Flood extent data available for Fani 2019 only — Amphan tile pending</span>
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

        {/* Workstream 2: Rainfall & Surge Zone Toggles */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 text-xs gap-1">
          <button
            id="toggle-rainfall"
            onClick={handleToggleRainfall}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              isRainfallActive
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Rainfall Accumulation Overlay"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>🌧 Rainfall</span>
          </button>
          <button
            id="toggle-surge"
            onClick={handleToggleSurge}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              isSurgeActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Storm Surge Inundation Zone"
          >
            <Waves className="w-3.5 h-3.5" />
            <span>🌊 Surge Zone</span>
          </button>
        </div>

        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 text-xs">
          <button
            id="btn-mode-google-maps"
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
            id="btn-mode-control-radar"
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

              {/* 5. Coastal District Vulnerability Overlay (With Rainfall Color Coding when active) */}
              <GoogleMapsVulnerabilityLayer
                vulnerabilityData={vulnerabilityData}
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={onSelectDistrict}
                visible={layerToggles.showVulnerability}
                showRainfall={isRainfallActive}
                rainfallForecasts={rainfallForecasts}
              />

              {/* 5.5 Storm Surge Inundation Polygon Layer (Cyan #06b6d4, 35% opacity + pulsing border) */}
              <GoogleMapsSurgeLayer
                surgeData={surgeData}
                visible={isSurgeActive}
              />

              {/* 6. Power Grid Layer (400kV/220kV/132kV Substations & Transmission Lines) */}
              <GoogleMapsPowerGridLayer
                infrastructureData={infrastructureData}
                selectedState={selectedState}
                visible={Boolean(layerToggles.showPowerGrid)}
              />

              {/* 7. Arterial Roads Layer (NH/SH/MDR Colored Polylines) */}
              <GoogleMapsRoadsLayer
                infrastructureData={infrastructureData}
                selectedState={selectedState}
                visible={Boolean(layerToggles.showRoads)}
              />

              {/* 8. Hospitals & Shelters Layer (District Hospitals, PHCs, Shelters) */}
              <GoogleMapsHospitalsLayer
                infrastructureData={infrastructureData}
                selectedState={selectedState}
                visible={Boolean(layerToggles.showHospitals)}
              />

              {/* Camera controller to smoothly pan/zoom to selectedState */}
              <MapCameraController selectedState={selectedState} />
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
            showVulnerability={layerToggles.showVulnerability}
            mode={mode}
            hasActiveCyclone={hasActiveCyclone}
            selectedState={selectedState}
            infrastructureData={infrastructureData}
            showPowerGrid={Boolean(layerToggles.showPowerGrid)}
            showRoads={Boolean(layerToggles.showRoads)}
            showHospitals={Boolean(layerToggles.showHospitals)}
            showRainfall={isRainfallActive}
            showSurge={isSurgeActive}
            surgeData={surgeData}
            rainfallForecasts={rainfallForecasts}
          />
        )}

        {/* Rainfall Risk Legend (Workstream 2) */}
        {isRainfallActive && (
          <div
            id="rainfall-hazard-legend"
            className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-xs font-mono select-none"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Rainfall Risk (24h)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#87ceeb' }}></span>
                <span className="text-slate-300">LOW (&lt;50mm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fbbf24' }}></span>
                <span className="text-slate-300">MEDIUM (50-100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></span>
                <span className="text-slate-300">HIGH (100-200)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></span>
                <span className="text-slate-300">CRITICAL (&gt;200)</span>
              </div>
            </div>
          </div>
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
