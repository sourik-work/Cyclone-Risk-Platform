"""Tests for security hardening, rate limiting, security headers, CORS, and HMAC signatures."""

import time
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.middleware.rate_limit import (
    generate_hmac_signature,
    verify_hmac_signature,
    RATE_LIMIT_LLM,
    RATE_LIMIT_PUBLIC_READ,
    RATE_LIMIT_AUTH,
    RATE_LIMIT_WRITE,
)

client = TestClient(app)


def test_security_headers_present():
    """Verify that all enterprise security headers are present on API responses."""
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert "max-age=31536000" in response.headers.get("strict-transport-security", "")
    assert "default-src 'self'" in response.headers.get("content-security-policy", "")
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


def test_cors_headers_with_allowed_origin():
    """Verify CORS preflight / response headers for allowed origin."""
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://cyclone-risk-platform.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://cyclone-risk-platform.vercel.app"


def test_cors_headers_with_disallowed_origin():
    """Verify that untrusted origins do not receive CORS allow header."""
    response = client.get(
        "/health/live",
        headers={"Origin": "https://malicious-cyclone-spoof.evil.com"},
    )
    assert response.headers.get("access-control-allow-origin") != "https://malicious-cyclone-spoof.evil.com"


def test_hmac_signature_valid():
    """Verify HMAC-SHA256 signature generation and validation for service-to-service calls."""
    payload = '{"event": "cyclone_alert", "severity": "EXTREME", "cyclone_id": "BOB-01"}'
    secret = "test-secret-key-12345"
    
    signature_header = generate_hmac_signature(payload, secret=secret)
    assert signature_header.startswith("t=")
    assert ",v1=" in signature_header
    
    assert verify_hmac_signature(signature_header, payload, secret=secret) is True


def test_hmac_signature_tampered_payload_fails():
    """Verify that tampered payloads fail HMAC verification."""
    payload = '{"amount": 100}'
    tampered_payload = '{"amount": 1000000}'
    secret = "test-secret-key-12345"
    
    signature_header = generate_hmac_signature(payload, secret=secret)
    assert verify_hmac_signature(signature_header, tampered_payload, secret=secret) is False


def test_hmac_signature_expired_fails():
    """Verify replay protection when signature timestamp exceeds 300 seconds."""
    payload = '{"ping": "pong"}'
    secret = "test-secret-key-12345"
    old_timestamp = int(time.time()) - 400
    
    signature_header = generate_hmac_signature(payload, secret=secret, timestamp=old_timestamp)
    assert verify_hmac_signature(signature_header, payload, secret=secret, tolerance_seconds=300) is False


def test_rate_limit_tiers_configured():
    """Verify rate limit tier constants are correctly configured."""
    assert RATE_LIMIT_LLM == "10/minute"
    assert RATE_LIMIT_PUBLIC_READ == "60/minute"
    assert RATE_LIMIT_AUTH == "5/minute"
    assert RATE_LIMIT_WRITE == "30/minute"
