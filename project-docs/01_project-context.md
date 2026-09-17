# Cyclone Risk Platform — Project Context

## Mission
Predictive risk and vulnerability modeling for Bay of Bengal cyclones, enabling pre-landfall anticipatory action.

## Stack
- Google Earth Engine (satellite data)
- Vertex AI (model training & serving)
- BigQuery (data warehouse)
- Gemini API (multimodal reasoning)
- Cloud Run (dashboard API)
- Firebase (real-time alerts)
- Next.js + React + TypeScript + Tailwind CSS (dashboard UI)

## Key Constraints
- 10-day build timeline
- CPU-only inference for demo
- Multilingual output (Odia, Bengali, Telugu, Tamil, Hindi)
- All models must be lightweight (<500k params)

## What NOT to Build
- Real-time hydrodynamic simulation (use static overlays)
- Parametric insurance module (pitch-only)
- Full GEE real-time pipeline (pre-compute everything)