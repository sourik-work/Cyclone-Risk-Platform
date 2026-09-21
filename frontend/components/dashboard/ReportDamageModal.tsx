'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ReportDamageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultState?: string;
  defaultDistrict?: string;
}

const STATE_DISTRICTS: Record<string, string[]> = {
  Odisha: ['Puri', 'Kendrapara', 'Jagatsinghpur', 'Balasore', 'Bhadrak', 'Ganjam'],
  'West Bengal': ['South 24 Parganas', 'North 24 Parganas', 'Purba Medinipur'],
  'Andhra Pradesh': ['Visakhapatnam', 'Srikakulam', 'Vizianagaram', 'East Godavari'],
  'Tamil Nadu': ['Chennai', 'Cuddalore', 'Nagapattinam'],
};

interface CitizenReportResult {
  report_id: string;
  damage_severity: string;
  ai_analysis: string;
  image_url: string;
  created_at: string;
}

export const ReportDamageModal: React.FC<ReportDamageModalProps> = ({
  isOpen,
  onClose,
  defaultState = 'Odisha',
  defaultDistrict = 'Puri',
}) => {
  const [stateName, setStateName] = useState<string>(defaultState);
  const [district, setDistrict] = useState<string>(defaultDistrict);
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('19.8135');
  const [longitude, setLongitude] = useState<string>('85.8312');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CitizenReportResult | null>(null);

  useEffect(() => {
    if (isOpen && !result) {
      handleGeoLocate();
    }
  }, [isOpen]);

  useEffect(() => {
    const districts = STATE_DISTRICTS[stateName] || [];
    if (!districts.includes(district)) {
      setDistrict(districts[0] || '');
    }
  }, [stateName]);

  const handleGeoLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation lookup notice:', err.message);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!imagePreview) {
      setErrorMsg('Please select or capture a damage photo.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter a brief damage description.');
      return;
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg('Please enter valid coordinates.');
      return;
    }

    setSubmitting(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const payload = {
        description: description.trim(),
        latitude: latNum,
        longitude: lonNum,
        image_base64: imagePreview,
        state: stateName,
        district: district,
      };

      const resp = await fetch(`${backendUrl}/api/citizen/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (HTTP ${resp.status})`);
      }

      const reportData: CitizenReportResult = await resp.json();
      setResult(reportData);
    } catch (err: any) {
      console.error('Citizen report submission failed:', err);
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div
      id="report-damage-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="report-damage-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-slate-100 font-mono flex items-center gap-2">
                CITIZEN DAMAGE FIELD REPORT
              </h2>
              <p className="text-xs text-slate-400">
                Ground validation with Gemini 3.7 Flash multimodal severity analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          /* Success Screen with AI Assessment */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Report Successfully Submitted</h4>
                <p className="text-xs text-slate-300">
                  Uploaded to Cloud Storage & logged into Firestore dispatch queue.
                </p>
              </div>
            </div>

            {/* AI Analysis Summary Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-cyan-300">
                    Gemini 3.7 Flash Damage Assessment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {result.report_id}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      result.damage_severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : result.damage_severity === 'HIGH'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : result.damage_severity === 'MEDIUM'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {result.damage_severity} SEVERITY
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                "{result.ai_analysis}"
              </p>

              {result.image_url && (
                <div className="mt-2">
                  <div className="text-[11px] text-slate-400 mb-1 font-mono">GCS Public URI:</div>
                  <a
                    href={result.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline break-all truncate block bg-slate-900 p-2 rounded border border-slate-800"
                  >
                    {result.image_url}
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Submit Another Report
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Report Submission Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Photo Upload Area */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5 font-semibold">
                CYCLONE DAMAGE PHOTO (MAX 5MB)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-400/50 rounded-xl p-4 text-center bg-slate-950/50 transition-colors">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      className="max-h-44 rounded-lg object-contain border border-slate-700 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-500 shadow cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                    <Upload className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
                    <span className="text-xs font-medium text-slate-200">
                      Click to upload or take a photo
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      JPEG, PNG, or WEBP up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      capture="environment"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* State & District Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">
                  STATE
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                >
                  {Object.keys(STATE_DISTRICTS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">
                  DISTRICT
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                >
                  {(STATE_DISTRICTS[stateName] || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coordinates with Geo-locate Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">
                  INCIDENT COORDINATES
                </label>
                <button
                  type="button"
                  onClick={handleGeoLocate}
                  disabled={isLocating}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            {/* Damage Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">
                  DAMAGE OBSERVATIONS
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {description.length}/500 chars
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Describe visible damage (e.g. uprooted trees, collapsed thatched roofs, sea-water inundation, damaged utility poles)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 resize-none font-sans"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !imagePreview || !description.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Damage via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Submit Field Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
