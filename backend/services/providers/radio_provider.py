"""Community Radio and All India Radio (AIR) broadcast alert queue providers."""

import os
import uuid
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class RadioProviderBase(ABC):
    """Abstract base class for radio broadcast alert dispatch."""

    @abstractmethod
    def queue_broadcast(
        self,
        station_id: str,
        station_name: str,
        language: str,
        script_text: str,
        audio_url: Optional[str] = None,
        priority: str = "HIGH",
    ) -> Dict[str, Any]:
        """Queues a radio emergency bulletin for on-air transmission."""
        pass


class CommunityRadioProvider(RadioProviderBase):
    """Manages community radio broadcast queues for localized FM stations (e.g. Radio Namaskar Puri, Radio Digha)."""

    def __init__(self):
        self._broadcast_queue: List[Dict[str, Any]] = []

    def queue_broadcast(
        self,
        station_id: str,
        station_name: str,
        language: str,
        script_text: str,
        audio_url: Optional[str] = None,
        priority: str = "HIGH",
    ) -> Dict[str, Any]:
        broadcast_id = f"CRB-{uuid.uuid4().hex[:8].upper()}"
        item = {
            "broadcast_id": broadcast_id,
            "channel": "COMMUNITY_RADIO",
            "station_id": station_id,
            "station_name": station_name,
            "language": language,
            "priority": priority,
            "script_text": script_text,
            "audio_url": audio_url,
            "status": "QUEUED_FOR_BROADCAST",
            "queued_at": datetime.now(timezone.utc).isoformat(),
            "download_package_url": f"/api/radio/bulletin/{broadcast_id}/download",
            "instructions": "Broadcast at 15-minute intervals between music and talk segments.",
        }
        self._broadcast_queue.append(item)
        logger.info(f"[Community Radio] Queued broadcast {broadcast_id} for {station_name} ({language})")
        return item

    def get_queue(self) -> List[Dict[str, Any]]:
        return list(self._broadcast_queue)


class AIRPrasarBharatiProvider(RadioProviderBase):
    """Prasar Bharati / All India Radio national disaster transmission hook (simulated API mode)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("AIR_DISASTER_API_KEY", "mock_air_key")
        self.api_enabled = os.getenv("AIR_API_ENABLED", "false").lower() == "true"

    def queue_broadcast(
        self,
        station_id: str,
        station_name: str,
        language: str,
        script_text: str,
        audio_url: Optional[str] = None,
        priority: str = "EMERGENCY_INTERRUPT",
    ) -> Dict[str, Any]:
        broadcast_id = f"AIR-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"[AIR Prasar Bharati] Alert dispatched to {station_name} [{priority}]")
        return {
            "broadcast_id": broadcast_id,
            "channel": "ALL_INDIA_RADIO_AIR",
            "station_id": station_id,
            "station_name": station_name,
            "language": language,
            "priority": priority,
            "script_text": script_text,
            "audio_url": audio_url,
            "status": "TRANSMITTED" if self.api_enabled else "QUEUED_MANUAL_HOTLINE",
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
            "fmc_channel": "AIR Coastal MW/FM Grid",
        }
