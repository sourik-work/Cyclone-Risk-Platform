# Cyclone Risk & Anticipatory Action Platform

> An AI-powered predictive risk and vulnerability modeling platform for Bay of Bengal cyclones — shifting disaster response from post-landfall recovery to **pre-landfall anticipatory action**.

![Status](https://img.shields.io/badge/status-hackathon%20MVP-blue)
![Python](https://img.shields.io/badge/Python-3.12-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Google AI](https://img.shields.io/badge/Google%20AI-Gemini%203.7%20Flash-blueviolet)

---

## 🎯 What It Does

The Bay of Bengal experiences **6% of global cyclones but over 50% of global cyclone deaths**. The bottleneck isn't warning — it's the gap between warning and action.

This platform provides **48-hour anticipatory lead time** by combining:
- **Real IMD meteorological data** (live bulletins + historical best-tracks)
- **Trained LSTM** cyclone track forecasting (RMSE 85.6 km @ 24h)
- **Google Earth Engine** Sentinel-1 SAR satellite imagery
- **Gemini 3.7 Flash** multilingual advisory generation
- **Gemini 3.1 Flash TTS** voice delivery for low-literacy populations
- **Infrastructure exposure mapping** (power grids, roads, hospitals, shelters)
- **Rainfall damage pathway** + **storm surge simulation**

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────────────┐
│ DATA INGESTION │
│ IMD RSMC │ GEE Sentinel-1 │ ISRO Bhuvan │ data.gov.in │ OSM │ FAO/WHO│
└────────────────────────────┬────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────────┐
│ BIGQUERY WAREHOUSE │
│ cyclone_tracks · vulnerability_districts · infrastructure_assets │
│ live_bulletins · rainfall_observations · advisory_logs │
└────────────────────────────┬────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────────┐
│ AI MODELING LAYER │
│ Trained LSTM (TrackLSTM v1) · Gemini 3.7 Flash · Gemini 3.1 TTS │
└────────────────────────────┬────────────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────────┐
│ OPERATIONS DASHBOARD │
│ Google Maps Platform · Real-time advisories in 6 Indian languages │
└─────────────────────────────────────────────────────────────────────┘

---

## ✅ Implemented Features

### Historical Mode
- **Cyclone Fani (2019)** and **Cyclone Amphan (2020)** full track replay
- **AI Forecast** — trained LSTM prediction rendered as dashed yellow line alongside IMD's official track
- **Model Validation card** — RMSE, MAE, and training metrics visible in the UI
- **Time scrubber** with automated playback

### Live Mode
- **IMD RSMC New Delhi** bulletin fetcher (30-minute polling)
- Honest **"monitoring"** state when no active cyclone exists
- **"Check Now"** manual refresh

### India-Scale Coverage
- **4 states**: Odisha, West Bengal, Andhra Pradesh, Tamil Nadu
- **16 coastal districts**, **24M+ population** at risk
- State selector filters districts, map overlay, and advisories dynamically

### AI Forecasting
- **Trained LSTM** on IMD best-track data
- **119,872 parameters** | 4-point input → 16-point output (48 hours at 3-hour intervals)
- **RMSE @ 24h: 85.6 km** (better than operational IMD accuracy)
- **RMSE @ 48h: 155.6 km**
- **Wind MAE: 7.3 km/h** | **Pressure MAE: 2.9 hPa**

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

### Hazard Modeling
- **Rainfall damage pathway** with 24/48/72-hour accumulation forecast
- Risk classification: LOW / MEDIUM / HIGH / CRITICAL
- **Storm surge simulation** with physics-lite model (wind × bathymetry × coast geometry)
- Inundation polygon rendering + affected population estimate

### Infrastructure Exposure
- **40 substations** + **15 transmission lines** across 4 states
- **15 arterial road corridors** (NH-16, NH-5, NH-60, etc.)
- **50 hospitals/shelters** with bed capacity and generator status
- **"AT RISK"** badges when assets fall within the forecast uncertainty cone
- **"CRITICAL COASTAL EXPOSURE"** warning for assets within 5 km of shoreline

---

## 🔵 Google AI Integration

| Service | Usage |
|---------|-------|
| **Gemini 3.7 Flash** | Multilingual anticipatory advisory generation (6 languages) |
| **Gemini 3.1 Flash TTS** | Voice synthesis in Indian languages |
| **Google Maps Platform** | Dark-theme control-room map, polylines, polygons, markers |
| **Google Earth Engine** | Sentinel-1 SAR flood extent tile overlay |
| **Vertex AI–style LSTM** | Trained on IMD best-track data with synthetic augmentation |
| **BigQuery** | Data warehouse with 158 rows loaded across 6 tables |

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
- Google Cloud project with enabled APIs:
  - Gemini API
  - Google Maps JavaScript API
  - Google Earth Engine API
  - BigQuery API
  - Firestore API
  - Firebase Cloud Messaging API
  - Cloud Storage API

### Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Create backend/.env with:
# GEMINI_API_KEY=your_key_here
# GCP_PROJECT_ID=your_project_id
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

uvicorn backend.main:app --host 0.0.0.0 --port 8000
<!-- Trigger Vercel rebuild with updated preset -->
