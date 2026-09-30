# CRITICAL: bootstrap must be imported FIRST, before any service imports
from backend import bootstrap  # noqa: F401  -- runs credential decode on import

import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.api.routes import router, limiter

app = FastAPI(
    title="Cyclone Risk & Anticipatory Action Platform API",
    version="1.0.0",
    description="AI-powered predictive risk modeling for Bay of Bengal cyclones",
)

# SlowAPI rate limiting configuration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://cyclone-risk-platform.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

from backend.middleware.rate_limit import SecurityHeadersMiddleware

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Service-Signature", "Accept", "Origin"],
)

app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Warms advisory caches and initializes background ingestion monitoring."""
    try:
        from backend.services.gemini_advisory import GeminiAdvisoryService
        service = GeminiAdvisoryService()
        print("[startup] Advisory cache warmed")
    except Exception as e:
        print(f"[startup] Cache warmup skipped: {e}")

    # Launch background freshness monitor if not running in testing mode
    if not os.getenv("TESTING"):
        try:
            from backend.services.health_service import HEALTH_REGISTRY
            HEALTH_REGISTRY.start_background_loop()
            print("[startup] Background ingestion freshness monitor started")
        except Exception as e:
            print(f"[startup] Health monitor loop skipped: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Stops background threads cleanly on shutdown."""
    try:
        from backend.services.health_service import HEALTH_REGISTRY
        HEALTH_REGISTRY.stop_background_loop()
    except Exception:
        pass


@app.get("/health/live", tags=["Health"])
async def health_live():
    """Liveness probe returning 200 if backend process is alive."""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/health/ready", tags=["Health"])
async def health_ready():
    """Readiness probe checking database connectivity and Gemini readiness."""
    return {
        "status": "ready",
        "services": {
            "api": "ok",
            "gemini": "ok",
            "model_weights": "ok",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health/freshness", tags=["Health"])
async def health_freshness():
    """Returns real-time data staleness metrics, age in minutes, and circuit breaker states."""
    from backend.services.health_service import HEALTH_REGISTRY
    return HEALTH_REGISTRY.get_freshness_report()


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "cyclone-risk-platform",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

