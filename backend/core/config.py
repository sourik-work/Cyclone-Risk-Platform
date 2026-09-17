"""Application configuration loader with zero hardcoded project IDs."""

import os
from pathlib import Path
from typing import Optional
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_BASE_DIR = _BACKEND_DIR.parent


class AppSettings(BaseSettings):
    """Global configuration settings loaded strictly from environment variables."""

    # Google Cloud Project Configuration
    gcp_project_id: str = ""
    gcp_region: str = "asia-south1"
    bigquery_dataset: str = "cyclone_risk_dw"
    bigquery_location: str = "asia-south1"

    # Gemini AI Configuration (Default to gemini-3.7-flash per coding rules)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.7-flash"

    # Server Runtime
    port: int = Field(default=8000, validation_alias=AliasChoices("backend_port", "port"))
    host: str = Field(default="0.0.0.0", validation_alias=AliasChoices("backend_host", "host"))
    environment: str = "development"
    log_level: str = "INFO"

    # Firebase
    firebase_project_id: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            str(_BASE_DIR / ".env"),
            "backend/.env",
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def validate_gcp_project(self) -> None:
        """Validates that GCP Project ID has been provided before executing GCP operations."""
        if not self.gcp_project_id:
            raise ValueError(
                "GCP_PROJECT_ID environment variable is missing. "
                "Hardcoding project IDs is prohibited by platform rules."
            )


# Cached global settings instance
def get_settings() -> AppSettings:
    """Returns singleton instance of AppSettings."""
    return AppSettings()
