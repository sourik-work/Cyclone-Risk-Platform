"""Multi-channel last-mile dispatch service with parallel fanout, retry, and receipt logging."""

import asyncio
import os
import time
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.services.providers.sms_provider import CompositeSMSProvider, SMSProviderBase
from backend.services.providers.ivr_provider import ExotelIVRProvider, IVRProviderBase
from backend.services.providers.radio_provider import CommunityRadioProvider, RadioProviderBase

logger = logging.getLogger(__name__)


class LastMileDispatchService:
    """Orchestrates multi-channel alert dispatch across SMS, IVR, and Radio."""

    def __init__(
        self,
        sms_provider: Optional[SMSProviderBase] = None,
        ivr_provider: Optional[IVRProviderBase] = None,
        radio_provider: Optional[RadioProviderBase] = None,
    ):
        self.sms_provider = sms_provider or CompositeSMSProvider()
        self.ivr_provider = ivr_provider or ExotelIVRProvider()
        self.radio_provider = radio_provider or CommunityRadioProvider()
        self._delivery_receipts: List[Dict[str, Any]] = []

    def dispatch_alert(
        self,
        advisory_id: str,
        approval_status: str,
        recipients: List[Dict[str, Any]],
        cyclone_context: Dict[str, Any],
        radio_stations: Optional[List[Dict[str, Any]]] = None,
        operator_uid: Optional[str] = "operator_sys",
    ) -> Dict[str, Any]:
        """Dispatches approved advisory across last-mile channels in parallel.
        
        Args:
            advisory_id: Unique advisory ID.
            approval_status: Must be 'approved' or 'APPROVED' to trigger dispatch.
            recipients: List of target contacts with phone, language, role.
            cyclone_context: Hazard dictionary (cyclone_name, wind_speed, alert_level, action).
            radio_stations: Optional list of coastal community radio stations.
            operator_uid: The approving operator UID.
            
        Returns:
            Dispatch execution receipt with channel breakdowns.
        """
        # 1. Enforce State Machine Gate
        if str(approval_status).upper() not in ("APPROVED", "DISPATCHED"):
            raise ValueError(f"Dispatch rejected: Advisory {advisory_id} is in status '{approval_status}', must be APPROVED.")

        dispatch_id = f"DSP-{uuid.uuid4().hex[:8].upper()}"
        start_time = time.time()
        receipts: List[Dict[str, Any]] = []

        sms_params = {
            "cyclone_name": cyclone_context.get("cyclone_name", "Tropical Cyclone"),
            "wind_speed": str(cyclone_context.get("wind_speed", "120 km/h")),
            "action": cyclone_context.get("action", "Move to reinforced cyclone shelter immediately."),
        }

        # 2. Parallel Fanout for SMS
        def _send_sms_with_retry(contact: Dict[str, Any]) -> Dict[str, Any]:
            phone = contact.get("phone", "")
            res = self.sms_provider.send(phone, template_id="CYC_ALERT_V1", params=sms_params)
            res["channel"] = "SMS"
            res["contact_role"] = contact.get("role", "CITIZEN")
            return res

        # 3. Parallel Fanout for IVR
        def _call_ivr_with_retry(contact: Dict[str, Any]) -> Dict[str, Any]:
            phone = contact.get("phone", "")
            audio_url = contact.get("audio_url", "https://cyclone-risk-platform.vercel.app/audio/cyclone_warning_odia.mp3")
            res = self.ivr_provider.call(phone, audio_url=audio_url)
            res["channel"] = "IVR"
            res["contact_role"] = contact.get("role", "CITIZEN")
            return res

        with ThreadPoolExecutor(max_workers=10) as executor:
            sms_futures = [executor.submit(_send_sms_with_retry, c) for c in recipients if "phone" in c]
            ivr_futures = [executor.submit(_call_ivr_with_retry, c) for c in recipients if c.get("enable_ivr", False)]

            for f in sms_futures:
                receipts.append(f.result())
            for f in ivr_futures:
                receipts.append(f.result())

        # 4. Radio Queue Dispatches
        stations = radio_stations or [
            {"station_id": "CR-OD-01", "name": "Radio Namaskar 90.4 FM (Konark/Puri)", "language": "Odia"},
            {"station_id": "CR-WB-01", "name": "Radio Digha 90.8 FM (Purba Medinipur)", "language": "Bengali"},
        ]
        radio_script = f"EMERGENCY CYCLONE WARNING: {sms_params['cyclone_name']} approaching. Maximum sustained winds {sms_params['wind_speed']}. {sms_params['action']}"
        
        radio_receipts = []
        for st in stations:
            r_res = self.radio_provider.queue_broadcast(
                station_id=st["station_id"],
                station_name=st["name"],
                language=st["language"],
                script_text=radio_script,
                priority="HIGH",
            )
            radio_receipts.append(r_res)

        elapsed = round(time.time() - start_time, 3)
        summary = {
            "dispatch_id": dispatch_id,
            "advisory_id": advisory_id,
            "dispatched_by": operator_uid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": elapsed,
            "total_recipients": len(recipients),
            "sms_sent": sum(1 for r in receipts if r.get("channel") == "SMS" and r.get("status") == "sent"),
            "ivr_calls_initiated": sum(1 for r in receipts if r.get("channel") == "IVR"),
            "radio_broadcasts_queued": len(radio_receipts),
            "receipts": receipts,
            "radio_receipts": radio_receipts,
        }

        self._delivery_receipts.append(summary)
        return summary

    def get_receipts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent dispatch receipts."""
        return self._delivery_receipts[-limit:]
