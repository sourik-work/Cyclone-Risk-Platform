"""Rate limiting policies, HMAC request signing, and security headers middleware."""

import hashlib
import hmac
import os
import time
from typing import Callable, Optional
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Rate Limit Tier Definitions
RATE_LIMIT_LLM = os.getenv("RATE_LIMIT_LLM", "10/minute")
RATE_LIMIT_PUBLIC_READ = os.getenv("RATE_LIMIT_PUBLIC_READ", "60/minute")
RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "5/minute")
RATE_LIMIT_WRITE = os.getenv("RATE_LIMIT_WRITE", "30/minute")

# Central SlowAPI limiter instance
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT_PUBLIC_READ])

# Secret for HMAC service-to-service authentication
HMAC_SECRET = os.getenv("INTERNAL_SERVICE_SECRET", "prod-fallback-cyclone-platform-secret-key-2026")


def generate_hmac_signature(payload: str, secret: str = HMAC_SECRET, timestamp: Optional[int] = None) -> str:
    """Generates an HMAC-SHA256 signature for internal service-to-service authentication."""
    if timestamp is None:
        timestamp = int(time.time())
    message = f"{timestamp}:{payload}".encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


def verify_hmac_signature(header_val: str, payload: str, secret: str = HMAC_SECRET, tolerance_seconds: int = 300) -> bool:
    """Verifies HMAC signature header against raw payload with timestamp replay protection."""
    if not header_val:
        return False
    try:
        parts = dict(item.split("=", 1) for item in header_val.split(","))
        timestamp = int(parts.get("t", 0))
        provided_sig = parts.get("v1", "")
        
        # Replay window check
        now = int(time.time())
        if abs(now - timestamp) > tolerance_seconds:
            return False
            
        message = f"{timestamp}:{payload}".encode("utf-8")
        expected_sig = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(provided_sig, expected_sig)
    except Exception:
        return False


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds enterprise security headers to every HTTP response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https: https://*.tile.openstreetmap.org https://earthengine.googleapis.com; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' https: wss:; "
            "font-src 'self' data: https://fonts.gstatic.com;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
        return response
