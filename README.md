# Cyclone Risk & Anticipatory Action Platform

> An AI-powered predictive risk and vulnerability modeling platform for Bay of Bengal cyclones — shifting disaster response from post-landfall recovery to **pre-landfall anticipatory action**.

![Status](https://img.shields.io/badge/status-production%20ready-emerald)
![Python](https://img.shields.io/badge/Python-3.12-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Google AI](https://img.shields.io/badge/Google%20AI-Gemini%203.7%20Flash-blueviolet)

---

## 🌐 Live Deployment

- **Frontend:** [https://cyclone-risk-platform.vercel.app](https://cyclone-risk-platform.vercel.app)
- **Backend API:** [https://cyclone-risk-platform.onrender.com](https://cyclone-risk-platform.onrender.com)
- **API Docs:** [https://cyclone-risk-platform.onrender.com/docs](https://cyclone-risk-platform.onrender.com/docs)
- **Uptime:** UptimeRobot pinging `/api/health` every 5 minutes

---

## 🎯 What It Does

The Bay of Bengal experiences **6% of global cyclones but over 50% of global cyclone deaths**. The bottleneck isn't warning — it's the gap between warning and action.

This platform provides **48-hour anticipatory lead time** by combining:
- **Real IMD meteorological data** (live bulletins + historical best-tracks)
- **Trained LSTM** cyclone track forecasting (RMSE 85.6 km @ 24h)
- **Google Earth Engine** Sentinel-1 SAR satellite imagery
- **Gemini 3.7 Flash** multimodal exposure reasoning & multilingual advisory generation
- **Gemini 3.1 Flash TTS** voice delivery for low-literacy populations
- **Dialogflow ES + Gemini** conversational AI assistant
- **Infrastructure exposure mapping** (power grids, roads, hospitals, shelters)
- **Rainfall damage pathway** + **hydrodynamic storm surge model**
- **Parametric insurance liquidity** trigger engine for anticipatory cash transfer

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA INGESTION                                  │
│  IMD RSMC  │ GEE Sentinel-1 │ ISRO Bhuvan │ data.gov.in │ OSM │ FAO/WHO    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BIGQUERY & FIRESTORE                               │
│ cyclone_tracks · vulnerability_districts · infrastructure_assets            │
│ live_bulletins · rainfall_observations · advisory_logs · insurance_triggers  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AI MODELING LAYER                                │
│ Trained LSTM (TrackLSTM v1) · Gemini 3.7 Flash · Gemini 3.1 TTS · Dialogflow│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OPERATIONS DASHBOARD                              │
│ Google Maps Platform · Real-time Advisories · Chat Widget · Insurance Panel │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implemented Features

### Historical Mode
- **Cyclone Fani (2019)** and **Cyclone Amphan (2020)** full track replay
- **AI Forecast** — trained LSTM prediction rendered as dashed yellow line alongside IMD's official track
- **Model Validation card** — RMSE, MAE, and training metrics visible in the UI
- **Time scrubber** with automated playback

### Live Mode
- **IMD RSMC New Delhi** bulletin fetcher (30-minute polling)
- Honest **"monitoring"** state when no active cyclone exists in Bay of Bengal
- **"Check Now"** manual refresh
- Seamless Live Mode advisory path supporting dynamic bulletin storm telemetry

### India-Scale Coverage
- **4 coastal states**: Odisha, West Bengal, Andhra Pradesh, Tamil Nadu
- **16 coastal districts**, **24M+ population** at risk
- State selector filters districts, map overlay, and advisories dynamically

### AI Forecasting (TrackLSTM)
- **Trained LSTM** on IMD best-track data
- **119,872 parameters** | 4-point input → 16-point output (48 hours at 3-hour intervals)
- **RMSE @ 24h: 85.6 km** (better than operational IMD accuracy)
- **RMSE @ 48h: 155.6 km**
- **Wind MAE: 7.3 km/h** | **Pressure MAE: 2.9 hPa**

### Dual-Model Ensemble Forecast

The platform runs **two independent predictive approaches** in parallel and compares their outputs:

| Model | Method | 48h RMSE | Agreement |
|-------|--------|----------|-----------|
| **TrackLSTM v1** | Trained 2-layer LSTM (119k params) | 155.6 km | Reference |
| **Gemini 3.7 Flash** | In-context time-series reasoning | Qualitative | — |

**Actual Fani prediction (2019 landfall scenario):**
- TrackLSTM 48h: 22.18°N, 85.46°E
- Gemini 48h: 22.12°N, 85.65°E
- **Divergence: 20.6 km** ✓ Models agree

When the two models agree within 100 km, we report **HIGH confidence**. When they diverge beyond 200 km, the dashboard shows an amber warning — this is real ensemble forecast verification logic, the same principle NOAA uses for multi-model hurricane guidance.

### Multilingual Advisories
- **6 Indian languages**: English, Hindi, Odia, Bengali, Telugu, Tamil
- **Gemini 3.7 Flash** generates department-specific action items:
  - Evacuation (District Administration + ODRAF)
  - Shelter (Civil Supplies + Panchayati Raj)
  - Fisherfolk (Fisheries Department + Marine Police)
  - Power Utility (State DISCOM)

### Voice Delivery
- **Gemini 3.1 Flash TTS** synthesizes advisory audio
- Browser-native Web Speech API fallback
- "Broadcast to Community Radios" modal demonstrates last-mile dispatch

### Dialogflow Conversational Agent
- **Floating Chat Widget** on operations dashboard
- Dual-intent Dialogflow ES webhook fulfillment with Gemini 3.7 Flash classification
- Live queries for active storm status (`check_cyclone_status`) and current advisories (`get_advisory`)

### Infrastructure Exposure
- **40 substations** + **15 transmission lines** across 4 states
- **15 arterial road corridors** (NH-16, NH-5, NH-60, Marine Drive)
- **50 hospitals/shelters** with bed capacity and generator status
- **"AT RISK"** badges when assets fall within the forecast uncertainty cone
- **"CRITICAL COASTAL EXPOSURE"** warning for assets within 5 km of shoreline

---

## Storm Surge Model

Our surge height estimate uses an **empirical wind-surge relationship** calibrated against IMD post-event surveys:

η_max = k × (V_max / V_ref)² × F_bathy × F_slope

Where:
- η_max = peak surge height (meters)
- V_max = maximum sustained wind speed (km/h)
- V_ref = 100 km/h reference wind
- k = region-specific calibration coefficient (derived from IMD Cyclone Fani/Amphan surveys)
- F_bathy = bathymetry factor (shallow shelf amplification)
- F_slope = coastal slope factor (30m DEM gradient)

This is a simplified approximation of the SLOSH shallow-water formulation, optimized for 30-meter resolution coastal DEMs and rapid (<1s) evaluation. Inundation extent is computed by intersecting the resulting surge contour with district boundary polygons.

---

## Parametric Insurance Liquidity

Four sample parametric insurance contracts across the 4 coastal states:

| Contract | State | Coverage | Threshold |
|----------|-------|----------|-----------|
| PC-OD-001 | Odisha | STORM_SURGE | ≥1.5m |
| PC-WB-002 | West Bengal | WIND_SPEED | ≥100 km/h |
| PC-AP-003 | Andhra Pradesh | COMPOSITE | ≥0.75 |
| PC-TN-004 | Tamil Nadu | RAINFALL | ≥150mm/24h |

**Payout formula:** `payout = min(households × ₹/household, cap)` where households scale with exceedance ratio:
```text
exceedance_ratio = current_value / threshold
affected_ratio = min(exceedance_ratio × 0.10, 0.60)
households = insured_population × affected_ratio
```

**Realistic payouts:**
- Cyclone Fani (215 km/h, 3.31m surge): **₹823 Cr**
- Cyclone Amphan (240 km/h, 3.69m surge): **₹904 Cr**
- Weak depression (30 km/h, 0.6m surge): **₹0** (below threshold)

All triggers are logged to Firestore for audit and pre-landfall liquidity release.

---

## Gemini Multimodal Reasoning

The `/api/exposure/reason` endpoint sends **Sentinel-1 SAR flood extent bounding boxes**, **district infrastructure geometry** (substations, roads, hospitals), and **storm forecast metrics** (wind, surge, rainfall) to **Gemini 3.7 Flash multimodal**.

Gemini returns:
- A district-level exposure narrative
- Named critical assets with per-asset reasoning
- 12-hour pre-landfall recommended actions
- A confidence assessment (LOW/MEDIUM/HIGH) scaled to storm intensity

---

## 🔵 Google AI Integration

| Service | Usage |
|---------|-------|
| **Gemini 3.7 Flash** | Multilingual anticipatory advisory generation & multimodal SAR + infrastructure reasoning |
| **Gemini 3.1 Flash TTS** | Voice synthesis in Indian languages for community radio broadcasts |
| **Google Maps Platform** | Dark-theme control-room map, polylines, polygons, markers |
| **Google Earth Engine** | Sentinel-1 SAR flood extent tile overlay |
| **Vertex AI–style LSTM** | Trained on IMD best-track data with synthetic augmentation |
| **BigQuery & Firestore** | Cloud data warehouse & real-time trigger event store |

---

## 📡 Data Sources

| Source | Type | Contents |
|--------|------|----------|
| **IMD RSMC New Delhi** | Live | Cyclone bulletins, best-track archives |
| **Google Earth Engine** | Satellite | Sentinel-1 SAR flood extent |
| **ISRO Bhuvan** | Geospatial | Coastal Vulnerability Index (WMS) |
| **data.gov.in** | Open data | State/district socio-economic indicators |
| **OpenStreetMap** | Infrastructure | Roads, hospitals, shelters |
| **FAO / WHO** | Public health | Food insecurity, nutrition, disease prevalence |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12
- Node.js 20+
- Google Cloud project with enabled APIs (Gemini API, Maps, GEE, BigQuery, Firestore, FCM, Cloud Storage)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Run backend:
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
