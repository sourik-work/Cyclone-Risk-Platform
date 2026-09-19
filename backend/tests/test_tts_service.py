"""Unit tests for Gemini Flash TTS service (REST API) and API endpoint."""

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.tts_service import (
    FALLBACK_TTS_MODEL,
    PRIMARY_TTS_MODEL,
    synthesize,
)

client = TestClient(app)


def _create_mock_rest_response(
    status_code: int = 200,
    audio_b64: str = "SAMPLE_BASE64_AUDIO_STREAM",
    error_text: str = "",
):
    """Helper to build a mock requests.Response object for Gemini REST API."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.ok = (200 <= status_code < 300)
    mock_resp.text = error_text

    if mock_resp.ok:
        mock_resp.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": "audio/mp3",
                                    "data": audio_b64,
                                }
                            }
                        ]
                    }
                }
            ]
        }
    else:
        mock_resp.json.return_value = {"error": {"code": status_code, "message": error_text}}

    return mock_resp


@patch("backend.services.tts_service.requests.post")
@patch.dict("os.environ", {"GEMINI_API_KEY": "test_dummy_key"})
def test_synthesize_success_mocked(mock_post):
    """Verifies successful audio synthesis returning valid base64 and metadata via requests.post."""
    mock_audio_b64 = "bW9ja19hdWRpb19kYXRhXzEyMzQ1Njc4OQ=="
    mock_post.return_value = _create_mock_rest_response(status_code=200, audio_b64=mock_audio_b64)

    text = "Extremely severe cyclonic storm approaching coastal Odisha."
    result = synthesize(text=text, language="hi")

    assert result["error"] is None
    assert result["voice_used"] == "Kore"
    assert result["language"] == "hi"
    assert result["duration_seconds"] == round(len(text.split()) / 2.5, 2)
    assert result["audio_base64"] == mock_audio_b64

    # Verify primary model was called with x-goog-api-key header
    mock_post.assert_called_once()
    call_url = mock_post.call_args[0][0]
    call_kwargs = mock_post.call_args[1]
    assert PRIMARY_TTS_MODEL in call_url
    assert call_kwargs["headers"]["x-goog-api-key"] == "test_dummy_key"
    assert call_kwargs["json"]["contents"][0]["parts"][0]["text"] == text


@patch("backend.services.tts_service.requests.post")
@patch.dict("os.environ", {"GEMINI_API_KEY": "test_dummy_key"})
def test_synthesize_fallback_model_on_not_found(mock_post):
    """TASK 6: Verifies automatic fallback to gemini-3.1-flash-tts-preview on model not found (404) error."""
    mock_fallback_b64 = "ZmFsbGJhY2tfYXVkaW9fOTg3NjU0MzIx"

    # First call with primary model returns 404, second call returns 200 with fallback audio
    mock_post.side_effect = [
        _create_mock_rest_response(status_code=404, error_text=f"Model {PRIMARY_TTS_MODEL} not found"),
        _create_mock_rest_response(status_code=200, audio_b64=mock_fallback_b64),
    ]

    result = synthesize(text="Evacuation advisory for Kendrapara", language="bn")

    assert result["error"] is None
    assert result["voice_used"] == "Kore"
    assert result["audio_base64"] == mock_fallback_b64
    assert mock_post.call_count == 2

    # Verify first call was primary model, second call was fallback model
    first_url = mock_post.call_args_list[0][0][0]
    second_url = mock_post.call_args_list[1][0][0]
    assert PRIMARY_TTS_MODEL in first_url
    assert FALLBACK_TTS_MODEL in second_url


@patch("backend.services.tts_service.requests.post")
@patch.dict("os.environ", {"GEMINI_API_KEY": "test_dummy_key"})
def test_synthesize_error_handling_never_raises(mock_post):
    """Verifies that network/server exceptions are caught and return a structured error dict without raising."""
    import requests
    mock_post.side_effect = requests.exceptions.ConnectionError("Connection aborted by peer")

    result = synthesize(text="Testing failure resilience", language="ta")

    assert isinstance(result, dict)
    assert result["audio_base64"] is None
    assert result["duration_seconds"] == 0.0
    assert result["voice_used"] is None
    assert result["language"] == "ta"
    assert "Connection aborted by peer" in result["error"]


@patch.dict("os.environ", {}, clear=True)
def test_synthesize_empty_or_missing_api_key():
    """Verifies clean error dict when GEMINI_API_KEY is not set."""
    with patch("backend.core.config.get_settings") as mock_get_settings:
        mock_get_settings.return_value.gemini_api_key = ""
        result = synthesize(text="Advisory text", language="en")
        assert result["audio_base64"] is None
        assert result["error"] == "GEMINI_API_KEY is not configured"


def test_synthesize_empty_text():
    """Verifies clean error dict when text is empty."""
    result = synthesize(text="   ", language="te")
    assert result["audio_base64"] is None
    assert result["error"] == "Empty text provided for synthesis"


@patch("backend.api.routes.synthesize")
def test_api_advisories_synthesize_endpoint_success(mock_synth):
    """Verifies POST /api/advisories/synthesize returns HTTP 200 and schema payload."""
    mock_synth.return_value = {
        "audio_base64": "bW9ja19hdWRpb19kYXRh",
        "duration_seconds": 3.2,
        "voice_used": "Kore",
        "language": "en",
        "error": None,
    }

    response = client.post(
        "/api/advisories/synthesize",
        json={"text": "Cyclone advisory for coastal areas.", "language": "en"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["audio_base64"] == "bW9ja19hdWRpb19kYXRh"
    assert data["duration_seconds"] == 3.2
    assert data["voice_used"] == "Kore"
    assert data["error"] is None


@patch("backend.api.routes.synthesize")
def test_api_advisories_synthesize_endpoint_error_returns_200(mock_synth):
    """Verifies POST /api/advisories/synthesize returns HTTP 200 even when error occurs."""
    mock_synth.return_value = {
        "audio_base64": None,
        "duration_seconds": 0.0,
        "voice_used": None,
        "language": "hi",
        "error": "Upstream Gemini TTS service timeout",
    }

    response = client.post(
        "/api/advisories/synthesize",
        json={"text": "Cyclone advisory", "language": "hi"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["audio_base64"] is None
    assert data["error"] == "Upstream Gemini TTS service timeout"
