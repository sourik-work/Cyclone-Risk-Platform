"""
Bootstrap module that decodes base64-encoded credentials BEFORE any other imports.
This module must be imported FIRST in main.py, before any service imports.
"""
import base64
import os
from pathlib import Path


def bootstrap_credentials() -> None:
    """Decode GOOGLE_APPLICATION_CREDENTIALS if it's base64 content, not a file path."""
    creds_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_env:
        return
    
    # If it's short enough to be a path and the file exists, assume it's a path
    if len(creds_env) < 500:
        try:
            if Path(creds_env).exists():
                return  # It's a real file path
        except (OSError, ValueError):
            pass  # Path too long or invalid characters — treat as base64
    
    # Treat as base64-encoded JSON
    try:
        decoded = base64.b64decode(creds_env)
        
        # Write to /tmp on Linux (Render), or home dir on Windows
        if os.name == "nt":
            target = Path.home() / ".cyclone-service-account.json"
        else:
            target = Path("/tmp/service-account.json")
        
        target.write_bytes(decoded)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(target)
        print(f"[bootstrap] Decoded credentials to: {target}")
    except Exception as e:
        print(f"[bootstrap] Warning: Could not decode GOOGLE_APPLICATION_CREDENTIALS: {e}")


# Run immediately on import
bootstrap_credentials()
