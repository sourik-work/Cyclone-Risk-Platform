"""Unit tests for Dialogflow intent detection and webhook endpoints."""

from unittest.mock import patch
from backend.services.dialogflow_service import detect_intent, _heuristic_intent_fallback
from backend.schemas.cyclone import ChatMessage, ChatResponse, LiveCycloneResponse, CycloneTrack, TrackPoint, TrackCategory


def test_heuristic_intent_fallback():
    res1 = _heuristic_intent_fallback("What is the cyclone status?")
    assert res1["intent"] == "check_cyclone_status"
    assert res1["confidence"] >= 0.8

    res2 = _heuristic_intent_fallback("Give me the evacuation advisory")
    assert res2["intent"] == "get_advisory"
    assert res2["confidence"] >= 0.8

    res3 = _heuristic_intent_fallback("tell me a random joke")
    assert res3["intent"] == "unknown"


def test_detect_intent_empty():
    assert detect_intent("") == {"intent": "unknown", "confidence": 0.0}
    assert detect_intent("   ") == {"intent": "unknown", "confidence": 0.0}


def test_detect_intent_mocked():
    with patch("backend.services.dialogflow_service._heuristic_intent_fallback") as mock_fb:
        mock_fb.return_value = {"intent": "check_cyclone_status", "confidence": 0.95}
        with patch("backend.services.dialogflow_service.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = ""
            res = detect_intent("current storm status", session_id="test")
            assert res["intent"] == "check_cyclone_status"


def test_chat_message_endpoint():
    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)

    # 1. Cyclone status query
    resp1 = client.post(
        "/api/chat/message",
        json={"message": "What is the cyclone status?", "session_id": "sess-1"},
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert "reply" in data1
    assert data1["intent"] == "check_cyclone_status"
    assert data1["session_id"] == "sess-1"

    # 2. Advisory query
    resp2 = client.post(
        "/api/chat/message",
        json={"message": "Give me the advisory", "session_id": "sess-2"},
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert "reply" in data2
    assert data2["intent"] == "get_advisory"


def test_dialogflow_webhook_direct():
    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)

    df_req = {
        "responseId": "r-123",
        "queryResult": {
            "queryText": "status",
            "intent": {"displayName": "check_cyclone_status"},
        },
        "session": "test-session",
    }
    resp = client.post("/api/dialogflow/webhook", json=df_req)
    assert resp.status_code == 200
    data = resp.json()
    assert "fulfillmentText" in data
    assert data["intent"] == "check_cyclone_status"
