"""
Runtime asset state service.
Persists status updates to Firestore collection: asset_status
Falls back to in-memory store if Firestore unavailable (CI/test).
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_MEMORY_STORE: Dict[str, Dict[str, Any]] = {}
_MEMORY_HISTORY: Dict[str, List[Dict[str, Any]]] = {}


def clear_memory_store() -> None:
    """Clears in-memory store and history (used in unit testing)."""
    global _MEMORY_STORE, _MEMORY_HISTORY
    _MEMORY_STORE.clear()
    _MEMORY_HISTORY.clear()


def update_asset_status(
    asset_id: str,
    status: str,
    reason: Optional[str] = None,
    updated_by: Optional[str] = None,
    metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Update an asset's live operational status. Persists to Firestore or memory fallback."""
    now_iso = datetime.now(timezone.utc).isoformat()
    entry = {
        "asset_id": asset_id,
        "status": status,
        "current_status": status,
        "reason": reason,
        "updated_by": updated_by,
        "updated_at": now_iso,
        "metrics": metrics or {},
    }

    # Record history in memory
    if asset_id not in _MEMORY_HISTORY:
        _MEMORY_HISTORY[asset_id] = []
    _MEMORY_HISTORY[asset_id].append(entry)
    _MEMORY_STORE[asset_id] = {**entry, "history": list(_MEMORY_HISTORY[asset_id])}

    # Try Firestore persistence
    try:
        from backend.services.firebase_service import get_firestore_client

        db = get_firestore_client()
        if db is not None:
            # Set current status document
            db.collection("asset_status").document(asset_id).set(entry, merge=True)
            # Append audit trail to history subcollection / collection
            db.collection("asset_status_history").add(entry)
    except Exception as exc:
        logger.debug("Firestore not configured or unavailable for asset status update: %s", exc)

    return _MEMORY_STORE[asset_id]


def get_asset_status(asset_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an asset's current operational status and history."""
    try:
        from backend.services.firebase_service import get_firestore_client

        db = get_firestore_client()
        if db is not None:
            doc = db.collection("asset_status").document(asset_id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                # Query history if available
                history_list: List[Dict[str, Any]] = []
                try:
                    for h_doc in (
                        db.collection("asset_status_history")
                        .where("asset_id", "==", asset_id)
                        .order_by("updated_at", direction="ASCENDING")
                        .stream()
                    ):
                        history_list.append(h_doc.to_dict())
                except Exception:
                    pass
                if history_list:
                    data["history"] = history_list
                return data
    except Exception as exc:
        logger.debug("Firestore unavailable in get_asset_status: %s", exc)

    return _MEMORY_STORE.get(asset_id)


def get_all_asset_statuses() -> Dict[str, Dict[str, Any]]:
    """Returns {asset_id: status_entry} for all tracked assets."""
    try:
        from backend.services.firebase_service import get_firestore_client

        db = get_firestore_client()
        if db is not None:
            result = {}
            for doc in db.collection("asset_status").stream():
                result[doc.id] = doc.to_dict()
            if result:
                return result
    except Exception as exc:
        logger.debug("Firestore unavailable in get_all_asset_statuses: %s", exc)

    return dict(_MEMORY_STORE)
