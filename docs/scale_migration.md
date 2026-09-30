# Cloud Run Scale Migration & Autoscaling Architecture

## 1. Overview & Motivation
During peace-time operation, the platform receives baseline monitoring requests (~0.1 QPS). However, when a Category 4/5 cyclone enters the Bay of Bengal and IMD issues hourly special bulletins, operational traffic spikes by 200x–1,000x as district collectors, emergency responders, insurance assessors, and citizens simultaneously access track maps and advisory pipelines.

The Render free tier (0.1 shared vCPU, 512MB RAM) has been superseded by a fully codified **Google Cloud Run (Gen 2) serverless autoscaling architecture** deployed in `asia-south1` (Mumbai).

---

## 2. Step-by-Step Migration Plan (Render $\to$ Cloud Run)

### Phase 1: Artifact Registry & Secret Manager Preparation
```bash
# 1. Enable Required GCP APIs
gcloud services enable run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# 2. Store production secrets in Secret Manager
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "service-account-json" | gcloud secrets create FIREBASE_SERVICE_ACCOUNT --data-file=-
echo -n "hmac-secret-v1" | gcloud secrets create INTERNAL_SERVICE_SECRET --data-file=-
```

### Phase 2: Container Image Build & Cloud Run Deployment
```bash
# 1. Trigger Cloud Build with multi-stage Dockerfile
gcloud builds submit --config backend/cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD) .

# 2. Validate Knative Service Config (Dry-Run)
gcloud run services replace backend/cloud-run-service.yaml --region asia-south1 --dry-run
```

### Phase 3: Traffic Migration & Custom Domain Cutover
```bash
# Map custom API endpoint to Cloud Run service
gcloud beta run domain-mappings create \
    --service cyclone-risk-backend \
    --domain api.cyclone-risk.gov.in \
    --region asia-south1
```

---

## 3. Serverless Cost Model Across Concurrency Tiers

| Concurrency Level | Estimated Monthly Requests | Active Cloud Run Instances | CPU / Memory Allocation | Estimated Monthly Cost (USD) |
|---|---|---|---|---|
| **Baseline Peacetime (10 concurrent)** | ~250,000 reqs/mo | 0 to 1 (Scale to zero) | 1 vCPU / 512MB | **$0.00** (Within GCP Free Tier) |
| **Active Cyclone Watch (100 concurrent)** | ~3,500,000 reqs/mo | 2 to 4 instances | 1 vCPU / 512MB | **~$18.50 / month** |
| **Landfall Emergency Surge (1,000 concurrent)** | ~45,000,000 reqs/mo | 12 to 18 instances | 1 vCPU / 512MB | **~$142.00 / emergency** |

*Note: Container concurrency is configured at 80 requests per instance, maximizing throughput per allocated GB-second.*

---

## 4. Load Testing Plan (k6 / Locust Protocol)

### 4.1 Target Performance Metrics
- **Read Endpoints (`/api/cyclone/live`, `/health/freshness`):** $p95 < 250\text{ms}$ at 100 virtual users.
- **GIS Infrastructure Endpoints (`/api/infrastructure`):** $p95 < 450\text{ms}$ with in-memory feature cache.
- **LLM Synthesis (`/api/generate-advisory`):** $p95 < 3,200\text{ms}$ (Gemini 3.7 Flash streaming latency).
- **Error Rate Gate:** $< 0.1\%$ non-2xx responses across entire ramp duration.

### 4.2 k6 Load Script (`scripts/load_test_ramp.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Warmup ramp
    { duration: '5m', target: 100 },  // Sustained peak load
    { duration: '2m', target: 150 },  // Surge test
    { duration: '1m', target: 0 },    // Cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure
  },
};

export default function () {
  const res = http.get('http://localhost:8000/api/cyclone/live');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has cyclone_id': (r) => r.body.includes('cyclone_id') || r.body.includes('status'),
  });
  sleep(1);
}
```
