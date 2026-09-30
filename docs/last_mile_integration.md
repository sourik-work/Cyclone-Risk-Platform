# Last-Mile Early Warning Delivery Integration Guide

## 1. Executive Summary
During high-impact cyclones, internet and mobile broadband fail first as cell towers lose mains power or fiber backhauls are severed. The platform implements a resilient, multi-tiered broadcast and narrowband alert pipeline spanning **SMS (TRAI DLT-compliant)**, **Automated IVR Outbound Calling (11 Indian coastal languages)**, and **Localized Community Radio Station Queues (FM/MW)**.

---

## 2. SMS Gateway Architecture & TRAI DLT Compliance

Under Telecom Regulatory Authority of India (TRAI) regulations, all bulk emergency SMS transmissions must be registered on a Distributed Ledger Technology (DLT) platform (e.g., VilPower, Jio DLT, Airtel DLT).

### 2.1 Registration Workflow
1. **Entity Registration:** Principal Entity ID registered under State Disaster Management Authority / Civil Defense quota.
2. **Sender Header Registration:** 6-character alpha headers approved for disaster alerts (e.g., `CYCRSK`, `ODSDMA`, `WBDEMA`).
3. **Template Registration:** Pre-approved variables registered under the **Implicit/Service Explicit** category to bypass commercial promotional scrub filters:
   - *DLT Template ID:* `1407169823412356123`
   - *Registered Pattern:* `ALERT: {#var#} approaching. Winds {#var#}. Action: {#var#}. - Govt Cyclone Warning`

---

## 3. IVR Automated Outbound Voice Dialing (Exotel / Twilio Voice)

For low-literacy rural fishing communities, voice alerts are generated using **Gemini 3.1 Flash TTS** in regional coastal vernaculars (Odia, Bengali, Telugu, Tamil, Malayalam, Gujarati, Hindi).

### 3.1 Architecture & Retry Policy
- **Primary Provider:** Exotel API / Tata Tele Business Services SIP trunk.
- **Outbound Dialing Strategy:** Parallel fanout with automatic detection of busy tones and no-answers.
- **Exponential Backoff Retry:**
  - Attempt 1: Landfall $T - 24\text{h}$
  - Attempt 2 (if no answer): Retry after 60 seconds
  - Attempt 3: Final retry after 180 seconds

---

## 4. Community Radio & AIR Partnership Workflow

Community Radio (CR) stations operate on local transmitter masts with battery backup, reaching households with simple transistor radios.

### 4.1 Participating Coastal Stations
| Station ID | Station Name | Frequency | Coverage District | Primary Language |
|------------|--------------|-----------|-------------------|------------------|
| `CR-OD-01` | Radio Namaskar | 90.4 MHz FM | Puri / Konark | Odia |
| `CR-OD-02` | Radio Dhadkan | 90.8 MHz FM | Balasore | Odia |
| `CR-WB-01` | Radio Digha | 90.8 MHz FM | Purba Medinipur | Bengali |
| `CR-WB-02` | Radio Sundarban | 90.4 MHz FM | South 24 Parganas | Bengali |
| `CR-AP-01` | Radio Machilipatnam | 90.4 MHz FM | Krishna | Telugu |
| `CR-TN-01` | Radio Cuddalore | 90.8 MHz FM | Cuddalore | Tamil |

---

## 5. Channel Cost & Throughput Analysis (per 1,000 Recipients)

| Channel | Unit Cost (INR) | Cost per 1,000 Alerts | Throughput / Fanout Latency | Failure Recovery |
|---------|-----------------|----------------------|----------------------------|------------------|
| **SMS (DLT Guaranteed)** | ₹0.12 / SMS | ₹120 ($1.45) | ~1,000 msgs/sec | Twilio fallback routing |
| **IVR Voice Call (30s audio)** | ₹0.45 / call | ₹450 ($5.40) | ~250 concurrent lines | 3x retry on no-answer |
| **FCM Push Notification** | ₹0.00 | ₹0.00 | ~5,000 msgs/sec | Retries on network reconnect |
| **Community Radio Broadcast** | ₹0.00 (Public Service) | ₹0.00 | Instantaneous local airwave reach | On-air repetition every 15 min |
| **TOTAL MULTI-CHANNEL BLITZ** | — | **₹570 ($6.85)** | **< 30 seconds total elapsed** | Complete audit receipt |
