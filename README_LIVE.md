# Cyclone Risk & Anticipatory Action Platform — Live Judge Reference

> An AI-powered predictive risk and vulnerability modeling platform for Bay of Bengal cyclones that bridges the critical 48-hour gap between warning and action, enabling district disaster managers, relief agencies, and insurers to shift from reactive post-landfall recovery to automated, targeted pre-landfall anticipatory action.

---

## 🌐 Live Production URLs

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend Dashboard** | [https://cyclone-risk-platform.vercel.app](https://cyclone-risk-platform.vercel.app) | Live on Vercel |
| **Backend REST API** | [https://cyclone-risk-platform.onrender.com](https://cyclone-risk-platform.onrender.com) | Live on Render |
| **Interactive API Docs** | [https://cyclone-risk-platform.onrender.com/docs](https://cyclone-risk-platform.onrender.com/docs) | Swagger UI |
| **System Health Check** | [https://cyclone-risk-platform.onrender.com/api/health](https://cyclone-risk-platform.onrender.com/api/health) | UptimeRobot Monitored (5m) |

---

## 🤖 Google AI & Cloud Services Used

| # | Service | Operational Role in Platform |
|---|---------|------------------------------|
| 1 | **Gemini 3.7 Flash (Text & Multimodal)** | Powers multilingual department-specific anticipatory action advisories, Dialogflow conversational agent classification, and `/api/exposure/reason` multimodal reasoning over Sentinel-1 SAR flood extent + critical infrastructure geometry. |
| 2 | **Gemini 3.1 Flash TTS** | High-fidelity voice broadcast synthesis in 6 Indian languages (English, Hindi, Odia, Bengali, Telugu, Tamil) for community radio and coastal megaphone dispatch. |
| 3 | **Google Maps Platform** | Custom dark-themed control-room situational map, real-time polyline rendering, dynamic forecast uncertainty cone polygons, and infrastructure risk markers. |
| 4 | **Google Earth Engine (GEE)** | Server-side computation and tile-service generation of Sentinel-1 SAR synthetic aperture radar flood extent overlays for Bay of Bengal coastal districts. |
| 5 | **Trained Deep Learning Model (TrackLSTM v1)** | Custom multi-step LSTM neural network (119,872 parameters) forecasting 48-hour cyclone track trajectory and central pressure/wind intensity at 3-hour intervals with RMSE 85.6 km @ 24h. |
| 6 | **BigQuery & Firestore** | Cloud data warehousing for historical cyclone tracks and district vulnerability metrics, paired with Firestore real-time trigger logging for parametric insurance audit trails. |

---

## 📡 Authoritative Data Sources

| Source | Type | Platform Integration |
|--------|------|----------------------|
| **IMD RSMC New Delhi** | Live & Historical | 30-minute automated scraping of official cyclone bulletins and archived best-track records (Fani, Amphan, etc.). |
| **Google Earth Engine** | Satellite Imagery | Sentinel-1 SAR GRD flood extents and water index masking. |
| **ISRO Bhuvan** | Geospatial WMS | Coastal Vulnerability Index (CVI) maps, shoreline erosion profiles, and 30m coastal DEMs. |
| **OpenStreetMap (OSM)** | Critical Infrastructure | 40+ power substations, 15 transmission lines, 15 major highways (NH-16, NH-5), and 50+ coastal hospitals and cyclone shelters. |
| **data.gov.in** | Socio-economic Data | Census demographics, kutcha housing percentages, poverty headcount ratios, and elderly/infant vulnerability by district. |
| **FAO / WHO** | Public Health & Food Security | Malnutrition prevalence, food insecurity indicators, waterborne epidemic risk factors. |

---

## 🎬 8-Feature Video Demo Script

This script walks judges through a complete 3-to-4 minute demonstration of the live production system:

### 1. Control Room Overview & Live Mode Monitoring
- **Visual:** Navigate to [https://cyclone-risk-platform.vercel.app](https://cyclone-risk-platform.vercel.app).
- **Action:** Point out the dark command-center UI, state filter pills (Odisha, West Bengal, Andhra Pradesh, Tamil Nadu), and the top Live Mode indicator badge.
- **Narration:** *"When no active cyclone is in the Bay of Bengal, the system maintains an honest 'Monitoring' state, polling IMD RSMC New Delhi bulletins every 30 minutes with an instant manual 'Check Now' trigger."*

### 2. Historical Mode & Dual-Track Trajectory Replay
- **Action:** Switch mode toggle to **Historical** and select **Cyclone Fani (May 2019)**. Drag the time scrubber along the 48-hour track.
- **Visual:** The storm trajectory advances along the Odisha coast towards Puri, dynamically updating storm coordinates, wind speed (up to 215 km/h), central pressure (932 hPa), and categorization (*Extremely Severe Cyclonic Storm*).
- **Narration:** *"Historical mode provides full retrospective simulation with IMD best-track observations, dynamic time-scrubbing, and automated playback."*

### 3. TrackLSTM AI Trajectory & Intensity Forecast
- **Action:** Toggle on **"AI Forecast"** in the map controls.
- **Visual:** A dashed yellow trajectory renders alongside IMD's actual track, accompanied by a translucent 48-hour forecast uncertainty cone. Inspect the **Model Validation Card**.
- **Narration:** *"Our custom TrackLSTM neural network predicts trajectory 48 hours ahead with an operational RMSE of 85.6 km at 24 hours and 155.6 km at 48 hours, outperforming classical statistical baselines."*

### 4. Google Earth Engine SAR Flood Extent Overlay
- **Action:** Click **"SAR Flood Overlay"** on the map legend.
- **Visual:** Sentinel-1 synthetic aperture radar flood extent heatmaps render over the coastal delta zones.
- **Narration:** *"Direct integration with Google Earth Engine computes and renders high-resolution Sentinel-1 SAR flood inundation contours to spot submerged lowlands before optical satellites can penetrate cloud cover."*

### 5. Critical Infrastructure Exposure & At-Risk Detection
- **Action:** Toggle on Infrastructure layers (Power Substations, Transmission Lines, Highways, Hospitals).
- **Visual:** Infrastructure assets within the forecast cone and within 5 km of the coastline receive animated **"AT RISK"** badges and **"CRITICAL COASTAL EXPOSURE"** alerts.
- **Narration:** *"The platform performs spatial proximity intersection against OSM and state utility data, highlighting 40 electrical substations and arterial logistics lifelines like NH-16."*

### 6. Gemini Multimodal Exposure Reasoning (`/api/exposure/reason`)
- **Action:** Select **Puri District** and view the AI Exposure Reasoning card.
- **Visual:** Gemini 3.7 Flash outputs a grounded district-level narrative synthesizing SAR flood extents, storm surge forecasts, and named critical substations and hospitals.
- **Narration:** *"Moving beyond simple distance metrics, Gemini 3.7 Flash inspects the spatial geometry of infrastructure and flood boundaries to generate grounded, 12-hour pre-landfall operational decisions."*

### 7. Multilingual Anticipatory Advisories & Gemini TTS Voice Broadcast
- **Action:** Select different Indian languages (Hindi, Odia, Bengali) and click **"Synthesize Audio"** / **"Broadcast to Community Radios"**.
- **Visual:** Department-specific operational checklists (Evacuation, Shelters, Fisherfolk, Power Utilities) display in the selected script, and audio playback streams immediately via Gemini 3.1 Flash TTS.
- **Narration:** *"Gemini 3.7 Flash generates sector-specific anticipatory orders, while Gemini 3.1 Flash TTS synthesizes regional language audio broadcasts for emergency siren networks and community radio dispatch."*

### 8. Parametric Insurance Liquidity Triggers & Dialogflow Assistant
- **Action:** Open the **Parametric Insurance** panel and test the **Floating AI Chat Widget**.
- **Visual:** 
  - Contracts (e.g., PC-OD-001 storm surge, PC-WB-002 wind speed) evaluate in real time against storm metrics, calculating transparent payouts (e.g., ₹823 Cr for Fani, ₹904 Cr for Amphan, ₹0 for minor depressions) logged to Firestore.
  - In the chat widget, type *"What is the cyclone status?"* or *"Give me the evacuation advisory"*. The Dialogflow + Gemini agent answers immediately with live situational telemetry.
- **Narration:** *"Parametric contracts automate pre-landfall liquidity release to vulnerable populations, while conversational AI gives incident commanders instant hands-free situational awareness."*
