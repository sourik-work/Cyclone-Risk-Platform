"""SMS delivery providers with MSG91 (DLT registered) and Twilio (fallback) support."""

import os
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger(__name__)


class SMSProviderBase(ABC):
    """Abstract base class for SMS last-mile delivery providers."""

    @abstractmethod
    def send(self, phone: str, template_id: str, params: Dict[str, str]) -> Dict[str, Any]:
        """Dispatches an SMS message.
        
        Returns:
            Dict containing message_id, status ('sent' | 'failed' | 'queued'), provider name, and metadata.
        """
        pass


class MSG91SMSProvider(SMSProviderBase):
    """India-focused SMS provider using TRAI DLT-registered templates."""

    def __init__(self, auth_key: Optional[str] = None, sender_id: str = "CYCRSK", mock_mode: Optional[bool] = None):
        self.auth_key = auth_key or os.getenv("MSG91_AUTH_KEY", "mock_msg91_key")
        self.sender_id = os.getenv("MSG91_SENDER_ID", sender_id)
        self.mock_mode = mock_mode if mock_mode is not None else (self.auth_key == "mock_msg91_key" or "TESTING" in os.environ)
        self.endpoint = "https://control.msg91.com/api/v5/flow/"

    def send(self, phone: str, template_id: str, params: Dict[str, str]) -> Dict[str, Any]:
        cleaned_phone = phone.replace("+", "").replace(" ", "").strip()
        if not cleaned_phone.startswith("91") and len(cleaned_phone) == 10:
            cleaned_phone = f"91{cleaned_phone}"

        if self.mock_mode:
            logger.info(f"[MSG91 Mock] Sent SMS to {cleaned_phone} with template {template_id}, params={params}")
            return {
                "message_id": f"msg91-{uuid.uuid4().hex[:12]}",
                "status": "sent",
                "provider": "MSG91",
                "recipient": cleaned_phone,
                "template_id": template_id,
                "dlt_compliant": True,
            }

        headers = {
            "authkey": self.auth_key,
            "content-type": "application/json",
            "accept": "application/json",
        }
        payload = {
            "template_id": template_id,
            "sender": self.sender_id,
            "short_url": "0",
            "recipients": [{"mobiles": cleaned_phone, **params}],
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(self.endpoint, headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                return {
                    "message_id": data.get("message", f"msg91-{uuid.uuid4().hex[:8]}"),
                    "status": "sent" if res.status_code == 200 else "failed",
                    "provider": "MSG91",
                    "recipient": cleaned_phone,
                    "template_id": template_id,
                    "dlt_compliant": True,
                }
        except Exception as exc:
            logger.error(f"[MSG91] Error sending SMS to {phone}: {exc}")
            return {
                "message_id": f"err-{uuid.uuid4().hex[:8]}",
                "status": "failed",
                "error": str(exc),
                "provider": "MSG91",
                "recipient": cleaned_phone,
            }


class TwilioSMSProvider(SMSProviderBase):
    """Twilio SMS provider for international coverage / fallback."""

    def __init__(self, account_sid: Optional[str] = None, auth_token: Optional[str] = None, from_number: Optional[str] = None, mock_mode: Optional[bool] = None):
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID", "mock_twilio_sid")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN", "mock_twilio_token")
        self.from_number = from_number or os.getenv("TWILIO_FROM_NUMBER", "+15005550006")
        self.mock_mode = mock_mode if mock_mode is not None else (self.account_sid == "mock_twilio_sid" or "TESTING" in os.environ)

    def send(self, phone: str, template_id: str, params: Dict[str, str]) -> Dict[str, Any]:
        formatted_phone = phone if phone.startswith("+") else f"+{phone}"
        body_text = f"ALERT: {params.get('cyclone_name', 'Cyclone')} | Wind: {params.get('wind_speed', 'High')} | Action: {params.get('action', 'Evacuate to nearest shelter')}"

        if self.mock_mode:
            logger.info(f"[Twilio Mock] Sent SMS to {formatted_phone}: {body_text}")
            return {
                "message_id": f"SM{uuid.uuid4().hex[:32]}",
                "status": "sent",
                "provider": "Twilio",
                "recipient": formatted_phone,
                "body_preview": body_text[:60],
            }

        endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(
                    endpoint,
                    auth=(self.account_sid, self.auth_token),
                    data={"To": formatted_phone, "From": self.from_number, "Body": body_text},
                )
                res.raise_for_status()
                data = res.json()
                return {
                    "message_id": data.get("sid", f"SM{uuid.uuid4().hex[:12]}"),
                    "status": "sent" if data.get("status") in ("queued", "sent", "delivered") else "failed",
                    "provider": "Twilio",
                    "recipient": formatted_phone,
                }
        except Exception as exc:
            logger.error(f"[Twilio] Error sending SMS to {phone}: {exc}")
            return {
                "message_id": f"err-{uuid.uuid4().hex[:8]}",
                "status": "failed",
                "error": str(exc),
                "provider": "Twilio",
                "recipient": formatted_phone,
            }


class CompositeSMSProvider(SMSProviderBase):
    """Tries MSG91 first; falls back to Twilio on failure."""

    def __init__(self, primary: Optional[SMSProviderBase] = None, fallback: Optional[SMSProviderBase] = None):
        self.primary = primary or MSG91SMSProvider()
        self.fallback = fallback or TwilioSMSProvider()

    def send(self, phone: str, template_id: str, params: Dict[str, str]) -> Dict[str, Any]:
        result = self.primary.send(phone, template_id, params)
        if result.get("status") == "sent":
            return result
        logger.warning(f"Primary SMS failed, attempting Twilio fallback for {phone}")
        fallback_res = self.fallback.send(phone, template_id, params)
        fallback_res["fallback_triggered"] = True
        return fallback_res
