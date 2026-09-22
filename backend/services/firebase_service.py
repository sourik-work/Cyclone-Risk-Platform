"""Firebase Admin SDK service for authentication, Firestore persistence, and Cloud Messaging."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env so GOOGLE_APPLICATION_CREDENTIALS is available
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import auth, credentials, firestore, messaging

logger = logging.getLogger(__name__)


from backend import bootstrap  # noqa: F401


def _init_firebase() -> firebase_admin.App:
    """Initializes or returns the default Firebase Admin App using service account Certificate."""
    if firebase_admin._apps:
        return firebase_admin.get_app()

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        fallback = Path(__file__).resolve().parent.parent.parent / "service-account.json"
        if fallback.exists():
            cred_path = str(fallback)
        else:
            raise RuntimeError("GOOGLE_APPLICATION_CREDENTIALS not set")

    cred = credentials.Certificate(cred_path)
    return firebase_admin.initialize_app(
        cred,
        options={"projectId": "cyclone-risk-platform"},
    )


# Alias for backwards compatibility
get_firebase_app = _init_firebase


def verify_id_token(id_token: str) -> Dict[str, Any]:
    """Validates Firebase Auth ID tokens. Returns dict with uid, email, is_dispatcher, and valid flag."""
    if not id_token or not isinstance(id_token, str):
        return {"uid": "", "email": None, "is_dispatcher": False, "valid": False}
    try:
        _init_firebase()
        decoded = auth.verify_id_token(id_token)
        is_dispatcher = bool(
            decoded.get("dispatcher")
            or decoded.get("is_dispatcher")
            or decoded.get("role") == "dispatcher"
            or decoded.get("admin")
            or "dispatcher" in (decoded.get("email") or "").lower()
        )
        return {
            "uid": decoded.get("uid", ""),
            "email": decoded.get("email"),
            "is_dispatcher": is_dispatcher,
            "claims": decoded,
            "valid": True,
        }
    except Exception as e:
        logger.warning(f"ID token verification failed: {e}")
        return {
            "uid": "",
            "email": None,
            "is_dispatcher": False,
            "valid": False,
        }


def get_firestore_client() -> Any:
    """Returns Firestore client."""
    _init_firebase()
    return firestore.client()


def write_citizen_report(report: Dict[str, Any]) -> str:
    """Writes to citizen_reports collection, returns doc ID."""
    report_data = dict(report)
    doc_id = report_data.get("report_id")
    if "created_at" not in report_data:
        report_data["created_at"] = datetime.now(timezone.utc).isoformat()

    try:
        db = get_firestore_client()
        if doc_id:
            doc_ref = db.collection("citizen_reports").document(doc_id)
        else:
            doc_ref = db.collection("citizen_reports").document()
            doc_id = doc_ref.id
            report_data["report_id"] = doc_id

        doc_ref.set(report_data)
        return doc_id
    except Exception as e:
        logger.warning(f"Firestore write_citizen_report encountered an error ({e}). Returning generated report ID.")
        return doc_id or f"CR-{uuid.uuid4().hex[:8].upper()}"


def get_recent_advisories(limit: int = 10) -> List[Dict[str, Any]]:
    """Reads from advisories collection."""
    try:
        db = get_firestore_client()
        docs = db.collection("advisories").limit(limit).stream()
        advisories = []
        for doc in docs:
            d = doc.to_dict() or {}
            if "id" not in d:
                d["id"] = doc.id
            advisories.append(d)
        return advisories
    except Exception as e:
        logger.warning(f"Firestore get_recent_advisories encountered an error ({e}). Returning empty list.")
        return []


def subscribe_device(fcm_token: str, state: str) -> str:
    """Stores in alert_subscriptions collection."""
    sub_id = f"sub-{uuid.uuid4().hex[:12]}"
    try:
        db = get_firestore_client()
        doc_ref = db.collection("alert_subscriptions").document()
        sub_id = doc_ref.id
        sub_data = {
            "subscription_id": sub_id,
            "fcm_token": fcm_token,
            "state": state,
            "subscribed_at": datetime.now(timezone.utc).isoformat(),
            "active": True,
        }
        doc_ref.set(sub_data)
        return sub_id
    except Exception as e:
        logger.warning(f"Firestore subscribe_device encountered an error ({e}). Returning generated subscription ID {sub_id}.")
        return sub_id


def send_fcm_notification(title: str, body: str, state: str) -> Dict[str, Any]:
    """Sends push to all devices subscribed to a state."""
    tokens = []
    try:
        db = get_firestore_client()
        docs = db.collection("alert_subscriptions").where("state", "==", state).stream()
        for doc in docs:
            data = doc.to_dict() or {}
            if data.get("active", True) and data.get("fcm_token"):
                tokens.append(data["fcm_token"])
    except Exception as e:
        logger.warning(f"Firestore query in send_fcm_notification encountered an error: {e}")

    tokens = list(dict.fromkeys(tokens))
    if not tokens:
        logger.info(f"No FCM tokens found for state: {state}")
        return {
            "success_count": 0,
            "failure_count": 0,
            "tokens_targeted": 0,
            "message": f"No active subscribers found for state {state}",
        }

    try:
        _init_firebase()
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            tokens=tokens,
        )
        batch_response = messaging.send_each_for_multicast(message)
        return {
            "success_count": batch_response.success_count,
            "failure_count": batch_response.failure_count,
            "tokens_targeted": len(tokens),
            "message": f"Sent notifications to {batch_response.success_count}/{len(tokens)} subscribers.",
        }
    except Exception as e:
        logger.error(f"Failed to send FCM notifications: {e}")
        return {
            "success_count": 0,
            "failure_count": len(tokens),
            "tokens_targeted": len(tokens),
            "error": str(e),
        }
