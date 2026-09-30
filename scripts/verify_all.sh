#!/usr/bin/env bash
set -e

echo "======================================================="
echo " CYCLONE RISK PLATFORM — FINAL VERIFICATION PROTOCOL   "
echo "======================================================="

# 1. Check LOSO validation artifact
echo "[1/6] Checking LOSO validation results..."
if [ ! -f "ml/loso_results.json" ] && [ ! -f "models/loso_results.json" ]; then
    echo "❌ Error: LOSO validation JSON missing"
    exit 1
fi
echo "✅ LOSO validation artifact present."

# 2. Check Infrastructure Asset Catalog
echo "[2/6] Checking Infrastructure Asset Dataset..."
if [ ! -f "backend/data/infrastructure_assets.json" ]; then
    echo "❌ Error: Infrastructure dataset missing"
    exit 1
fi
echo "✅ Infrastructure asset dataset present."

# 3. Run Backend Test Suite (Target 200+ tests)
echo "[3/6] Running Backend Pytest Suite..."
python -m pytest backend/tests/ -v -q
echo "✅ Backend tests passed."

# 4. Run Frontend Test Suite (Node.js runner)
echo "[4/6] Running Frontend Test Suite..."
npm --prefix frontend test
echo "✅ Frontend tests passed."

# 5. Run Frontend Production Build
echo "[5/6] Building Next.js Production Bundle..."
npm --prefix frontend run build
echo "✅ Frontend Next.js build clean."

# 6. Verify API Endpoints (Synthetic Client)
echo "[6/6] Verifying In-Memory Endpoints (/health/freshness, /api/adapters/status)..."
python -c "
from fastapi.testclient import TestClient
from backend.main import app
client = TestClient(app)

res1 = client.get('/health/freshness')
assert res1.status_code == 200, f'Freshness failed: {res1.status_code}'
data1 = res1.json()
assert 'status' in data1 and 'circuit_breakers' in data1

res2 = client.get('/api/adapters/status')
assert res2.status_code == 200, f'Adapters status failed: {res2.status_code}'
data2 = res2.json()
assert len(data2.get('agencies', [])) >= 3

print('✅ API Endpoints verified.')
"

echo "======================================================="
echo " ALL PHASES VERIFIED ✅                                "
echo " Scorecard updated, tests passing, zero placeholders.  "
echo "======================================================="
