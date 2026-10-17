"""Fixtures partagées. Les variables d'environnement sont posées AVANT d'importer l'app
(Settings est lu à l'import) et la base est un fichier SQLite temporaire."""
import os
import tempfile
import uuid

_TMP_DIR = tempfile.mkdtemp(prefix="bricq-tests-")

os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.db"
os.environ["SECRET_KEY"] = "test-secret-key-" + "x" * 32
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["GEMINI_API_KEY"] = "test-gemini-key"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "admin-password-123"
os.environ.pop("GOOGLE_API_KEY", None)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import security  # noqa: E402
from app.main import app  # noqa: E402

API = "/api/v1"
USER_PASSWORD = "correct-horse-battery"


@pytest.fixture(scope="session")
def client():
    # Le `with` déclenche le lifespan (création du compte admin)
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _reset_rate_limiters():
    limiters = (
        security.login_rate_limiter,
        security.ip_rate_limiter,
        security.register_rate_limiter,
        security.proxy_rate_limiter,
    )
    for lim in limiters:
        lim.clear()
    yield
    for lim in limiters:
        lim.clear()


def register_user(client, email=None, password=USER_PASSWORD):
    email = email or f"user-{uuid.uuid4().hex[:10]}@example.com"
    r = client.post(f"{API}/auth/register", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return email


def login(client, email, password):
    return client.post(f"{API}/auth/login", data={"username": email, "password": password})


@pytest.fixture
def user_credentials(client):
    email = register_user(client)
    return email, USER_PASSWORD


@pytest.fixture
def user_token(client, user_credentials):
    """Enregistre + connecte un utilisateur normal ; renvoie les headers d'auth."""
    email, password = user_credentials
    r = login(client, email, password)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def admin_headers(client):
    r = login(client, os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"])
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
