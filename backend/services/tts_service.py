"""Gemini Flash TTS advisory synthesis service using direct REST API calls via requests.

Provides pre-landfall spoken audio generation via native Gemini TTS models:
- Primary: gemini-2.5-flash-preview-tts
- Fallback: gemini-3.1-flash-tts-preview (on model not found / 404)
- Voice: Kore (auto-detects language from text)
- Passes GEMINI_API_KEY via x-goog-api-key header (supporting AQ. key format)
- Exponential backoff retry on transient failures
- Resilient exception handling (never raises, returns structured error)
"""

import logging
import os
from typing import Any, Dict, Optional

import requests

from backend.core.retry import with_exponential_backoff

logger = logging.getLogger(__name__)

PRIMARY_TTS_MODEL = "gemini-2.5-flash-preview-tts"
FALLBACK_TTS_MODEL = "gemini-3.1-flash-tts-preview"
BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

VOICE_MAPPING: Dict[str, str] = {
    "en": "Kore",
    "hi": "Kore",
    "bn": "Kore",
    "ta": "Kore",
    "te": "Kore",
    "or": "Kore",
    "english": "Kore",
    "hindi": "Kore",
    "bengali": "Kore",
    "tamil": "Kore",
    "telugu": "Kore",
    "odia": "Kore",
}


class ModelNotFoundError(Exception):
    """Raised when a Gemini TTS model returns HTTP 404 (not found)."""
    pass


class TransientTTSError(Exception):
    """Transient network or rate-limit error that should be retried."""
    pass


@with_exponential_backoff(
    max_attempts=3,
    initial_delay_seconds=1.0,
    max_delay_seconds=5.0,
    retryable_exceptions=(TransientTTSError,),
)
def _call_gemini_tts_rest(model: str, text: str, voice_name: str, api_key: str) -> dict:
    """Invokes Gemini TTS REST API endpoint directly with exponential backoff for transient errors."""
    url = f"{BASE_API_URL}/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
        "x-goog-user-project": "cyclone-risk-platform",
    }

    payload = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name,
                    }
                }
            },
        },
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as exc:
        raise TransientTTSError(str(exc)) from exc
    except Exception as exc:
        raise exc

    if resp.status_code == 404:
        raise ModelNotFoundError(f"Model {model} returned 404 Not Found: {resp.text[:200]}")

    if resp.status_code in (429, 500, 502, 503, 504):
        raise TransientTTSError(f"HTTP {resp.status_code}: {resp.text[:200]}")

    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")

    return resp.json()


def synthesize(text: str, language: str = "en") -> dict:
    """Synthesizes text into base64-encoded audio using Gemini Flash TTS REST API.

    Args:
        text: Multilingual advisory text to synthesize.
        language: Language code ('en', 'hi', 'bn', 'ta', 'te', 'or', etc.).

    Returns:
        dict: {
            "audio_base64": str | None,
            "duration_seconds": float,
            "voice_used": str | None,
            "language": str,
            "error": str | None
        }
    """
    voice_used = VOICE_MAPPING.get(language.lower(), "Kore")

    if not text or not text.strip():
        return {
            "audio_base64": None,
            "duration_seconds": 0.0,
            "voice_used": voice_used,
            "language": language,
            "error": "Empty text provided for synthesis",
        }

    word_count = len(text.split())
    estimated_duration = round(word_count / 2.5, 2)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        try:
            from backend.core.config import get_settings
            api_key = get_settings().gemini_api_key
        except Exception:
            api_key = ""

    if not api_key:
        logger.warning("GEMINI_API_KEY environment variable is not set.")
        return {
            "audio_base64": None,
            "duration_seconds": 0.0,
            "voice_used": None,
            "language": language,
            "error": "GEMINI_API_KEY is not configured",
        }

    try:
        model_used = PRIMARY_TTS_MODEL
        try:
            response_data = _call_gemini_tts_rest(model_used, text, voice_used, api_key)
        except ModelNotFoundError as not_found_err:
            logger.warning(
                f"Model '{PRIMARY_TTS_MODEL}' returned 404 ({not_found_err}). "
                f"Falling back to '{FALLBACK_TTS_MODEL}'."
            )
            model_used = FALLBACK_TTS_MODEL
            response_data = _call_gemini_tts_rest(model_used, text, voice_used, api_key)

        # Parse response:
        # audio_b64 = response_data["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
        candidates = response_data.get("candidates", [])
        if not candidates:
            raise ValueError(f"No candidates returned in Gemini TTS response: {response_data}")

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise ValueError(f"No parts returned in Gemini TTS candidate content: {response_data}")

        inline_data = parts[0].get("inlineData", {})
        audio_b64 = inline_data.get("data")

        if not audio_b64:
            raise ValueError("No audio inlineData.data found in Gemini TTS response")

        logger.info(
            "Gemini TTS REST synthesis succeeded",
            extra={
                "model_used": model_used,
                "language": language,
                "voice_used": voice_used,
                "duration_seconds": estimated_duration,
                "audio_base64_len": len(audio_b64),
            },
        )

        return {
            "audio_base64": audio_b64,
            "duration_seconds": estimated_duration,
            "voice_used": voice_used,
            "language": language,
            "error": None,
        }

    except Exception as exc:
        logger.error(
            f"Gemini TTS synthesis failed for language='{language}': {exc}",
            extra={"language": language, "text_snippet": text[:60], "error": str(exc)},
        )
        return {
            "audio_base64": None,
            "duration_seconds": 0.0,
            "voice_used": None,
            "language": language,
            "error": str(exc),
        }
