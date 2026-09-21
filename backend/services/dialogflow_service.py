"""Dialogflow intent detection service powered by Gemini 3.7 Flash.

Classifies incoming user messages into:
- 'check_cyclone_status'
- 'get_advisory'
- 'unknown'
Includes resilient domain fallback for offline or demo environments.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import requests

from backend.core.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a cyclone risk assistant. Classify the user's message into exactly ONE of these intents:\n"
    "- check_cyclone_status\n"
    "- get_advisory\n"
    "- unknown\n\n"
    'Respond with strict JSON only: {"intent": "...", "confidence": 0.0-1.0}'
)


def _heuristic_intent_fallback(text: str) -> Dict[str, Any]:
    """Resilient heuristic classification when Gemini API is unavailable."""
    lower = text.lower().strip()

    # Status / tracking keywords
    status_keywords = [
        "status", "live", "storm", "cyclone", "wind", "speed",
        "pressure", "track", "tracking", "position", "current",
        "intensity", "category", "where is", "update"
    ]
    # Advisory / action keywords
    advisory_keywords = [
        "advisory", "warning", "alert", "evacuate", "evacuation",
        "shelter", "action", "guideline", "instructions", "prepare",
        "preparation", "what should", "danger", "bulletin", "help"
    ]

    for kw in status_keywords:
        if kw in lower:
            return {"intent": "check_cyclone_status", "confidence": 0.90}

    for kw in advisory_keywords:
        if kw in lower:
            return {"intent": "get_advisory", "confidence": 0.90}

    return {"intent": "unknown", "confidence": 0.50}


def detect_intent(text: str, session_id: str = "default") -> Dict[str, Any]:
    """Detects intent from user text using Gemini 3.7 Flash with fallback."""
    if not text or not text.strip():
        return {"intent": "unknown", "confidence": 0.0}

    settings = get_settings()
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY", "")
    model_name = settings.gemini_model or "gemini-3.7-flash"

    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Using domain heuristic intent detection.")
        return _heuristic_intent_fallback(text)

    prompt = f'User: "{text}"\nRespond with JSON: {{"intent": "...", "confidence": 0.0-1.0}}'

    try:
        # 1. Try google-genai SDK
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            raw_text = response.text if response else ""
        except ImportError:
            # 2. Fallback to REST API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1,
                },
            }
            resp = requests.post(url, json=payload, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

        # Parse JSON
        parsed = json.loads(raw_text)
        intent = parsed.get("intent", "unknown")
        confidence = float(parsed.get("confidence", 0.85))

        if intent not in ("check_cyclone_status", "get_advisory", "unknown"):
            intent = "unknown"

        return {"intent": intent, "confidence": confidence}

    except Exception as err:
        logger.warning(f"Gemini intent classification fallback engaged: {err}")
        return _heuristic_intent_fallback(text)
