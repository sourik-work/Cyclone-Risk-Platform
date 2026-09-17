# Architecture

## Data Flow
GEE (pre-computed GeoJSON) → BigQuery → Next.js dashboard
IMD track data → Vertex AI (LSTM) → forecast → BigQuery
Forecast + infrastructure → Gemini → advisory → Translation API → TTS

## Module Responsibilities
- data-pipeline/: GEE export scripts, historical data ingestion
- models/: PyTorch model weights (track_lstm.pt), normalization stats (norm_stats.json), and validation metrics (model_metrics.json)
- frontend/: Next.js app with Google Maps Platform & Earth Engine ImageMapType overlays
- backend/: FastAPI services, TrackLSTM inference engine, Gemini 3.7 Flash advisory generation

## Predictive Model (TrackLSTM)

### Overview & Objective
Tropical cyclone trajectory and intensity forecasting is powered by a trained PyTorch 2-layer Long Short-Term Memory (`TrackLSTM`) deep recurrent neural network. The model predicts a 48-hour forward storm track and intensity trajectory (at 3-hour lead steps) based on the 4 most recent 3-hourly observations.

### Architecture Specification
```
Input: [batch_size, seq_in=4, input_dim=4]
  ├── Feature 0: Latitude (°N)
  ├── Feature 1: Longitude (°E)
  ├── Feature 2: Maximum Sustained Wind Speed (km/h)
  └── Feature 3: Central Atmospheric Pressure (hPa)
       │
       ▼
2-Layer LSTM (hidden_dim=96, num_layers=2, batch_first=True, dropout=0.1)
  ├── Hidden state output: [batch_size, hidden_dim=96]
       │
       ▼
Linear Projection Head (in_features=96, out_features=seq_out*output_dim = 16*4 = 64)
       │
       ▼
Reshape Output: [batch_size, seq_out=16, output_dim=4]
  └── Predicted points at T+3h, T+6h, T+9h, ..., T+48h
```
- **Total Trainable Parameters:** 119,872 weights (483 KB serialized).
- **Execution Target:** CPU inference (`map_location='cpu'`) deployed within FastAPI on Google Cloud Run with sub-10ms response latency.

### Training Data & Synthetic Augmentation
- **Source Data:** India Meteorological Department (IMD) Best Track Archive across Bay of Bengal and Arabian Sea basins (1990–2023).
- **Dataset Size:** 8,484 training sequences (7,211 sequences retained post quality-control filtering).
- **Augmentation Scheme:** Rotational perturbation (±5°), temporal jittering, and Gaussian noise injection across velocity vectors to improve model robustness during sudden recurvature events.
- **Normalization:** Z-score feature standardization computed across the historical corpus (`models/norm_stats.json`):
  - Latitude: $\mu = 15.185$, $\sigma = 4.773$
  - Longitude: $\mu = 86.363$, $\sigma = 1.717$
  - Wind Speed: $\mu = 160.583$ km/h, $\sigma = 57.898$ km/h
  - Pressure: $\mu = 957.972$ hPa, $\sigma = 27.919$ hPa

### Validation Results & Performance Benchmarks
Evaluated on holdout historical test storms including Cyclone Fani (2019) and Cyclone Amphan (2020):
| Forecast Lead Time | Position RMSE (km) | Baseline IMD Official Error |
| :--- | :--- | :--- |
| **T+6h** | **16.77 km** | 25–35 km |
| **T+12h** | **24.73 km** | 45–55 km |
| **T+24h** | **85.65 km** | 80–95 km |
| **T+48h** | **155.58 km** | 140–165 km |

- **Intensity Error Metrics:**
  - Maximum Sustained Wind Speed MAE: **7.34 km/h**
  - Central Pressure MAE: **2.93 hPa**
  - Best Validation Loss (MSE): **0.0079**

### Operational API Contract
- **Endpoint:** `POST /api/forecast/track`
- **Request Body:**
  ```json
  {
    "cyclone_id": "BOB-02-2019",
    "recent_point_indices": [0, 1, 2, 3]
  }
  ```
- **Response Payload:** Returns 16 predicted points (`lat`, `lon`, `wind_kmph`, `pressure_hpa`, `lead_hours`), remaining points from IMD official track, and validation metrics (`rmse_24h_km`, `rmse_48h_km`, `wind_mae_kmph`, `pressure_mae_hpa`, `model_params`, `training_samples`).