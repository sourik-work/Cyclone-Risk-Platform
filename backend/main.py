"""Main entrypoint for Cyclone Risk Platform FastAPI application."""

import base64
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Handle credentials from base64-encoded env var (for Render deployment)
creds_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if creds_env and not Path(creds_env).exists():
    # Not a file path — assume it's a base64-encoded JSON
    try:
        decoded = base64.b64decode(creds_env)
        creds_path = "/tmp/service-account.json" if os.name != "nt" else str(Path.home() / "service-account.json")
        with open(creds_path, "wb") as f:
            f.write(decoded)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
        print(f"Decoded credentials to: {creds_path}")
    except Exception as e:
        print(f"Warning: Could not decode credentials env var: {e}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.core.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cyclone-platform-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    settings = get_settings()
    logger.info("Starting Cyclone Risk & Anticipatory Action Platform API")
    logger.info(f"Target Gemini Model: {settings.gemini_model}")
    logger.info(f"Environment: {settings.environment} | Port: {settings.port}")
    if settings.gcp_project_id:
        logger.info(f"GCP Project: {settings.gcp_project_id}")
    else:
        logger.info("GCP Project ID: Not specified (Running in local/demo mode)")

    yield

    logger.info("Shutting down Cyclone Risk Platform API")


app = FastAPI(
    title="Cyclone Risk & Anticipatory Action Platform API",
    description="Pre-landfall risk modeling, vulnerability assessment, and Gemini 3.7 Flash multilingual early warnings for Bay of Bengal cyclones.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration allowing local Next.js frontend and production URLs
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL from env var
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Allow all Vercel preview URLs (pattern)
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.port, reload=True)
