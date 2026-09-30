# Operational Tabletop Exercise Protocol: Anticipatory Cyclone Action Simulation

> **Protocol Version:** 1.0.0  
> **Status:** PROPOSED SIMULATION PROTOCOL  
> **Note:** *This protocol has NOT been executed in live disaster operations. It is the formal next step designed for multi-agency validation with district and state emergency operation centers.*

---

## 1. Executive Summary & Objective

This tabletop exercise protocol instruments and evaluates human-in-the-loop decision workflows within the **Cyclone Risk & Anticipatory Action Platform**. It evaluates operator latency, cognitive load, modification frequency, and agency trust across civil administration, disaster response forces, power utilities, and disaster finance teams before cyclone landfall.

---

## 2. Multi-Agency Role Matrix

| Role | Agency / Designation | Primary Platform Responsibilities | Key Actions |
|------|----------------------|-----------------------------------|-------------|
| **Role 1: State Relief Commissioner (SRC)** | OSDMA / Revenue & Disaster Mgmt | Macro risk governance, multi-district resource allocation | Reviews trajectory divergence, authorizes state-wide alerts, reviews parametric liquidity release |
| **Role 2: District Collector & Magistrate** | District Administration (e.g., Puri) | District-level evacuation, shelter management, civil supplies | Approves multilingual advisories, overrides evacuation zones, monitors shelter capacities |
| **Role 3: ODRAF Battalion Commander** | Odisha Disaster Rapid Action Force | First responder deployment, boat pre-positioning | Reviews hydrodynamic storm surge inundation and route accessibility |
| **Role 4: DISCOM Grid Dispatcher** | State Power Utility (e.g., TPCODL) | Grid de-energization, substation protection, generator backup | Reviews top-N asset exposure ranking, pre-positions restoration crews |
| **Role 5: Disaster Finance Officer** | Finance Dept / Parametric Risk Pool | Liquidity disbursement, insurance trigger verification | Reviews exceedance ratios, approves anticipatory liquidity release |

---

## 3. Simulation Scenario

- **Hazard Event:** Extremely Severe Cyclonic Storm (ESCS) "Cyclone Sagarika", Category 4 equivalent (Peak 1-min wind 215 km/h, central pressure 938 hPa).
- **Landfall Target:** Coastal Odisha (Puri / Jagatsinghpur coastline) with 48-hour anticipatory lead time.
- **Vulnerability Profile:** 850,000 coastal population, 42% kutcha housing, 40 primary electrical substations within 25 km of coast.

---

## 4. Five-Stage Decision Script & Platform Mapping

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             DECISION TIMELINE                                    │
│                                                                                  │
│   T-48h: Ingestion & Trajectory Review (TrackLSTM vs IMD)                        │
│     │                                                                            │
│   T-36h: Sectoral Exposure & Infrastructure Triage Ranking                       │
│     │                                                                            │
│   T-24h: Human-in-the-Loop Advisory Approval & Multichannel Dispatch             │
│     │                                                                            │
│   T-18h: Parametric Insurance Liquidity Release Authorization                    │
│     │                                                                            │
│   T-06h: Pre-Landfall Ground Confirmation & SAR Inundation Verification          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Stage 1: T-48h — Ingestion & Trajectory Divergence Review
- **Platform Feature:** Model Forecast Comparison Card & Data Freshness Inspector (`/health/freshness`).
- **Trigger Condition:** IMD bulletin indicates recurvature; TrackLSTM trajectory outputs 79.5 km 24h / 147.1 km 48h uncertainty cone.
- **Operator Decision:** State Relief Commissioner verifies divergence < 100 km; sets system status to **ACTIVE CYCLONE WARNING**.
- **Metrics Logged:** Operator inspection time, bulletin freshness verification.

### Stage 2: T-36h — Sectoral Exposure & Infrastructure Triage
- **Platform Feature:** Dynamic Triage Ranking (`/api/triage/rank`) & Surge Inundation Contour (`/api/surge/simulate`).
- **Trigger Condition:** Peak surge forecast of 2.8m along Puri coast, threatening 12 electrical substations and 8 arterial road segments.
- **Operator Decision:** DISCOM dispatcher prioritizes de-energization sequence for 6 flood-prone substations; ODRAF commander pre-positions rescue boats in Balikuda block.
- **Metrics Logged:** Triage sort interactions, asset status updates.

### Stage 3: T-24h — Human-in-the-Loop Advisory Review & Dispatch
- **Platform Feature:** Multilingual Advisory Generator & Voice Delivery Gate (`/api/advisories/generate` + `/api/advisories/{id}/approve`).
- **Trigger Condition:** Gemini 3.7 Flash generates tailored advisories in Odia, Bengali, Hindi, and English.
- **Operator Decision:** District Collector reviews Odia translation, refines local shelter naming (free-text diff), confirms high confidence (5/5), and executes one-click approval.
- **Metrics Logged:** `review_latency_seconds`, `modification_diff`, operator confidence score.

### Stage 4: T-18h — Parametric Insurance Liquidity Approval
- **Platform Feature:** Parametric Insurance Liquidity Gate (`/api/insurance/evaluate` + `/api/insurance/approve`).
- **Trigger Condition:** Contract `PC-OD-001` reaches 1.86x exceedance ratio ($k_{state}=0.14$, cap $55\%$), calculating ₹127.5 Cr payout.
- **Operator Decision:** Disaster Finance Officer verifies actuarial provenance (OSDMA Pool 2025 Standard) and signs off on pre-landfall cash transfer release to relief accounts.
- **Metrics Logged:** Verification latency, approval timestamp, audit trail immutable signature.

### Stage 5: T-06h — Satellite SAR & Ground Verification
- **Platform Feature:** GEE Sentinel-1 SAR flood extent & Sentinel-2 NDVI/NDWI change detection overlays.
- **Trigger Condition:** High-resolution radar imagery confirms coastal water ingress.
- **Operator Decision:** Multi-agency EOC confirms complete evacuation of 320,000 vulnerable residents into cyclone shelters.
- **Metrics Logged:** End-to-end mission response time, total operational lead time achieved.

---

## 5. Metrics & Measurement Framework

1. **Review Latency ($T_{rev}$):** Time elapsed between automated draft generation and human approval ($T_{approve} - T_{draft}$). Target: Median $< 60$ seconds.
2. **Modification Rate ($R_{mod}$):** Percentage of advisories requiring manual correction prior to dispatch. Target: $< 15\%$.
3. **NASA-TLX Cognitive Load Index:** 6-dimension workload assessment (Mental Demand, Physical Demand, Temporal Demand, Performance, Effort, Frustration) administered post-exercise.
4. **Operator Trust & Clarity Index:** Post-approval 3-question Likert scale (1–5) capturing decision confidence under operational time pressure.

---

## 6. Execution Status & Next Steps

> **Explicit Limitation:** This tabletop protocol represents the **formal engineering and operational specification**. It is designed for execution during pre-monsoon preparedness drills with state SDMAs. All API endpoints, audit log schemas, and metric collectors described above are live and instrumented in the platform codebase.
