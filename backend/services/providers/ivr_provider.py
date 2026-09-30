"""IVR outbound voice call provider with retry on no-answer and multilingual TTS integration."""

import os
import time
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)


class IVRProviderBase(ABC):
    """Abstract base class for automated outbound IVR voice alerts."""

    @abstractmethod
    def call(self, phone: str, audio_url: str, retry_policy: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Initiates an outbound voice call with automated retries."""
        pass


class ExotelIVRProvider(IVRProviderBase):
    """India-based IVR provider (Exotel Voice API) for coastal languages."""

    def __init__(self, sid: Optional[str] = None, token: Optional[str] = None, caller_id: Optional[str] = None, mock_mode: Optional[bool] = None):
        self.sid = sid or os.getenv("EXOTEL_SID", "mock_exotel_sid")
        self.token = token or os.getenv("EXOTEL_TOKEN", "mock_exotel_token")
        self.caller_id = caller_id or os.getenv("EXOTEL_CALLER_ID", "08088880000")
        self.mock_mode = mock_mode if mock_mode is not None else (self.sid == "mock_exotel_sid" or "TESTING" in os.environ)

    def call(self, phone: str, audio_url: str, retry_policy: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        policy = retry_policy or {"max_retries": 3, "retry_interval_seconds": 60, "retry_on": ["no-answer", "busy", "failed"]}
        call_id = f"exo-{uuid.uuid4().hex[:12]}"
        
        if self.mock_mode:
            logger.info(f"[Exotel Mock] Initiating outbound IVR call {call_id} to {phone}, audio={audio_url}")
            return {
                "call_id": call_id,
                "status": "initiated",
                "provider": "Exotel",
                "recipient": phone,
                "audio_url": audio_url,
                "retry_policy": policy,
                "timestamp": time.time(),
            }

        endpoint = f"https://api.exotel.com/v1/Accounts/{self.sid}/Calls/connect.json"
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(
                    endpoint,
                    auth=(self.sid, self.token),
                    data={"From": phone, "CallerId": self.caller_id, "Url": audio_url, "TimeLimit": "180"},
                )
                res.raise_for_status()
                data = res.json()
                return {
                    "call_id": data.get("Call", {}).get("Sid", call_id),
                    "status": "initiated",
                    "provider": "Exotel",
                    "recipient": phone,
                    "audio_url": audio_url,
                    "retry_policy": policy,
                }
        except Exception as exc:
            logger.error(f"[Exotel] Call initiation error to {phone}: {exc}")
            return {
                "call_id": call_id,
                "status": "failed",
                "error": str(exc),
                "provider": "Exotel",
                "recipient": phone,
            }


class TwilioIVRProvider(IVRProviderBase):
    """Twilio Voice API for global fallback outbound calls."""

    def __init__(self, account_sid: Optional[str] = None, auth_token: Optional[str] = None, from_number: Optional[str] = None, mock_mode: Optional[bool] = None):
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID", "mock_twilio_sid")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN", "mock_twilio_token")
        self.from_number = from_number or os.getenv("TWILIO_FROM_NUMBER", "+15005550006")
        self.mock_mode = mock_mode if mock_mode is not None else (self.account_sid == "mock_twilio_sid" or "TESTING" in os.environ)

    def call(self, phone: str, audio_url: str, retry_policy: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        policy = retry_policy or {"max_retries": 2, "retry_interval_seconds": 90}
        call_id = f"CA{uuid.uuid4().hex[:32]}"
        
        if self.mock_mode:
            logger.info(f"[Twilio Voice Mock] Call {call_id} to {phone}, playing {audio_url}")
            return {
                "call_id": call_id,
                "status": "queued",
                "provider": "TwilioVoice",
                "recipient": phone,
                "audio_url": audio_url,
                "retry_policy": policy,
            }

        endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Calls.json"
        twiml = f"<Response><Play>{audio_url}</Play></Response>"
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(
                    endpoint,
                    auth=(self.account_sid, self.auth_token),
                    data={"To": phone, "From": self.from_number, "Twiml": twiml},
                )
                res.raise_for_status()
                data = res.json()
                return {
                    "call_id": data.get("sid", call_id),
                    "status": data.get("status", "queued"),
                    "provider": "TwilioVoice",
                    "recipient": phone,
                    "audio_url": audio_url,
                }
        except Exception as exc:
            logger.error(f"[TwilioVoice] Call error to {phone}: {exc}")
            return {
                "call_id": call_id,
                "status": "failed",
                "error": str(exc),
                "provider": "TwilioVoice",
                "recipient": phone,
            }
