'use client';

import React, { useState } from 'react';
import {
  Brain,
  Database,
  Cpu,
  Sparkles,
  ShieldCheck,
  Radio,
  X,
  Layers,
  CheckCircle2,
  FileCode,
  Eye,
  AlertTriangle,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'sar' | 'prompt' | 'schema' | 'anti-hallucination'>('pipeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-950 border border-blue-500/30 shadow-2xl p-6 text-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>How the Anticipatory AI Pipeline Works</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Gemini 3.7 Flash Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end provenance: Multi-sensor radar raster → Hydrodynamic physics → Multimodal LLM → Fact-checked dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            1. Pipeline Architecture
          </button>
          <button
            onClick={() => setActiveTab('sar')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'sar'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            2. SAR Flood Raster & Grid
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'prompt'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            3. Actual Gemini Prompt
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            4. Structured Output Schema
          </button>
          <button
            onClick={() => setActiveTab('anti-hallucination')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'anti-hallucination'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            5. Anti-Hallucination Guardrails
          </button>
        </div>

        {/* TAB 1: PIPELINE ARCHITECTURE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4 text-xs">
            {/* Visual Step-by-Step Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
                  <Database className="w-4 h-4" />
                  <span>STEP 1: Ingestion</span>
                </div>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li>Sentinel-1 SAR 10m C-Band</li>
                  <li>GFS 0.25° NWP Wind Grids</li>
                  <li>WorldPop 100m Demographics</li>
                  <li>OSM / State Power Grid</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-blue-400">
                  <Cpu className="w-4 h-4" />
                  <span>STEP 2: Physics Models</span>
                </div>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li>TrackLSTM Sequence Model</li>
                  <li>SLOSH/ADCIRC 2D Surge Solver</li>
                  <li>GEBCO 15-arcsec Bathymetry</li>
                  <li>DEM Inundation Routing</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>STEP 3: Multimodal AI</span>
                </div>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li>Gemini 3.7 Flash Model</li>
                  <li>Multimodal SAR Tile Ingestion</li>
                  <li>Critical Asset Exposure Logic</li>
                  <li>Localized T-12h Action Plans</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
                  <Radio className="w-4 h-4" />
                  <span>STEP 4: Dispatch</span>
                </div>
                <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                  <li>Fact-Check Grounding Filter</li>
                  <li>Odia / Bengali / Telugu TTS</li>
                  <li>CAP v1.2 / SMS / Radio Feed</li>
                  <li>Parametric Insurance Triggers</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-slate-300 leading-relaxed text-[11.5px]">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Why Hybrid Physics + Multimodal AI?
              </h4>
              <p>
                Pure statistical machine learning lacks hydrodynamic physical conservation laws, while raw physics simulations (like SLOSH/ADCIRC) cannot interpret human infrastructure vulnerabilities or generate multilingual human-actionable advisories. Our platform couples numerical boundary-condition simulations with <strong>Gemini 3.7 Flash</strong> multimodal spatial reasoning.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SAR FLOOD RASTER & GRID */}
        {activeTab === 'sar' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Synthetic Visual Representation of SAR Thresholding */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-cyan-400 font-mono font-bold text-xs">
                  <span>Sentinel-1 SAR C-Band Inundation Tile</span>
                  <span className="text-[10px] bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700">10m Ground Resolution</span>
                </div>
                
                {/* SVG Mock of SAR Backscatter thresholding */}
                <div className="h-44 rounded-lg bg-slate-950 border border-slate-800 p-2 relative overflow-hidden flex flex-col justify-between">
                  <div className="grid grid-cols-8 gap-1 h-32 opacity-80">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const isWater = [3, 4, 11, 12, 13, 19, 20, 21, 22, 27, 28, 29].includes(i);
                      return (
                        <div
                          key={i}
                          className={`rounded flex items-center justify-center text-[8px] font-mono ${
                            isWater
                              ? 'bg-cyan-600/40 border border-cyan-400 text-cyan-200'
                              : 'bg-slate-800/60 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {isWater ? '-19dB' : '-9dB'}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded">
                    <span>Specular Reflection: <strong className="text-cyan-300">σ° ≤ -16 dB (Standing Floodwater)</strong></span>
                    <span className="text-amber-300">Dry Terrain: σ° &gt; -12 dB</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  Smooth standing flood surfaces cause specular reflection away from the radar antenna, registering as low radar backscatter (≤ -16dB in cross-polarization VH/VV).
                </p>
              </div>

              {/* WorldPop Demographic Grid Overlay */}
              <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-blue-400 font-mono font-bold text-xs">
                  <span>Spatial Demographic Intersection</span>
                  <span className="text-[10px] bg-blue-950 px-1.5 py-0.5 rounded border border-blue-700">WorldPop 100m Grid</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-slate-400">Total Inundated Footprint:</span>
                    <span className="text-cyan-300 font-bold">142.6 km²</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-slate-400">Kutcha (Thatch/Mud) Households:</span>
                    <span className="text-amber-400 font-bold">38,420 (68.2%)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-1">
                    <span className="text-slate-400">Elderly / Infant Density:</span>
                    <span className="text-rose-400 font-bold">14.8% vulnerable</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Substations within Surge Zone:</span>
                    <span className="text-red-300 font-bold">2 OPTCL Grid Sub.</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  By intersecting the SAR flood polygons with the 100m census grid, Gemini receives exact counts of high-risk populations rather than generic district averages.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTUAL GEMINI PROMPT */}
        {activeTab === 'prompt' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> Production System Prompt (gemini-3.7-flash)
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded">
                Temperature: 0.2 · Response MIME: application/json
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/80 border border-slate-800 font-mono text-[10.5px] text-slate-300 max-h-72 overflow-y-auto space-y-2 leading-relaxed">
              <p className="text-emerald-400">
                // SYSTEM INSTRUCTION:
              </p>
              <p>
                You are the Lead Anticipatory Action Meteorologist and Disaster Risk Engineer for the Cyclone Risk Platform (NDMA/ODRAF/IMD).
              </p>
              <p className="text-blue-300">
                // CONTEXT INPUT INGESTION:
              </p>
              <p>
                - Storm: Cyclone Fani (Category 4 Super Cyclonic Storm)<br/>
                - Target District: Puri, Odisha (Landfall Lat: 19.81°N, Lon: 85.83°E)<br/>
                - Current Peak Sustained Wind: 215 km/h (Gusts to 240 km/h)<br/>
                - Central Pressure: 937 hPa · Inverted Barometer Surge: 3.2m<br/>
                - Sentinel-1 SAR Flooded Area: 142.6 km² along Brahmagiri/Astaranga belt<br/>
                - Exposed Infrastructure: Puri 220kV Grid Substation (OPTCL), NH-316 arterial corridor, Konark Multi-Purpose Shelter (1,800 cap)
              </p>
              <p className="text-amber-300">
                // OUTPUT MANDATE:
              </p>
              <p>
                Generate an operational anticipatory advisory conforming strictly to the Pydantic JSON schema. Provide:
                1. Concise narrative of hydrodynamic compound risk (wind + surge + grid outage)
                2. Prioritized critical asset vulnerabilities with engineering reasons
                3. T-12h and T-6h actionable directives for ODRAF, DISCOM power engineers, and coastal collectors.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: STRUCTURED OUTPUT SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-mono text-purple-400 font-bold flex items-center gap-1.5">
                <FileCode className="w-4 h-4" /> Received Pydantic Structured JSON Output
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                SCHEMA VALIDATED
              </span>
            </div>

            <pre className="p-3.5 rounded-xl bg-black/80 border border-slate-800 font-mono text-[10.5px] text-purple-200 max-h-72 overflow-y-auto leading-relaxed">
{`{
  "advisory_id": "ADV-FANI-PURI-2026-09",
  "district_name": "Puri",
  "confidence": "HIGH",
  "model": "gemini-3.7-flash",
  "reasoning_source": "gemini-3.7-flash-multimodal",
  "narrative": "Compound hazard event: 215 km/h cyclonic winds combined with a 3.2m astronomical-coupled storm surge will breach the Astaranga coastal dyke within 8 hours. High risk of 220kV transmission line tripping leading to prolonged power failure at District Hospital.",
  "critical_assets": [
    {
      "name": "Puri 220kV Grid Substation (OPTCL)",
      "reason": "Located in 3.2m surge zone; water ingress will trip primary busbars causing blackouts across 450,000 consumers."
    },
    {
      "name": "NH-316 Arterial Highway",
      "reason": "Low-lying section near Pipili vulnerable to 1.2m flash accumulation, cutting off primary evacuation corridor to Bhubaneswar."
    }
  ],
  "recommended_actions": [
    "Pre-stage mobile dewatering pumps at Puri 220kV substation by T-8h.",
    "Execute mandatory evacuation of 38,420 kutcha households to designated RCC cyclone shelters.",
    "Switch hospital emergency lifelines to islanded diesel generator microgrids."
  ]
}`}
            </pre>
          </div>
        )}

        {/* TAB 5: ANTI-HALLUCINATION GUARDRAILS */}
        {activeTab === 'anti-hallucination' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 font-mono font-bold text-emerald-300 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Deterministic Fact-Checking & Anti-Hallucination Layer</span>
              </div>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                Large language models can hallucinate non-existent hospital names, incorrect voltage ratings, or inaccurate evacuation zones. To make our platform fully defensible for enterprise and government deployment, we enforce a 3-tier deterministic grounding pipeline:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] space-y-1.5">
                <div className="font-mono font-bold text-cyan-300 text-xs">1. Cadastral DB Cross-Check</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  Every asset mentioned in the AI narrative is matched against our verified state infrastructure database (OPTCL, OSM, National Health Portal). Unverified names are rejected.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] space-y-1.5">
                <div className="font-mono font-bold text-amber-300 text-xs">2. Physical Bounds Filter</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  Wind speeds and surge estimates generated by AI are verified against numerical bounds derived from the Holland Vortex Model and SLOSH simulation limits.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] space-y-1.5">
                <div className="font-mono font-bold text-purple-300 text-xs">3. Human-in-the-Loop Sign-Off</div>
                <p className="text-slate-400 text-[11px] leading-snug">
                  Advisories remain in PENDING status until an authorized operational dispatcher inspects the reasoning and issues a digital cryptographic sign-off.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>AI Architecture: Google Gemini 3.7 Flash · Multimodal Spatial Reasoning</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            Close Pipeline Guide
          </button>
        </div>
      </div>
    </div>
  );
};
