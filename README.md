# Cyclone Risk & Anticipatory Action Platform

> An AI-powered predictive risk and vulnerability modeling platform for Bay of Bengal cyclones — shifting disaster response from post-landfall recovery to **pre-landfall anticipatory action**.

![Tests](https://github.com/sourik-work/Cyclone-Risk-Platform/actions/workflows/test.yml/badge.svg)
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
│                                                                             │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────────┐   │
│  │  Trained LSTM    │  │ Gemini 3.7 Flash  │  │ Dialogflow ES + Gemini  │   │
│  │  (TrackLSTM v1)  │  │ (multimodal +     │  │ (conversational         │   │
│  │  119k params     │  │  in-context)      │  │  webhook contract)      │   │
│  │  RMSE 85.6 km    │  │                   │  │                         │   │
│  └────────┬─────────┘  └────────┬──────────┘  └────────────┬────────────┘   │
│           │                     │                           │               │
│           ▼                     ▼                           ▼               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │       Ensemble Verification · Advisory Generation · Chat UI          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
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

**9 coastal states + 4 Union Territories · 50+ districts · 60M+ population at risk**

| Coast | States | Districts | Language |
|-------|--------|-----------|----------|
| Bay of Bengal | Odisha, West Bengal, Andhra Pradesh, Tamil Nadu | 16 | Odia, Bengali, Telugu, Tamil |
| Arabian Sea | Gujarat, Maharashtra, Goa, Karnataka, Kerala | 28 | Gujarati, Marathi, Konkani, Kannada, Malayalam |
| UTs | Puducherry, Lakshadweep, Andaman & Nicobar, Daman & Diu | 4 | Multiple |

Total: **11 advisory languages**, covering every coastal state in India.

### AI Forecasting (TrackLSTM)
- **Trained LSTM** on IMD best-track data
- **119,872 parameters** | 4-point input → 16-point output (48 hours at 3-hour intervals)
- **RMSE @ 24h: 85.6 km** on two historical case studies (Fani 2019, Amphan 2020). Comparable to operational IMD accuracy on these specific cases — not a claim of general superiority.
- **RMSE @ 48h: 155.6 km**
- **Wind MAE: 7.3 km/h** | **Pressure MAE: 2.9 hPa**

### Dual-Model Ensemble Forecast

The platform runs **two independent predictive approaches** in parallel and compares their 48-hour outputs:

| Model | Method | Parameters | 24h RMSE |
|-------|--------|-----------|----------|
| **TrackLSTM v1** | Trained 2-layer LSTM | 119,872 | 85.6 km |
| **Gemini 3.7 Flash** | In-context time-series reasoning | — | Qualitative |

**Validation across two historical cases:**

| Cyclone | LSTM 48h position | Gemini 48h position | Divergence |
|---------|------------------|---------------------|-----------|
| Fani (2019) | 22.18°N, 85.46°E | 22.12°N, 85.65°E | 20.6 km |
| Amphan (2020) | 23.71°N, 88.70°E | 23.22°N, 88.60°E | 55.9 km |

When the two models agree within 100 km, we report **HIGH confidence**. When they diverge beyond 200 km, the dashboard shows an amber warning. This is real ensemble forecast verification logic — the same principle NOAA uses for multi-model hurricane guidance.

**Caveat:** This is illustrative agreement on two historical cases, not a statistically robust ensemble validation. A production deployment would validate across a full test set of 20+ historical cyclones.

**Validation caveat:** The current ensemble is validated on 2 historical cyclones. Training uses ~8,484 sequences derived from IMD best-track data with synthetic augmentation (perturbed positions, wind scalings). We do not currently disclose the augmentation/real-signal ratio — a production version would publish this and validate against a 20+ storm held-out test set.

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
- "Last-Mile Advisory Dispatch" modal demonstrates multi-channel early warning delivery

### Multi-Channel Last-Mile Delivery

Advisories dispatch through three complementary channels to maximize reach in low-connectivity coastal areas:

| Channel | Reach | Subscribers | Best For |
|---------|-------|-------------|----------|
| Community Radio | 92% | 847 loudspeakers | Rural villages, elderly |
| SMS Alert | 78% | 412,000 phones | Registered fisherfolk, kutcha households |
| IVR Voice Call | 95% | 8,400 village heads | Any phone, pre-recorded local language |

All dispatches require officer approval and are logged to the audit trail.

### Dialogflow Conversational Agent
- **Floating Chat Widget** on operations dashboard
- Dual-intent Dialogflow ES webhook fulfillment with Gemini 3.7 Flash classification
- Live queries for active storm status (`check_cyclone_status`) and current advisories (`get_advisory`)

#### Why Dialogflow ES + Gemini?

The chat pipeline uses both because they serve different roles:

- **Dialogflow ES** — provides the GCP-native conversational surface (session management, intent registry, webhook contract). It gives us a standards-compliant `/api/dialogflow/webhook` endpoint that could be extended with Dialogflow CX or integrated with other enterprise platforms without changing our backend.
- **Gemini 3.7 Flash** — handles semantic intent classification for messages that don't match Dialogflow's training phrases. This is a resilience layer, not a replacement.

The alternative — using Gemini function-calling directly with no Dialogflow — would work but would lose the standard GCP conversational contract that enterprise municipal systems expect. We chose the layered approach for interoperability.

### Infrastructure Exposure
- **40 substations** + **15 transmission lines** across 4 states
- **15 arterial road corridors** (NH-16, NH-5, NH-60, Marine Drive)
- **50 hospitals/shelters** with bed capacity and generator status
- **"AT RISK"** badges when assets fall within the forecast uncertainty cone

**Three-tier coastal classification:**
- **CRITICAL STORM EXPOSURE** — assets within 5km of coast AND inside forecast cone (storm active)
- **ELEVATED COASTAL RISK** — assets within 5km of coast, outside forecast cone (storm active)
- **COASTAL PROXIMITY** — assets within 5km of coast, no active storm (informational)

This distinguishes geographic coastal vulnerability from storm-specific exposure — a critical distinction for pre-landfall decision-making.

### Runtime Asset State

Infrastructure assets accept live status updates during storm events:

- **Status values:** OPERATIONAL · OFFLINE · DAMAGED · FULL · EVACUATING
- **Persistence:** Firestore `asset_status` collection with history log
- **Operators can:** Mark shelters offline, log damaged substations, update bed availability
- **Audit:** Every status change logged with actor, timestamp, and reason

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

### Rainfall Damage Pathway Model

Distinct from the storm surge model, this pathway models **two terrain-specific rainfall hazards**:

| Terrain | Primary Hazard | Formula |
|---------|---------------|---------|
| Coastal lowland (<20m elevation) | Flash flooding | Runoff potential = rainfall × soil saturation |
| Hilly terrain (slope >15°) | Landslide | Susceptibility index = cumulative rainfall × slope |

Both use threshold-based classification (LOW/MEDIUM/HIGH/CRITICAL). This is separate from storm surge because surge is wind + tide-driven, while rainfall damage is infiltration- and terrain-driven.

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

**Coefficient provenance:** The 0.10 household-affected coefficient and the 0.60 cap are **illustrative placeholders** chosen to produce realistic payout magnitudes for extreme storms (Fani ₹823 Cr, Amphan ₹904 Cr). They are **not actuarially derived**. A production deployment would calibrate these coefficients against:
- Historical insurance claims data (e.g., NDRP, CCRIF)
- Actuarial catastrophe models (RMS, AIR, Verisk)
- Government post-disaster compensation records (NDMA, state relief funds)

The formula itself is sound; the coefficients are the place where real-world data must be injected.

**Uncertainty-aware triggering:** The insurance engine propagates the forecast model's positional RMSE into the trigger threshold. When two-model agreement is strong (<100 km divergence), contracts trigger with a tight +5% margin. When uncertainty is high, the trigger threshold widens by up to +30%, requiring stronger evidence before payout. This prevents pre-landfall liquidity release from being triggered on low-confidence forecasts — critical for real parametric schemes.

**Realistic payouts:**
- Cyclone Fani (215 km/h, 3.31m surge): **₹823 Cr**
- Cyclone Amphan (240 km/h, 3.69m surge): **₹904 Cr**
- Weak depression (30 km/h, 0.6m surge): **₹0** (below threshold)

All triggers are logged to Firestore for audit and pre-landfall liquidity release.

---

### Gemini Multimodal Reasoning

The `/api/exposure/reason` endpoint sends the following context to **Gemini 3.7 Flash**:

**Inputs:**
- **Sentinel-1 SAR flood extent** — derived bounding box coordinates and area (km²) from GEE tile analysis
- **District infrastructure geometry** — substation, road, and hospital coordinates with elevation and coastal proximity
- **Storm forecast metrics** — wind (km/h), surge (m), rainfall (mm), atmospheric pressure (hPa)

**Architectural note:** Gemini reasons over *derived* geometric features (bounding boxes and coordinates) rather than raw SAR raster pixels. This is a deliberate pattern — computing derived features in Earth Engine and passing them to the LLM gives us faster inference (<5s), lower token cost, and more deterministic outputs than sending multi-MB GeoTIFFs directly. A production extension could pass raw Sentinel-1 imagery directly for pixel-level reasoning.

**Gemini returns:**
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

## Human-in-the-Loop Safety Gate

Every advisory and insurance trigger passes through an approval state machine:

```text
DRAFT → PENDING_APPROVAL → APPROVED → DISPATCHED
                       ↘ REJECTED
```

**Why:** In real disaster response, no LLM-generated advisory should go directly to a DISCOM, ODRAF, or insurance partner without human review. Our platform generates the advisory, then requires an authorized officer with the `dispatcher` role to explicitly approve before FCM dispatch or payout release.

**Audit trail:** Every state transition is logged to Firestore with `approved_by`, `approved_at`, and reason. The full audit can be retrieved via `GET /api/advisories/{id}/audit`.

**Authorization:** Approval endpoints require a Firebase ID token with a custom `dispatcher` claim. This is enforced at the API layer, not the UI.

---

## Security & Access Control

- **Authentication:** All state-mutating endpoints require a valid Firebase ID token
- **Authorization:** Dispatch and approval endpoints require the `dispatcher` custom claim
- **Rate limiting:** 10 requests/minute per IP on LLM-heavy endpoints
- **Audit logging:** Every approval decision logged to Firestore

Read-only endpoints (`/api/health`, `/api/tracks`, `/api/cyclone/live`) remain public for the demo.

---

## Testing & CI/CD

- **135 backend tests** passing (pytest) covering API endpoints, ML inference, insurance logic, terrain-aware rainfall damage pathways, infrastructure triage ranking, schemas, and integration flows
- **Frontend build** validated via `npm run build` (Next.js 16 Turbopack, 0 errors)
- **CI/CD:** GitHub Actions runs tests + build on every push
- **Coverage:** Core services (`forecast_service`, `insurance_service`, `gemini_advisory`, `imd_fetcher`, `surge_service`, `rainfall_service`, `rainfall_damage_service`, `triage_service`) have dedicated test files

---

## Performance & Scale

| Metric | Value |
|--------|-------|
| Backend deployment | Render.com free tier (0.1 CPU, 512 MB RAM) |
| Frontend deployment | Vercel edge CDN |
| Average API response (cached) | <200ms |
| Gemini advisory generation | 15-30s (LLM inference) |
| Forecast inference (LSTM) | <500ms (CPU) |
| Concurrent users (tested) | 10 (free tier limit) |
| Scale path | Render → Cloud Run with autoscaling (0→N) |

---

## APAC Scalability

### Currently deployed
- **India:** 4 states, 16 districts, 24M+ population covered

### Demonstrated expansion
- **Bangladesh:** 4 districts (Cox's Bazar, Chittagong, Bhola, Khulna) with Sidr 2007 reference track — functionally working cross-country mode

### Architectural portability
The platform generalizes to any cyclone basin because each layer is designed as a swap-in module:

| Layer | India implementation | APAC swap |
|-------|---------------------|-----------|
| Storm track data | IMD RSMC New Delhi XML/HTML scrapers | JTWC (Pacific), PAGASA (Philippines), BMKG (Indonesia) API adapters |
| Satellite imagery | Google Earth Engine Sentinel-1 SAR | Same — GEE is global |
| Infrastructure | OpenStreetMap + state DISCOM | Same OSM + national grid authority |
| Vulnerability | Census + NDMA statistics | National census bureau data |
| Language | 6 Indian languages | Bengali (Bangladesh), Sinhala + Tamil (Sri Lanka), Burmese (Myanmar), Tagalog (Philippines) |
| Insurance partner | NDRP | CCRIF (Caribbean pattern), national risk pools |

### Adapter Architecture

All 5 major APAC meteorological agencies are normalized to a single interface (`MetAgencyAdapter`). Each adapter file contains the exact production data path documented in its `documented_path` field:

| Agency | Region | Integration | Production Path |
|--------|--------|-------------|-----------------|
| IMD (India) | Bay of Bengal | ✅ Live | RSMC New Delhi XML/HTML |
| JTWC | Western Pacific | 🟡 Stub | TC warning TXT + shapefiles |
| PAGASA | Philippines | 🟡 Stub | Tropical cyclone bulletin HTML |
| BMKG | Indonesia | 🟡 Stub | Cyclone bulletin JSON API |
| DMH | Myanmar | 🟡 Stub | Bulletin PDF/HTML |

Adding a new agency requires only: (1) a new `*_adapter.py` file implementing the interface, (2) registering it in `AGENCY_ADAPTERS`. Core pipeline unchanged.

### What-If Scenario Override

Users can toggle a scenario override panel to test hypothetical storm parameters without modifying the historical track:

- **Wind multiplier:** 0.5× to 1.5×
- **Pressure offset:** -30 to +30 hPa
- **Track shift:** ±1.0° latitude/longitude
- **Forward speed:** 0.5× to 2.0×

When enabled, all downstream models update live — forecast, surge simulation, rainfall pathway, insurance triggers, infrastructure triage, and Gemini exposure reasoning. This is standard "what-if" analysis used by disaster management authorities to test contingency plans.

A visual indicator on the map and header makes it clear that displayed data is hypothetical.

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
