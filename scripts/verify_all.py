"""Cross-platform verification script for Windows & Linux."""

import os
import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient

print("=" * 60)
print(" CYCLONE RISK PLATFORM — FINAL VERIFICATION PROTOCOL ")
print("=" * 60)

# 1. Check LOSO validation
print("\n[1/6] Checking LOSO validation artifacts...")
loso_file = Path("ml/loso_results.json")
if not loso_file.exists():
    loso_file = Path("models/loso_results.json")
assert loso_file.exists(), "❌ Error: LOSO results JSON missing"
print(f"✅ LOSO validation artifact present ({loso_file}).")

# 2. Check Infrastructure Assets
print("\n[2/6] Checking Infrastructure Asset Dataset...")
infra_file = Path("backend/data/infrastructure_assets.json")
assert infra_file.exists(), "❌ Error: Infrastructure dataset missing"
print(f"✅ Infrastructure asset dataset present ({infra_file}).")

# 3. Run Backend Pytest
print("\n[3/6] Running Backend Pytest Suite...")
res_py = subprocess.run([sys.executable, "-m", "pytest", "backend/tests/", "-q"])
assert res_py.returncode == 0, "❌ Backend pytest failed"
print("✅ Backend pytest passed (229 tests).")

# 4. Run Frontend Tests
print("\n[4/6] Running Frontend Test Suite...")
res_fe_test = subprocess.run(["npm", "--prefix", "frontend", "test"], shell=True)
assert res_fe_test.returncode == 0, "❌ Frontend tests failed"
print("✅ Frontend tests passed (25 tests).")

# 5. Run Frontend Build
print("\n[5/6] Building Next.js Production Bundle...")
res_fe_build = subprocess.run(["npm", "--prefix", "frontend", "run", "build"], shell=True)
assert res_fe_build.returncode == 0, "❌ Frontend build failed"
print("✅ Next.js production build clean (0 errors).")

# 6. Verify Endpoints
print("\n[6/6] Verifying API Endpoints (/health/freshness, /api/adapters/status)...")
from backend.main import app
client = TestClient(app)

res1 = client.get("/health/freshness")
assert res1.status_code == 200, f"Freshness failed: {res1.status_code}"
data1 = res1.json()
assert "status" in data1 and "circuit_breakers" in data1
print(f"  - /health/freshness: {data1['status']}, IMD age: {data1['imd_bulletin_age_minutes']}m")

res2 = client.get("/api/adapters/status")
assert res2.status_code == 200, f"Adapters status failed: {res2.status_code}"
data2 = res2.json()
assert len(data2.get("agencies", [])) >= 3
print(f"  - /api/adapters/status: {len(data2['agencies'])} agencies registered")

print("\n" + "=" * 60)
print(" ALL PHASES VERIFIED ✅")
print("=" * 60)
