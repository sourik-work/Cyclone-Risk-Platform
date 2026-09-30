"""Data Staleness Monitoring, Health Checks, and Circuit Breaker Service.

Tracks ingestion freshness for IMD bulletins, GEE satellite imagery, and Firestore writes.
Manages circuit breakers with automatic trip, half-open recovery, and background refresh.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("health_service")


class CircuitBreaker:
    """Configurable circuit breaker with Closed, Open, and Half-Open states."""

    def __init__(self, name: str, failure_threshold: int = 5, recovery_timeout_sec: float = 60.0):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.state = "CLOSED"  # "CLOSED", "OPEN", "HALF_OPEN"
        self.consecutive_failures = 0
        self.last_failure_time: Optional[datetime] = None
        self.last_state_change: datetime = datetime.now(timezone.utc)
        self._lock = threading.Lock()

    def can_execute(self) -> bool:
        with self._lock:
            now = datetime.now(timezone.utc)
            if self.state == "CLOSED":
                return True
            if self.state == "OPEN":
                if self.last_failure_time:
                    elapsed = (now - self.last_failure_time).total_seconds()
                    if elapsed >= self.recovery_timeout_sec:
                        self.state = "HALF_OPEN"
                        self.last_state_change = now
                        logger.info("Circuit breaker %s transitioned OPEN -> HALF_OPEN after %.1fs", self.name, elapsed)
                        return True
                return False
            if self.state == "HALF_OPEN":
                return True
            return False

    def record_success(self) -> None:
        with self._lock:
            self.consecutive_failures = 0
            if self.state != "CLOSED":
                logger.info("Circuit breaker %s recovered: %s -> CLOSED", self.name, self.state)
                self.state = "CLOSED"
                self.last_state_change = datetime.now(timezone.utc)

    def record_failure(self, error: Optional[Exception] = None) -> None:
        with self._lock:
            self.consecutive_failures += 1
            self.last_failure_time = datetime.now(timezone.utc)
            if self.consecutive_failures >= self.failure_threshold and self.state != "OPEN":
                self.state = "OPEN"
                self.last_state_change = self.last_failure_time
                logger.warning(
                    "Circuit breaker %s TRIPPED -> OPEN (consecutive failures: %d, err: %s)",
                    self.name, self.consecutive_failures, error,
                )

    def to_dict(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "name": self.name,
                "state": self.state,
                "consecutive_failures": self.consecutive_failures,
                "failure_threshold": self.failure_threshold,
                "recovery_timeout_sec": self.recovery_timeout_sec,
                "last_state_change": self.last_state_change.isoformat(),
            }


class HealthRegistry:
    """In-memory data staleness registry and ingestion monitoring."""

    def __init__(self):
        now = datetime.now(timezone.utc)
        self.last_imd_fetch: datetime = now
        self.last_gee_fetch: datetime = now
        self.last_firestore_write: datetime = now
        self.imd_circuit = CircuitBreaker("IMD_RSMC_Ingestion", failure_threshold=5, recovery_timeout_sec=60.0)
        self.gee_circuit = CircuitBreaker("GEE_Satellite_Ingestion", failure_threshold=5, recovery_timeout_sec=60.0)
        self.thresholds = {
            "imd_max_age_minutes": 45,
            "gee_max_age_minutes": 360,
        }
        self.ingestion_log: List[Dict[str, Any]] = []
        self._bg_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def record_imd_fetch(self, success: bool = True, error: Optional[Exception] = None, storm_id: Optional[str] = None) -> None:
        now = datetime.now(timezone.utc)
        with self._lock:
            if success:
                self.last_imd_fetch = now
                self.imd_circuit.record_success()
            else:
                self.imd_circuit.record_failure(error)

            log_entry = {
                "source": "IMD_RSMC",
                "timestamp": now.isoformat(),
                "success": success,
                "error": str(error) if error else None,
                "storm_id": storm_id,
            }
            self.ingestion_log.append(log_entry)
            if len(self.ingestion_log) > 100:
                self.ingestion_log.pop(0)

    def record_gee_fetch(self, success: bool = True, error: Optional[Exception] = None, cyclone_name: Optional[str] = None) -> None:
        now = datetime.now(timezone.utc)
        with self._lock:
            if success:
                self.last_gee_fetch = now
                self.gee_circuit.record_success()
            else:
                self.gee_circuit.record_failure(error)

            log_entry = {
                "source": "GEE_SAR",
                "timestamp": now.isoformat(),
                "success": success,
                "error": str(error) if error else None,
                "cyclone_name": cyclone_name,
            }
            self.ingestion_log.append(log_entry)
            if len(self.ingestion_log) > 100:
                self.ingestion_log.pop(0)

    def record_firestore_write(self, collection: str, doc_id: str, actor: str = "system", reason: str = "update") -> None:
        now = datetime.now(timezone.utc)
        with self._lock:
            self.last_firestore_write = now
            log_entry = {
                "source": "FIRESTORE",
                "timestamp": now.isoformat(),
                "collection": collection,
                "doc_id": doc_id,
                "actor": actor,
                "reason": reason,
            }
            self.ingestion_log.append(log_entry)
            if len(self.ingestion_log) > 100:
                self.ingestion_log.pop(0)

    def get_freshness_report(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        with self._lock:
            imd_age_min = round((now - self.last_imd_fetch).total_seconds() / 60.0, 1)
            gee_age_min = round((now - self.last_gee_fetch).total_seconds() / 60.0, 1)
            fs_age_min = round((now - self.last_firestore_write).total_seconds() / 60.0, 1)

            imd_stale = imd_age_min > self.thresholds["imd_max_age_minutes"]
            gee_stale = gee_age_min > self.thresholds["gee_max_age_minutes"]
            circuit_open = self.imd_circuit.state != "CLOSED" or self.gee_circuit.state != "CLOSED"

            if (imd_age_min > 120 and gee_age_min > 720) or (self.imd_circuit.state == "OPEN" and self.gee_circuit.state == "OPEN"):
                status = "critical"
            elif imd_stale or gee_stale or circuit_open:
                status = "degraded"
            else:
                status = "healthy"

            return {
                "status": status,
                "imd_bulletin_age_minutes": imd_age_min,
                "gee_tile_age_minutes": gee_age_min,
                "firestore_write_age_minutes": fs_age_min,
                "thresholds": {
                    "imd": self.thresholds["imd_max_age_minutes"],
                    "gee": self.thresholds["gee_max_age_minutes"],
                },
                "last_imd_fetch_utc": self.last_imd_fetch.isoformat(),
                "last_gee_fetch_utc": self.last_gee_fetch.isoformat(),
                "last_firestore_write_utc": self.last_firestore_write.isoformat(),
                "circuit_breakers": {
                    "imd_fetcher": self.imd_circuit.to_dict(),
                    "gee_fetcher": self.gee_circuit.to_dict(),
                },
                "recent_ingestion_events": len(self.ingestion_log),
            }

    def start_background_loop(self) -> None:
        if self._bg_thread is not None and self._bg_thread.is_alive():
            return

        self._stop_event.clear()
        self._bg_thread = threading.Thread(target=self._run_loop, name="HealthIngestionLoop", daemon=True)
        self._bg_thread.start()
        logger.info("Started background ingestion freshness loop")

    def stop_background_loop(self) -> None:
        self._stop_event.set()
        if self._bg_thread and self._bg_thread.is_alive():
            self._bg_thread.join(timeout=2.0)

    def _run_loop(self) -> None:
        backoff_sec = 30.0
        while not self._stop_event.is_set():
            try:
                # 1. Periodic IMD check
                if self.imd_circuit.can_execute():
                    try:
                        from backend.services.imd_fetcher import fetch_live_cyclone_data
                        fetch_live_cyclone_data()
                        self.record_imd_fetch(success=True)
                        backoff_sec = 30.0  # Reset backoff on success
                    except Exception as e:
                        logger.warning("Background IMD bulletin refresh failed: %s", e)
                        self.record_imd_fetch(success=False, error=e)
                        backoff_sec = min(backoff_sec * 2.0, 300.0)

                # 2. Periodic GEE check
                if self.gee_circuit.can_execute():
                    try:
                        from backend.services.gee_service import get_sar_flood_extent
                        # Test reachability with Fani bounding box
                        get_sar_flood_extent("fani_2019", [85.0, 19.0, 86.5, 20.5])
                        self.record_gee_fetch(success=True, cyclone_name="fani_2019")
                    except Exception as e:
                        logger.warning("Background GEE tile refresh failed: %s", e)
                        self.record_gee_fetch(success=False, error=e, cyclone_name="fani_2019")

            except Exception as loop_err:
                logger.error("Error in background health loop: %s", loop_err)

            # Sleep in intervals allowing graceful shutdown
            for _ in range(int(min(backoff_sec, 60))):
                if self._stop_event.is_set():
                    break
                time.sleep(1.0)


# Global singleton instance
HEALTH_REGISTRY = HealthRegistry()
