"""Google Cloud Storage service for citizen damage photo uploads and signed URLs."""

import datetime
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from google.cloud import storage

from backend.core.config import get_settings

logger = logging.getLogger(__name__)

BUCKET_NAME = os.getenv("GCS_CITIZEN_REPORTS_BUCKET", "cyclone-risk-platform-citizen-reports")
GCS_REGION = os.getenv("GCP_REGION", "asia-south1")

_STORAGE_CLIENT: Optional[storage.Client] = None


def _has_adc_credentials() -> bool:
    """Check if Application Default Credentials file or Cloud Run environment is present."""
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        return True
    user_home = Path.home()
    if (user_home / ".config" / "gcloud" / "application_default_credentials.json").exists():
        return True
    appdata = os.getenv("APPDATA")
    if appdata and (Path(appdata) / "gcloud" / "application_default_credentials.json").exists():
        return True
    if os.getenv("K_SERVICE") or os.getenv("GAE_INSTANCE"):
        return True
    return False


def get_storage_client() -> storage.Client:
    """Returns memoized or newly created google.cloud.storage.Client instance."""
    global _STORAGE_CLIENT
    if _STORAGE_CLIENT is not None:
        return _STORAGE_CLIENT

    settings = get_settings()
    project = settings.gcp_project_id or "cyclone-risk-platform"

    if _has_adc_credentials():
        try:
            _STORAGE_CLIENT = storage.Client(project=project)
            return _STORAGE_CLIENT
        except Exception as e:
            logger.warning(f"Failed to initialize storage.Client with ADC ({e}). Falling back to anonymous client.")

    _STORAGE_CLIENT = storage.Client.create_anonymous_client()
    return _STORAGE_CLIENT


def get_or_create_bucket(
    client: Optional[storage.Client] = None,
    bucket_name: str = BUCKET_NAME,
    region: str = GCS_REGION,
) -> Any:
    """Retrieves the citizen reports bucket or creates it if missing in asia-south1."""
    client = client or get_storage_client()
    try:
        bucket = client.lookup_bucket(bucket_name)
        if bucket:
            return bucket
        logger.info(f"Bucket {bucket_name} not found. Creating in region {region}...")
        return client.create_bucket(bucket_name, location=region)
    except Exception as e:
        logger.warning(f"Error checking/creating bucket {bucket_name} ({e}). Returning bucket handle.")
        return client.bucket(bucket_name)


def upload_citizen_photo(image_bytes: bytes, filename: str, report_id: str) -> str:
    """Uploads citizen report photo to GCS and returns public GCS URL.
    
    Target: gs://cyclone-risk-platform-citizen-reports/{report_id}/{filename}
    Returns: https://storage.googleapis.com/{bucket_name}/{report_id}/{filename}
    """
    bucket = get_or_create_bucket()
    blob_path = f"{report_id}/{filename}"
    blob = bucket.blob(blob_path)

    # Determine content-type
    content_type = "image/jpeg"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "png":
        content_type = "image/png"
    elif ext == "webp":
        content_type = "image/webp"

    blob.upload_from_string(image_bytes, content_type=content_type)
    return f"https://storage.googleapis.com/{bucket.name}/{blob_path}"


def get_signed_upload_url(report_id: str, filename: str) -> Dict[str, Any]:
    """Generates a v4 signed PUT URL for direct browser uploads valid for 15 minutes."""
    bucket = get_or_create_bucket()
    blob_path = f"{report_id}/{filename}"
    blob = bucket.blob(blob_path)

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=15),
        method="PUT",
        content_type="image/jpeg",
    )

    return {
        "upload_url": signed_url,
        "blob_path": blob_path,
        "bucket": bucket.name,
        "expires_in_minutes": 15,
    }
