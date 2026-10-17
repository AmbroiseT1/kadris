from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.config import settings
from app.services import document_service
from conftest import API

URL = f"{API}/documents/analyze"


@pytest.fixture
def mock_gemini(monkeypatch):
    response = MagicMock()
    response.text = '{"detected_type": "INVOICE", "montant_ttc": 1250.5, "artisan_nom": "ACME"}'
    generate = AsyncMock(return_value=response)
    fake_client = MagicMock()
    fake_client.aio.models.generate_content = generate
    monkeypatch.setattr(document_service, "_client", fake_client)
    return generate


def test_analyze_requires_auth(client):
    r = client.post(URL, files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")})
    assert r.status_code == 401


def test_analyze_unsupported_type_is_415(client, user_token, mock_gemini):
    r = client.post(URL, headers=user_token, files={"file": ("a.txt", b"hello", "text/plain")})
    assert r.status_code == 415
    mock_gemini.assert_not_called()


def test_analyze_too_large_is_413(client, user_token, mock_gemini, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)
    big = b"0" * (1024 * 1024 + 1)
    r = client.post(URL, headers=user_token, files={"file": ("a.pdf", big, "application/pdf")})
    assert r.status_code == 413
    mock_gemini.assert_not_called()


def test_analyze_ok(client, user_token, mock_gemini):
    r = client.post(URL, headers=user_token, files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["detected_type"] == "INVOICE"
    assert body["montant_ttc"] == 1250.5
    mock_gemini.assert_awaited_once()


def test_analyze_gemini_error_does_not_leak(client, user_token, mock_gemini):
    mock_gemini.side_effect = RuntimeError("secret upstream detail key=abc123")
    r = client.post(URL, headers=user_token, files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")})
    assert r.status_code == 200
    assert "abc123" not in r.text
    assert r.json()["detected_type"] == "UNKNOWN"


def test_analyze_without_api_key_is_503(client, user_token, monkeypatch):
    monkeypatch.setattr(document_service, "_client", None)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)
    r = client.post(URL, headers=user_token, files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")})
    assert r.status_code == 503
