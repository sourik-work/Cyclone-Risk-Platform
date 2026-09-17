"""Main entrypoint for Cyclone Risk Platform FastAPI application."""

import logging
from contextlib import asynccontextmanager
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

# CORS configuration allowing local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
    ],
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
