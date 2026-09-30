# Production Security & Deployment Hardening

## Overview
This document specifies the defense-in-depth security architecture for the **Cyclone Risk & Anticipatory Action Platform**, covering Edge WAF (Google Cloud Armor), API Gateway Rate Limiting, Service-to-Service HMAC-SHA256 Request Signing, CORS allowlisting, and HTTP Security Headers.

---

## 1. Google Cloud Armor Edge Policy (WAF & DDoS Mitigation)

The platform is deployed behind Google Cloud HTTP(S) Load Balancers with Cloud Armor Security Policies enabled.

### 1.1 Security Policy Rules (`cyclone-edge-security-policy`)

```yaml
# Google Cloud Armor Security Policy Template
name: cyclone-edge-security-policy
description: Edge WAF, OWASP Top 10 mitigation, and volumetric rate limiting

rules:
  # 1. Volumetric Edge Rate Limiting
  - priority: 1000
    action: throttle
    rateLimitOptions:
      conformAction: allow
      exceedAction: deny(429)
      enforceOnKey: IP
      rateLimitThreshold:
        count: 1000
        intervalSec: 60
    match:
      versionedExpr: SRC_IPS_V1
      config:
        srcIpRanges: ['*']
    description: "Global IP throttle at 1000 requests per minute per IP"

  # 2. OWASP Top 10: SQL Injection Protection
  - priority: 2000
    action: deny(403)
    match:
      expr:
        expression: "evaluatePreconfiguredExpr('sqli-v33-stable')"
    description: "Block SQL injection attempts"

  # 3. OWASP Top 10: Cross-Site Scripting (XSS) Protection
  - priority: 2100
    action: deny(403)
    match:
      expr:
        expression: "evaluatePreconfiguredExpr('xss-v33-stable')"
    description: "Block XSS payloads"

  # 4. OWASP Top 10: Remote Code Execution & Command Injection
  - priority: 2200
    action: deny(403)
    match:
      expr:
        expression: "evaluatePreconfiguredExpr('rce-v33-stable')"
    description: "Block RCE and shell command injections"

  # 5. OWASP Top 10: Local / Remote File Inclusion
  - priority: 2300
    action: deny(403)
    match:
      expr:
        expression: "evaluatePreconfiguredExpr('lfi-v33-stable') || evaluatePreconfiguredExpr('rfi-v33-stable')"
    description: "Block LFI/RFI attempts"

  # 6. Optional Regional Geo-Fencing (Bay of Bengal / APAC Priority)
  - priority: 3000
    action: allow
    match:
      expr:
        expression: "['IN', 'BD', 'MM', 'TH', 'LK', 'PH', 'ID', 'US', 'GB'].contains(origin.region_code)"
    description: "Allow priority traffic from primary operational regions"

  # Default Catch-All
  - priority: 2147483647
    action: allow
    match:
      versionedExpr: SRC_IPS_V1
      config:
        srcIpRanges: ['*']
```

---

## 2. Application-Level Rate Limiting Tiers (FastAPI + SlowAPI)

In addition to Cloud Armor edge throttles, the application enforces granular endpoint rate limits:

| Tier | Rate Limit | Scope / Endpoints | Purpose |
|------|-----------|-------------------|---------|
| **LLM Reasoning & TTS** | 10 req / min / IP | `/api/gemini/exposure`, `/api/generate-advisory`, `/api/synthesize-audio` | Prevents Gemini API cost surges and token exhaustion |
| **Auth & Secret Verification** | 5 req / min / IP | `/api/auth/verify`, token exchange | Brute-force credential protection |
| **State Mutations & Approvals** | 30 req / min / IP | `/api/advisories/approve`, `/api/advisories/reject`, `/api/feedback` | Prevents race conditions and spam state transitions |
| **Public Read & GIS Data** | 60 req / min / IP | `/api/cyclone/live`, `/api/infrastructure`, `/health/*` | High-availability read access |

---

## 3. Service-to-Service Request Signing (HMAC-SHA256)

For automated webhook triggers, cron jobs, and internal daemon calls, incoming requests must be signed with HMAC-SHA256:

### Specification:
- **Header:** `X-Service-Signature: t={timestamp},v1={hex_digest}`
- **Signing String:** `{timestamp}:{request_body}`
- **Secret Key:** Fetched from Google Secret Manager (`INTERNAL_SERVICE_SECRET`).
- **Replay Window:** 300 seconds maximum allowable drift between client timestamp and server clock.

---

## 4. HTTP Security Headers

Every response is injected with security headers via `SecurityHeadersMiddleware`:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; img-src 'self' data: https: https://*.tile.openstreetmap.org https://earthengine.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; font-src 'self' data: https://fonts.gstatic.com;
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
```

---

## 5. CORS Allowlist Policy

The backend restricts allowed origins to:
- `https://cyclone-risk-platform.vercel.app`
- Preview deployments matching regex `https://.*\.vercel\.app`
- Local development origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:8000`

Wildcard origins (`*`) are disabled in production configurations.
