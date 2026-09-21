"""Firebase Admin SDK service for authentication, Firestore persistence, and Cloud Messaging."""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import auth, credentials, firestore, messaging

from backend.core.config import get_settings

logger = logging.getLogger(__name__)

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "cyclone-risk-platform")
_FIREBASE_APP: Optional[firebase_admin.App] = None


def get_firebase_app() -> Optional[firebase_admin.App]:
    """Initializes or retrieves the Firebase Admin App using ADC."""
    global _FIREBASE_APP
    if _FIREBASE_APP is not None:
        return _FIREBASE_APP
    if firebase_admin._apps:
        _FIREBASE_APP = firebase_admin.get_app()
        return _FIREBASE_APP

    settings = get_settings()
    active_project = settings.firebase_project_id or settings.gcp_project_id or PROJECT_ID

    try:
        cred = credentials.ApplicationDefault()
        _FIREBASE_APP = firebase_admin.initialize_app(
            credential=cred,
            options={"projectId": active_project},
        )
        logger.info(f"Firebase Admin initialized with project: {active_project}")
    except Exception as e:
        logger.warning(f"Firebase Admin SDK initialization using ADC failed: {e}. Attempting fallback initialization.")
        try:
            _FIREBASE_APP = firebase_admin.initialize_app(
                options={"projectId": active_project},
            )
        except Exception as inner_e:
            logger.error(f"Failed to initialize Firebase Admin app: {inner_e}")
            _FIREBASE_APP = None

    return _FIREBASE_APP


def verify_id_token(id_token: str) -> Dict[str, Any]:
    """Validates Firebase Auth ID tokens. Returns dict with uid, email, and valid flag."""
    if not id_token or not isinstance(id_token, str):
        return {"uid": "", "email": None, "valid": False}
    try:
        get_firebase_app()
        decoded = auth.verify_id_token(id_token)
        return {
            "uid": decoded.get("uid", ""),
            "email": decoded.get("email"),
            "valid": True,
        }
    except Exception as e:
        logger.warning(f"ID token verification failed: {e}")
        return {
            "uid": "",
            "email": None,
            "valid": False,
        }


def get_firestore_client() -> Any:
    """Returns Firestore client."""
    get_firebase_app()
    return firestore.client()


def write_citizen_report(report: Dict[str, Any]) -> str:
    """Writes to citizen_reports collection, returns doc ID."""
    db = get_firestore_client()
    report_data = dict(report)
    doc_id = report_data.get("report_id")
    if doc_id:
        doc_ref = db.collection("citizen_reports").document(doc_id)
    else:
        doc_ref = db.collection("citizen_reports").document()
        doc_id = doc_ref.id
        report_data["report_id"] = doc_id

    if "created_at" not in report_data:
        report_data["created_at"] = datetime.now(timezone.utc).isoformat()

    doc_ref.set(report_data)
    return doc_id


def get_recent_advisories(limit: int = 10) -> List[Dict[str, Any]]:
    """Reads from advisories collection."""
    db = get_firestore_client()
    docs = db.collection("advisories").limit(limit).stream()
    advisories = []
    for doc in docs:
        d = doc.to_dict() or {}
        if "id" not in d:
            d["id"] = doc.id
        advisories.append(d)
    return advisories


def subscribe_device(fcm_token: str, state: str) -> str:
    """Stores in alert_subscriptions collection."""
    db = get_firestore_client()
    doc_ref = db.collection("alert_subscriptions").document()
    sub_data = {
        "subscription_id": doc_ref.id,
        "fcm_token": fcm_token,
        "state": state,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "active": True,
    }
    doc_ref.set(sub_data)
    return doc_ref.id


def send_fcm_notification(title: str, body: str, state: str) -> Dict[str, Any]:
    """Sends push to all devices subscribed to a state."""
    db = get_firestore_client()
    docs = db.collection("alert_subscriptions").where("state", "==", state).stream()
    tokens = []
    for doc in docs:
        data = doc.to_dict() or {}
        if data.get("active", True) and data.get("fcm_token"):
            tokens.append(data["fcm_token"])

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
