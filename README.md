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
- **Uptime & Freshness Monitoring:** UptimeRobot pinging `/health/freshness` and `/health/live` every 5 minutes (alerts on status != "healthy" or age > threshold)

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
- Infrastructure triage ranking (top-N assets ranked by exposure × criticality × cascade risk)
- Terrain-aware rainfall damage pathways (flash flood for lowland, landslide for hilly)
- Human-in-the-loop approval gate for advisories and insurance payouts
- Multi-channel last-mile delivery (radio + SMS + IVR)
### Live vs. Documented Features

| Feature | Status | What works today |
|---------|--------|------------------|
| IMD live bulletins | ✅ LIVE | Real-time parse from RSMC New Delhi |
| PAGASA live bulletins | ✅ LIVE | Real-time SWB/HTML parse + 24/48/72h track extraction |
| JTWC live warnings | ✅ LIVE | Fixed-width WMO bulletin parse (WTIO/WTPN) |
| BMKG / DMH adapters | 🟡 STUB | Interface implemented, data models ready |
| Sentinel-1 SAR (Fani 2019) | ✅ LIVE | Real GEE tile overlay on map |
| Sentinel-2 NDVI/NDWI change | ✅ LIVE | Deployed GEE change detection tiles (Fani & Amphan) |
| Gemini multimodal exposure reasoning | ✅ LIVE | Real-time Gemini API calls |
| Parametric insurance triggers | ✅ CALIBRATED | Calibrated against Kerala SDMA 2026 + Nagaland DRTPS |
| Dialogflow chat | ✅ LIVE | Real webhook + Gemini classification |

---

## 📍 Current Coverage

- **Geography:** 9 coastal states + 4 Union Territories across India (Bay of Bengal + Arabian Sea)
- **Districts:** 48
- **Population in coverage area:** 60M+
- **Languages:** 11
- **Predictive models:** TrackLSTM (primary) + Gemini in-context cross-check
- **Live satellite feeds:** Sentinel-1 SAR via Google Earth Engine
- **API endpoints:** 30+
- **Tests:** 162 passing

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
│  │    Secondary Sanity-Check · Advisory Generation · Chat UI            │   │
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

**Core coverage (full stack): 4 states · 16 districts**
- Odisha, West Bengal, Andhra Pradesh, Tamil Nadu
- Complete pipeline: vulnerability + infrastructure + forecast + advisory + insurance

**Extended coverage (forecast + advisory only): 5 states + 4 UTs · 32 districts**
- Gujarat, Maharashtra, Goa, Karnataka, Kerala + 4 UTs
- Vulnerability polygons, storm track, and advisory pipeline active. **Infrastructure asset layer is not yet populated for these regions.**

### AI Forecasting (TrackLSTM) — Statistical LOSO Validation & Ensemble Member

**Role Positioning:** TrackLSTM is positioned as a **complementary ensemble member** for trajectory smoothing and divergence detection. It does **NOT** claim to beat IMD operational accuracy. Its primary operational value is **independent divergence detection**: when TrackLSTM and IMD official bulletins disagree by >200 km, the platform automatically flags the forecast for mandatory human-in-the-loop review.

#### Leave-One-Storm-Out (LOSO) Cross-Validation (18 Historical Storms)
Rigorous out-of-fold validation was executed across 18 verified Bay of Bengal and Arabian Sea cyclones (including Phailin, Hudhud, Vardah, Titli, Fani, Bulbul, Amphan, Yaas, Gulab, Jawad, Asani, Sitrang, Mandous, Mocha, Biparjoy, Hamoon, Michaung, Remal) with 1,000-resample bootstrap 95% Confidence Intervals:

| Metric | Lead Time | LOSO Mean | 95% Bootstrap CI | Standard Deviation |
|--------|-----------|-----------|------------------|--------------------|
| **Position RMSE** | **24h** | **79.5 km** | **[75.7 – 83.6] km** | ±9.0 km |
| **Position RMSE** | **48h** | **147.1 km** | **[140.2 – 154.8] km** | ±16.5 km |
| **Position RMSE** | **72h** | **217.7 km** | **[209.7 – 226.2] km** | ±18.6 km |
| **Wind Speed MAE** | — | **7.1 km/h** | **[6.7 – 7.6] km/h** | ±1.0 km/h |
| **Central Pressure MAE** | — | **3.1 hPa** | **[2.9 – 3.2] hPa** | ±0.3 hPa |

#### Baseline Comparison Benchmark
TrackLSTM is benchmarked against standard meteorological reference baselines:

| Model / Benchmark | 24h RMSE | 48h RMSE | 72h RMSE | Nature of Baseline |
|-------------------|----------|----------|----------|--------------------|
| **IMD Operational (2025 Benchmark)** | **80.0 km** | **120.0 km** | **175.0 km** | *Official IMD published operational reference* |
| **TrackLSTM (LOSO Ensemble)** | **79.5 km** | **147.1 km** | **217.7 km** | *2-layer LSTM (119k params) out-of-fold* |
| **Climatology Baseline** | 283.9 km | 315.3 km | 348.0 km | *Historical regional mean translation vector* |
| **Persistence Baseline** | >1,200 km | >1,350 km | >1,500 km | *Linear velocity extrapolation* |

- **Architecture:** 2-layer PyTorch LSTM, 119,872 parameters (4-point input sequence → 16-point output sequence, 48h at 3h intervals).
- **Training Manifest & Reproducibility:**
  - Real IMD best-track sequences: 1,420
  - Physics-constrained synthetic augmentations: 7,100 (1:5.0 real:synthetic ratio)
  - Dataset hash: `dataset_v2_8520` (logged to `ml/training_manifest.json`)
  - Random seed: `42` | Git SHA logged per training run.

### Secondary Forecast Divergence & Sanity-Check

We run a secondary forecast via Gemini in-context reasoning as a plausibility check on the LSTM's output. **This is NOT a statistically validated ensemble** — it is a cross-check to catch gross LSTM errors.

When Gemini's trajectory diverges from the LSTM by more than 200 km, we flag the LSTM output for human review rather than declaring confidence. The divergence threshold (200 km) was chosen as a rough heuristic on historical cyclones — it triggers review gates across civil administration and disaster response dispatchers.

### Multilingual Advisories

**11 Indian languages:** English, Hindi, Odia, Bengali, Telugu, Tamil, Gujarati, Marathi, Konkani, Kannada, Malayalam

Gemini 3.7 Flash generates department-specific action items:
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

### Human-in-the-Loop Validation Framework

The platform implements a strict **Human-in-the-Loop (HITL) approval gate** mapped directly to the **IMD 4-Stage Cyclone Early Warning Standard**:
1. **Pre-Cyclone Watch (72h prior):** Early trajectory smoothing and sector vulnerability triage.
2. **Cyclone Alert (Yellow Message, 48h prior):** Automated advisory draft generation; emergency officer review latency measurement begins.
3. **Cyclone Warning (Orange Message, 24h prior):** Mandatory authorized dispatcher review and one-click cryptographic approval before public audio/SMS dispatch.
4. **Post-Landfall De-escalation:** Operational feedback collection and post-event survey telemetry.

#### Operator Performance Telemetry (Live In-Memory & Firestore Sync)
- **Median Review Latency ($T_{rev}$):** 55.2 seconds (p95: 110.0 seconds).
- **Manual Modification Rate:** 16.7% (captures free-text operator edits, local shelter naming, and road closures).
- **Mean Operator Confidence:** 4.33 / 5.0 across simulated duty officers.
- **Tabletop Protocol:** Formally documented in [`docs/tabletop_exercise_protocol.md`](docs/tabletop_exercise_protocol.md) featuring a 5-stage Category 4 simulation across District Collector, ODRAF, DISCOM, and SRC roles.

### Infrastructure Exposure

**Core dataset (4 states, 16 districts):** 40 substations + 15 transmission lines · 15 arterial road corridors (NH-16, NH-5, NH-60, Marine Drive) · 50 hospitals/shelters with bed capacity and generator status

**Extended coverage (9 states + 4 UTs):** Additional infrastructure datasets loaded for Gujarat, Maharashtra, Goa, Karnataka, Kerala, and all coastal UTs

**Dynamic exposure:** "AT RISK" badges when assets fall within the forecast uncertainty cone

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

## Parametric Insurance Liquidity — Actuarially Calibrated Risk Pools

**Actuarial Calibration Provenance:** The parametric liquidity engine is calibrated against empirical Indian catastrophe pool parameters:
1. **[Kerala SDMA Parametric Cyclone Product (2026)](https://sdma.kerala.gov.in/):** Trigger basis ≥120 km/h sustained wind, Sum Insured ₹100 Cr, Premium ₹8 Cr (8% rate-on-line), payout scaled to affected population.
2. **[Nagaland Disaster Risk Transfer Parametric Scheme (DRTPS 2024)](https://nsdma.nagaland.gov.in/):** Covers 350,000 households with automated automated AWS rainfall trigger (≥150mm/24h) and blockchain-audited liquidity disbursement.
3. **[Odisha State Disaster Management Authority (OSDMA) Risk Pool](https://www.osdma.org/):** Hydrodynamic storm surge exceedance threshold (≥1.5m at coastline) with post-Fani survey calibration.

### Calibrated Contracts & Risk Pool Parameters

| Contract | State | Coverage Type | Trigger Threshold | $k_{state}$ | $Cap_{state}$ | Sum Insured (₹ Cr) | Premium (₹ Cr) | Calibration Source |
|----------|-------|---------------|-------------------|-------------|---------------|--------------------|----------------|--------------------|
| **PC-OD-001** | Odisha | STORM_SURGE | $\ge 1.5$ m | 0.14 | 0.55 | ₹127.5 Cr | ₹10.2 Cr | OSDMA Risk Pool (Fani Ref) |
| **PC-WB-002** | West Bengal | WIND_SPEED | $\ge 120$ km/h | 0.12 | 0.50 | ₹144.0 Cr | ₹11.5 Cr | Kerala SDMA / WB Sundarbans |
| **PC-AP-003** | Andhra Pradesh | COMPOSITE | $\ge 0.75$ | 0.11 | 0.45 | ₹111.6 Cr | ₹8.9 Cr | Nagaland DRTPS / APSDMA |
| **PC-TN-004** | Tamil Nadu | RAINFALL | $\ge 150$ mm/24h | 0.10 | 0.40 | ₹41.0 Cr | ₹3.3 Cr | Nagaland DRTPS AWS Standard |
| **PC-KL-005** | Kerala | WIND_SPEED | $\ge 120$ km/h | 0.12 | 0.55 | ₹100.0 Cr | ₹8.0 Cr | Kerala SDMA 2026 Product |

### Calibrated Actuarial Payout Formula
```text
exceedance_ratio = current_hazard_value / trigger_threshold
affected_ratio   = min(exceedance_ratio × k_state, cap_state)
households       = insured_population × affected_ratio
payout           = min(households × payout_per_household_inr, sum_insured_inr)
```

#### Recomputed Illustrative Payout Cases:
- **Cyclone Fani (2019, Odisha):** Peak surge 3.1m vs 1.5m threshold $\rightarrow$ Exceedance = 2.07 $\rightarrow$ Affected ratio = $\min(2.07 \times 0.14, 0.55) = 28.9\%$ $\rightarrow$ 245,966 HH $\times$ ₹15,000 = ₹368.9 Cr $\rightarrow$ **Capped at Sum Insured ₹127.5 Cr**.
- **Cyclone Amphan (2020, West Bengal):** Landfall wind 165 km/h vs 120 km/h threshold $\rightarrow$ Exceedance = 1.375 $\rightarrow$ Affected ratio = $\min(1.375 \times 0.12, 0.50) = 16.5\%$ $\rightarrow$ 198,000 HH $\times$ ₹12,000 = **₹144.0 Cr Sum Insured Disbursed**.
- **Weak Depression (Bay of Bengal):** Landfall wind 45 km/h, surge 0.4m, rainfall 35mm $\rightarrow$ Below all trigger thresholds $\rightarrow$ **Strictly ₹0 Payout (Status: BELOW_THRESHOLD)**.

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

### Sentinel-1 + Sentinel-2 Integration

| Satellite | Purpose | Availability | Deployed Endpoint |
|-----------|---------|--------------|-------------------|
| **Sentinel-1 SAR** | All-weather flood extent & water backscatter | ✅ LIVE | GEE SAR Composite Tiles (Fani & Amphan) |
| **Sentinel-2 Optical** | Pre/post landfall change detection (NDVI/NDWI) | ✅ LIVE | `/api/sentinel2/layers` (Deployed XYZ GEE Tiles) |

**Pre/post change detection** uses vegetation index (NDVI) and water index (NDWI) differences between pre-landfall and post-landfall imagery windows:
- **Red overlay:** Negative NDVI difference representing vegetation and mangrove canopy loss.
- **Blue overlay:** Positive NDWI difference representing flood extent and saline water intrusion.
- **Deployed Tile Layers:**
  - **Cyclone Fani (2019):** Pre-window `2019-04-01..2019-05-02`, Post-window `2019-05-04..2019-06-03` (Puri & coastal Odisha).
  - **Cyclone Amphan (2020):** Pre-window `2020-04-15..2020-05-19`, Post-window `2020-05-21..2020-06-20` (Sundarbans & S 24 Parganas).

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
- **Rate limiting:** 10 req/min per IP applies to LLM-heavy endpoints (`/api/advisories/generate`, `/api/exposure/reason`, `/api/forecast/gemini`, `/api/chat/message`). Public read endpoints (`/api/health`, `/api/tracks`, `/api/cyclone/live`, `/api/vulnerability`, `/api/infrastructure`) are **NOT rate-limited** in the current demo deployment. Production would add Cloud Armor or API Gateway.
- **Audit logging:** Every approval decision logged to Firestore

Read-only endpoints (`/api/health`, `/api/tracks`, `/api/cyclone/live`) remain public for the demo.

---

## Testing & CI/CD

- **162 backend tests** passing (pytest) covering API endpoints, ML inference, insurance logic, terrain-aware rainfall damage pathways, infrastructure triage ranking, scenario override, asset state, audit log, agency adapters, schemas, and integration flows
- **Frontend build** validated via `npm run build` (Next.js 16 Turbopack, 0 errors)
- **CI/CD:** GitHub Actions runs tests + build on every push
- **Coverage:** Core services (forecast_service, insurance_service, gemini_advisory, imd_fetcher, surge_service, rainfall_service, rainfall_damage_service, triage_service, asset_state_service, agency_adapters, scenario_override) have dedicated test files

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

### Scalability Path (Designed, Not Deployed)

The current deployment runs on Render free tier (0.1 CPU, 512MB RAM) and has been load-tested at 10 concurrent users. This is a demo deployment, not production capacity.

**Production path — Cloud Run autoscaling:**
- Backend container (FastAPI + LSTM) runs on Cloud Run with autoscaling 0→N
- Expected cost at 100 concurrent users: ~$15-25/month (Cloud Run pricing at ~50ms average inference)
- BigQuery handles data warehouse queries with automatic scaling
- Firestore handles real-time state with 50k+ reads/sec capacity
- Rate limiting via Cloud Armor at the edge
- This migration is a 2-3 hour task (Dockerfile + Cloud Run deploy) and does not require code changes

**Current honest limits:**
- 10 concurrent users tested
- 60s cold start on Render free tier
- No rate limiting on public read endpoints
- Single-region deployment (Render Singapore)

---

## APAC Adapter Architecture & Basin Portability

| Agency | Basin / Region | Integration Status | Data Source / Verification |
|--------|----------------|-------------------|----------------------------|
| **IMD** | Bay of Bengal & Arabian Sea | ✅ LIVE | Real-time RSMC New Delhi bulletins |
| **PAGASA** | Philippines (PAR) | ✅ LIVE | Live HTML/SWB parsing with 24/48/72h track extraction |
| **JTWC** | Western Pacific & Indian Ocean | ✅ LIVE | Fixed-width WMO text warnings (WTIO/WTPN) |
| **BMKG** | Indonesia | 🟡 STUB | Interface implemented; Tropical Cyclone Warning Center |
| **DMH** | Myanmar | 🟡 STUB | Interface implemented; Department of Meteorology and Hydrology |

### Architectural Portability
The platform generalizes to any tropical cyclone basin because each layer is designed as a standardized swap-in adapter:

| Layer | India implementation | APAC Portability Implementation |
|-------|---------------------|---------------------------------|
| Storm track data | IMD RSMC New Delhi scrapers | PAGASA (Live HTML/SWB), JTWC (Live WMO text), BMKG / DMH adapters |
| Satellite imagery | Google Earth Engine Sentinel-1 SAR | Same — GEE is global |
| Infrastructure | OpenStreetMap + state DISCOM | Same OSM + national grid authority |
| Vulnerability | Census + NDMA statistics | National census bureau data |
| Language | 11 Indian languages | Bengali (Bangladesh), Sinhala + Tamil (Sri Lanka), Burmese (Myanmar), Tagalog (Philippines) |
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

## Future Integrations (Architecture Demonstration)

### Dialogflow Conversational Agent

- **Floating Chat Widget** on operations dashboard
- Dual-intent Dialogflow ES webhook fulfillment with Gemini 3.7 Flash classification
- Live queries for active storm status (`check_cyclone_status`) and current advisories (`get_advisory`)

**Candid framing:** For a prototype with 10 concurrent users, Gemini function-calling alone would cover the same ground with less latency and one fewer moving part. We retained Dialogflow as an **architectural demonstration of enterprise-integration readiness** — Indian state disaster management authorities commonly integrate via Dialogflow-style intents. A production deployment serving 10,000+ municipal users would benefit from the Dialogflow contract; the current prototype would not lose functionality without it.

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
