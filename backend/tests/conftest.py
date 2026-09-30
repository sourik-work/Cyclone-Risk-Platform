import os
import pytest

os.environ["TESTING"] = "true"

from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Test client with demo auth bypass."""
    from backend.core.auth import require_auth, require_dispatcher

    async def fake_auth():
        return {"uid": "test-user", "email": "test@test.local", "is_dispatcher": True}

    app.dependency_overrides[require_auth] = fake_auth
    app.dependency_overrides[require_dispatcher] = fake_auth

    yield TestClient(app)

    app.dependency_overrides.clear()
