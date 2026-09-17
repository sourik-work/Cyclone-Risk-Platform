# Architecture

## Data Flow
GEE (pre-computed GeoJSON) → BigQuery → Next.js dashboard
IMD track data → Vertex AI (LSTM) → forecast → BigQuery
Forecast + infrastructure → Gemini → advisory → Translation API → TTS

## Module Responsibilities
- data-pipeline/: GEE export scripts, historical data ingestion
- models/: Vertex AI training scripts (track LSTM)
- frontend/: Next.js app with Google Maps embed
- backend/: Pub/Sub triggers, advisory generation, Cloud Run APIs