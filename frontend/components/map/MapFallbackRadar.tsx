'use client';

import React, { useState } from 'react';
import { CycloneTrack, TrackPoint, VulnerabilityFeatureCollection } from './types';
import { Shield, Waves } from 'lucide-react';

interface MapFallbackRadarProps {
  track: CycloneTrack;
  activePointIndex: number;
  vulnerabilityData: VulnerabilityFeatureCollection;
  selectedDistrict: DistrictProperties | null;
  onSelectDistrict: (district: DistrictProperties) => void;
  showTrack: boolean;
  showForecastCone: boolean;
  showVulnerability: boolean;
  mode?: 'historical' | 'live';
  hasActiveCyclone?: boolean;
  selectedState?: string;
}

import { DistrictProperties } from './types';

export const MapFallbackRadar: React.FC<MapFallbackRadarProps> = ({
  track,
  activePointIndex,
  vulnerabilityData,
  selectedDistrict,
  onSelectDistrict,
  showTrack,
  showForecastCone,
  showVulnerability,
  mode = 'historical',
  hasActiveCyclone = false,
  selectedState = 'Odisha',
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictProperties | null>(null);

  // Geographic bounds for Bay of Bengal & Odisha view
  // Longitude: 80.0°E to 93.0°E (width 13 deg)
  // Latitude: 2.0°N to 25.0°N (height 23 deg)
  const minLon = 81.0;
  const maxLon = 92.0;
  const minLat = 2.0;
  const maxLat = 24.5;

  const width = 800;
  const height = 900;

  // Project lat/lon to SVG space
  const project = (lat: number, lon: number): [number, number] => {
    const x = ((lon - minLon) / (maxLon - minLon)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    return [x, y];
  };

  const activePoint: TrackPoint = track.track_points[activePointIndex] || track.track_points[0];
  const [activeX, activeY] = project(activePoint.latitude, activePoint.longitude);

  // Split points into observed up to activePointIndex and remaining
  const visiblePastPoints = track.track_points.slice(0, activePointIndex + 1);
  const futureForecastPoints = track.track_points.slice(activePointIndex + 1);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Super Cyclonic Storm':
        return '#c026d3'; // fuchsia-600
      case 'Extremely Severe Cyclonic Storm':
        return '#ef4444'; // red-500
      case 'Very Severe Cyclonic Storm':
        return '#f97316'; // orange-500
      case 'Severe Cyclonic Storm':
        return '#eab308'; // yellow-500
      case 'Cyclonic Storm':
        return '#22c55e'; // green-500
      default:
        return '#06b6d4'; // cyan-500
    }
  };

  return (
    <div className="relative w-full h-full bg-[#070d18] overflow-hidden rounded-xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center select-none">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Control-room status watermark */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        RADAR VECTOR VISUALIZER • BAY OF BENGAL
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full object-contain filter drop-shadow"
      >
        <defs>
          {/* Radial radar scan effect */}
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>

          {/* Uncertainty cone gradient */}
          <linearGradient id="coneGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.15" />
          </linearGradient>

          {/* Pulse animation */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Coarse Coastline Reference for Bay of Bengal / East Coast India */}
        <path
          d="M 120 700 Q 130 650 140 600 T 170 500 T 210 380 T 260 280 T 320 200 T 400 130 T 520 100 T 650 110 T 750 140"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />

        {/* Latitude & Longitude Guides */}
        {[5, 10, 15, 20].map((lat) => {
          const [, y] = project(lat, 85);
          return (
            <g key={`lat-${lat}`}>
              <line x1="0" y1={y} x2={width} y2={y} stroke="#172554" strokeWidth="0.8" strokeDasharray="3 4" />
              <text x="12" y={y - 4} fill="#475569" fontSize="10" fontFamily="monospace">
                {lat}°N
              </text>
            </g>
          );
        })}
        {[82, 85, 88, 91].map((lon) => {
          const [x] = project(15, lon);
          return (
            <g key={`lon-${lon}`}>
              <line x1={x} y1="0" x2={x} y2={height} stroke="#172554" strokeWidth="0.8" strokeDasharray="3 4" />
              <text x={x + 4} y={height - 12} fill="#475569" fontSize="10" fontFamily="monospace">
                {lon}°E
              </text>
            </g>
          );
        })}

        {/* Coastal Vulnerability Polygons (Filtered by selectedState) */}
        {showVulnerability &&
          vulnerabilityData.features
            .filter(
              (feature) =>
                !selectedState ||
                feature.properties.state_name.toLowerCase() === selectedState.toLowerCase()
            )
            .map((feature) => {
              const props = feature.properties;
              const points = feature.geometry.coordinates[0]
                .map(([lon, lat]) => project(lat, lon).join(','))
                .join(' ');

              const isSelected = selectedDistrict?.district_name.toLowerCase() === props.district_name.toLowerCase();
              const isHovered = hoveredDistrict?.district_name.toLowerCase() === props.district_name.toLowerCase();

              const score = props.cyclone_risk_score ?? props.vulnerability_score ?? 0.75;

              // Risk-based fill color
              const fillColor =
                score >= 0.82
                  ? '#ef4444' // severe red
                  : score >= 0.75
                  ? '#f97316' // high orange
                  : '#eab308'; // warning yellow

              return (
                <g
                  key={props.district_id || props.district_name}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onSelectDistrict(props)}
                  onMouseEnter={() => setHoveredDistrict(props)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                >
                  <polygon
                    points={points}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.65 : isHovered ? 0.5 : 0.28}
                    stroke={isSelected ? '#ffffff' : fillColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {/* District Label */}
                  {feature.geometry.coordinates[0][0] && (
                    <text
                      x={project(feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0])[0] + 5}
                      y={project(feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0])[1] - 5}
                      fill={isSelected ? '#ffffff' : '#cbd5e1'}
                      fontSize="11"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none drop-shadow"
                    >
                      {props.district_name}
                    </text>
                  )}
                </g>
              );
            })}

        {/* Uncertainty Forecast Cone */}
        {showForecastCone && futureForecastPoints.length > 0 && (
          <g>
            {/* Draw uncertainty boundary polygon connecting current point and forecast uncertainty buffers */}
            {(() => {
              const lastPast = visiblePastPoints[visiblePastPoints.length - 1];
              const [startX, startY] = project(lastPast.latitude, lastPast.longitude);

              const leftPoints: [number, number][] = [];
              const rightPoints: [number, number][] = [];

              futureForecastPoints.forEach((pt) => {
                const [fx, fy] = project(pt.latitude, pt.longitude);
                const radiusPx = ((pt.cone_radius_km || 40) / 111) * (height / (maxLat - minLat));
                leftPoints.push([fx - radiusPx, fy]);
                rightPoints.unshift([fx + radiusPx, fy]);
              });

              const allPolygonPoints = [
                `${startX},${startY}`,
                ...leftPoints.map((p) => `${p[0]},${p[1]}`),
                ...rightPoints.map((p) => `${p[0]},${p[1]}`),
              ].join(' ');

              return (
                <polygon
                  points={allPolygonPoints}
                  fill="url(#coneGradient)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              );
            })()}
          </g>
        )}

        {/* Historical Track Line */}
        {showTrack && visiblePastPoints.length > 1 && (
          <polyline
            points={visiblePastPoints
              .map((pt) => project(pt.latitude, pt.longitude).join(','))
              .join(' ')}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Forecast Track Line (Dashed) */}
        {showTrack && futureForecastPoints.length > 0 && (
          <polyline
            points={[
              project(activePoint.latitude, activePoint.longitude).join(','),
              ...futureForecastPoints.map((pt) => project(pt.latitude, pt.longitude).join(',')),
            ].join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        )}

        {/* Track Observation Markers */}
        {showTrack &&
          visiblePastPoints.map((pt, idx) => {
            const [x, y] = project(pt.latitude, pt.longitude);
            const isCurrent = idx === activePointIndex;
            const color = getCategoryColor(pt.category);

            return (
              <g key={`track-pt-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 6 : 4}
                  fill={color}
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              </g>
            );
          })}

        {/* Forecast Target Points */}
        {showTrack &&
          futureForecastPoints.map((pt, idx) => {
            const [x, y] = project(pt.latitude, pt.longitude);
            return (
              <g key={`forecast-pt-${idx}`}>
                <polygon
                  points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

        {/* Active Storm Center Eye Pulse (Only when active cyclone or historical) */}
        {showTrack && (hasActiveCyclone || mode === 'historical') && (
          <g transform={`translate(${activeX}, ${activeY})`}>
            {/* Animated radar rings */}
            <circle r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
            <circle r="44" fill="url(#radarSweep)" />
            <circle r="14" fill="#ef4444" opacity="0.3" />
            <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" filter="url(#glow)" />

            {/* Wind Speed Badge */}
            <g transform="translate(14, -14)">
              <rect x="0" y="0" width="80" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1.2" />
              <text x="6" y="15" fill="#fca5a5" fontSize="10" fontFamily="monospace" fontWeight="bold">
                {activePoint.wind_speed_kmph || Math.round(activePoint.wind_speed_knots * 1.852)} km/h
              </text>
            </g>
          </g>
        )}

        {/* Basin Monitoring Status Watermark (Live Mode with No Active Cyclones) */}
        {mode === 'live' && !hasActiveCyclone && (
          <g transform={`translate(${width / 2}, ${height / 2})`}>
            <circle r="70" fill="none" stroke="#10b981" strokeWidth="1.2" opacity="0.3" strokeDasharray="6 4" />
            <circle r="4" fill="#10b981" />
            <text y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontFamily="monospace" fontWeight="bold">
              BAY OF BENGAL BASIN • ALL CLEAR
            </text>
            <text y="42" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
              Continuous IMD RSMC telemetry active
            </text>
          </g>
        )}
      </svg>

      {/* Floating Hover Info Pill */}
      {hoveredDistrict && (
        <div className="absolute bottom-6 left-6 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs max-w-xs space-y-1">
          <div className="font-bold text-slate-100 flex items-center justify-between">
            <span>{hoveredDistrict.district_name} ({hoveredDistrict.state_name})</span>
            <span className="text-red-400 font-mono">Risk: {(hoveredDistrict.cyclone_risk_score * 100).toFixed(0)}%</span>
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            Surge Risk: <span className="text-slate-200 font-medium">{hoveredDistrict.storm_surge_risk_m}m</span>
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Shelter Capacity: <span suppressHydrationWarning className="text-slate-200 font-medium">{new Intl.NumberFormat('en-US').format(hoveredDistrict.shelter_capacity)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
