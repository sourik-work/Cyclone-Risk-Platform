'use client';

import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Sliders, Satellite, Info } from 'lucide-react';

export interface Sentinel2LayerConfig {
  id: string;
  name: string;
  type: 'NDVI' | 'NDWI';
  palette: 'red' | 'blue';
  tileUrl: string;
  preWindow: string;
  postWindow: string;
  opacity: number;
  visible: boolean;
}

export interface MapOverlayProps {
  cycloneId?: string;
  onLayerChange?: (layers: Sentinel2LayerConfig[]) => void;
  className?: string;
}

const DEFAULT_SENTINEL2_LAYERS: Sentinel2LayerConfig[] = [
  {
    id: 'fani_ndvi_change',
    name: 'Vegetation Loss (NDVI)',
    type: 'NDVI',
    palette: 'red',
    tileUrl: 'https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}',
    preWindow: '2019-04-01..2019-05-02',
    postWindow: '2019-05-04..2019-06-03',
    opacity: 0.65,
    visible: true,
  },
  {
    id: 'fani_ndwi_change',
    name: 'Water Extent Gain (NDWI)',
    type: 'NDWI',
    palette: 'blue',
    tileUrl: 'https://earthengine.googleapis.com/v1/projects/cyclone-risk-platform/maps/b3a9fb812b939765aa9e34a318c3149b-39495b43e12ed39f1a31ec4eae471f26/tiles/{z}/{x}/{y}',
    preWindow: '2019-04-01..2019-05-02',
    postWindow: '2019-05-04..2019-06-03',
    opacity: 0.60,
    visible: true,
  },
];

export const MapOverlay: React.FC<MapOverlayProps> = ({
  cycloneId,
  onLayerChange,
  className = '',
}) => {
  const [layers, setLayers] = useState<Sentinel2LayerConfig[]>(DEFAULT_SENTINEL2_LAYERS);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleLayerVisibility = (layerId: string) => {
    const updated = layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
    setLayers(updated);
    if (onLayerChange) onLayerChange(updated);
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    const updated = layers.map((l) => (l.id === layerId ? { ...l, opacity } : l));
    setLayers(updated);
    if (onLayerChange) onLayerChange(updated);
  };

  return (
    <div className={`relative font-mono text-xs ${className}`}>
      {/* Overlay Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
        title="Toggle Sentinel-2 Optical Change Layers"
      >
        <Satellite className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-[11px]">Sentinel-2 Change Overlays</span>
        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] border border-emerald-500/40">
          LIVE
        </span>
      </button>

      {/* Layer Config Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-10 left-0 z-40 w-80 bg-slate-950/95 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xl backdrop-blur-md text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Layers className="w-4 h-4" />
              <span>Sentinel-2 Change Detection</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="text-[10px] text-slate-400 leading-tight">
            Harmonized Sentinel-2 surface reflectance change (Red = Vegetation Loss, Blue = Flood Inundation Gain).
          </div>

          {/* Layer List */}
          <div className="space-y-2.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className={`p-1 rounded transition-colors ${
                        layer.visible
                          ? layer.palette === 'red'
                            ? 'text-rose-400 bg-rose-950/60'
                            : 'text-blue-400 bg-blue-950/60'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className="font-semibold text-[11px] text-slate-200">{layer.name}</div>
                      <div className="text-[9px] text-slate-400">
                        {layer.preWindow} → {layer.postWindow}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      layer.palette === 'red'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {layer.palette === 'red' ? '🔴 RED PALETTE' : '🔵 BLUE PALETTE'}
                  </span>
                </div>

                {/* Opacity Slider */}
                {layer.visible && (
                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Layer Opacity</span>
                      <span className="font-mono font-bold text-slate-200">
                        {(layer.opacity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapOverlay;
