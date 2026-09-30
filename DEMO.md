# Cyclone Risk Platform: 5-Minute Evaluation & Demo Walkthrough

## Overview
This walkthrough scripts the 5-minute end-to-end evaluation flow for judges, district collectors, and technical reviewers.

---

## ⏱️ Walkthrough Script Timeline

### 0:00 – 0:30 | The Core Problem: The Action Gap
- **Narrative:** The Bay of Bengal accounts for 6% of global cyclones but >50% of global fatalities. IMD forecasts are accurate, but a 24-48 hour lead-time action gap exists before municipal dispatch and liquidity transfer take place.
- **Key Visual:** Control room dark-mode interactive map displaying active Bay of Bengal basin tracking.

---

### 0:30 – 1:30 | Historical Mode: Cyclone Fani Replay & LOSO Validation
- **Action:** Select "Cyclone Fani (2019)" from the historical storm catalog.
- **Features Highlighted:**
  - Track replay showing 3-hour forecast steps.
  - **Model Validation Card:** 18-storm Leave-One-Storm-Out (LOSO) cross-validation ($79.54\text{ km}$ 24h RMSE [95% CI: $75.67–83.62\text{ km}$]).
  - Benchmarks against Persistence ($112.4\text{ km}$) and IMD Operational ($80.0\text{ km}$) reference.
  - Deployed Sentinel-2 NDVI (vegetation loss) and NDWI (saline inundation) change detection layers.

---

### 1:30 – 2:30 | Live Mode: IMD & APAC Agency Ingestion + Staleness Monitoring
- **Action:** Switch to "Live Monitoring Mode".
- **Features Highlighted:**
  - Real-time bulletin parser for IMD RSMC New Delhi, PAGASA, and JTWC.
  - `/health/freshness` monitor showing bulletin age in minutes and circuit breaker state.
  - APAC agency adapter status dashboard showing multi-basin coverage.

---

### 2:30 – 3:30 | Gemini Exposure Reasoning with 95% Uncertainty Cone
- **Action:** Click on "Puri District" and trigger "Gemini 3.7 Flash Exposure Reasoning".
- **Features Highlighted:**
  - 95% position uncertainty cone bounding region ($r_{24} = 155.9\text{ km}$, $r_{48} = 288.3\text{ km}$) visualized on the map.
  - Gemini reasons over derived geometric features without false precision.
  - Ranked critical infrastructure exposure list (Substations, Hospitals, Marine Police).

---

### 3:30 – 4:30 | Actuarial Parametric Insurance & Human-in-the-Loop Approval Gate
- **Action:** Open the Parametric Insurance Trigger Panel.
- **Features Highlighted:**
  - Actuarially calibrated formula (Kerala SDMA / Nagaland DRTPS constants: $k_{state} = 0.12$, $cap_{state} = 0.55$).
  - Pre-landfall liquidity calculation (₹58.8 Cr estimated payout for Fani; ₹0 for sub-threshold depression).
  - Operator Approval Gate with 3-question review feedback modal capturing review latency and confidence.

---

### 4:30 – 5:00 | Multi-Channel Last-Mile Dispatch & Firestore Audit Trail
- **Action:** Click "Approve & Dispatch Emergency Alert".
- **Features Highlighted:**
  - Parallel fanout to SMS (MSG91 DLT / Twilio), IVR Voice Calls (Exotel Voice with 3x retry in 11 vernaculars), and Community Radio broadcast queue.
  - Immutable audit trail record in Firestore.
