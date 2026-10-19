import json
import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.config import settings
from app.services import document_service
from conftest import API, USER_PASSWORD, login, register_user

PDF = b"%PDF-1.4 fake pdf"
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32


def _headers(client):
    email = register_user(client)
    r = login(client, email, USER_PASSWORD)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def create_property(client, headers, proof=("titre.pdf", PDF, "application/pdf"), **fields):
    payload = {
        "address_label": "12 Rue des Lilas 75019 Paris",
        "cle_interop": "75119_5678_00012",
        "lat": 48.88,
        "lon": 2.38,
        "code_insee": "75119",
        "building_data": {"annee_construction": "1920", "surface_sol": 145},
        **fields,
    }
    files = {"proof": proof} if proof else None
    return client.post(f"{API}/properties", headers=headers, data={"payload": json.dumps(payload)}, files=files)


@pytest.fixture
def prop(client, user_token):
    r = create_property(client, user_token)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def other_headers(client):
    return _headers(client)


def upload_doc(client, headers, prop_id, content=PDF, mime="application/pdf", name="facture.pdf", **form):
    data = {"title": "Facture chaudière", "doc_type": "FACTURE", "date": "2024-03-01", **form}
    return client.post(
        f"{API}/properties/{prop_id}/documents", headers=headers, data=data,
        files={"file": (name, content, mime)},
    )


# --- Biens -------------------------------------------------------------------

def test_requires_auth(client):
    assert client.get(f"{API}/properties").status_code == 401


def test_create_property_with_proof_is_pending(client, user_token, prop):
    assert prop["ownership_status"] == "pending"
    assert prop["has_ownership_proof"] is True
    assert prop["building_data"]["surface_sol"] == 145

    r = client.get(f"{API}/properties", headers=user_token)
    assert [p["id"] for p in r.json()] == [prop["id"]]

    docs = client.get(f"{API}/properties/{prop['id']}/documents", headers=user_token).json()
    assert len(docs) == 1
    assert docs[0]["doc_type"] == "preuve_propriete"
    assert docs[0]["original_filename"] == "titre.pdf"
    assert "stored_path" not in docs[0]


def test_create_property_requires_proof_for_non_admin(client, user_token):
    r = create_property(client, user_token, proof=None)
    assert r.status_code == 422
    assert client.get(f"{API}/properties", headers=user_token).json() == []


def test_admin_can_create_without_proof(client, admin_headers):
    r = create_property(client, admin_headers, proof=None)
    assert r.status_code == 201, r.text
    assert r.json()["ownership_status"] == "verified"
    client.delete(f"{API}/properties/{r.json()['id']}", headers=admin_headers)


def test_create_property_validates_payload(client, user_token):
    assert create_property(client, user_token, address_label="").status_code == 422
    assert create_property(client, user_token, lat=200).status_code == 422
    r = client.post(f"{API}/properties", headers=user_token, data={"payload": "not json"},
                    files={"proof": ("t.pdf", PDF, "application/pdf")})
    assert r.status_code == 422


def test_proof_type_and_size_limits(client, user_token, monkeypatch):
    assert create_property(client, user_token, proof=("t.txt", b"hello", "text/plain")).status_code == 415
    # Content-Type déclaré PDF mais contenu qui n'en est pas un
    assert create_property(client, user_token, proof=("t.pdf", b"MZ\x90\x00", "application/pdf")).status_code == 415
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)
    big = b"%PDF" + b"0" * (1024 * 1024)
    assert create_property(client, user_token, proof=("t.pdf", big, "application/pdf")).status_code == 413
    assert client.get(f"{API}/properties", headers=user_token).json() == []


def test_update_property_cannot_change_status(client, user_token, prop):
    r = client.patch(f"{API}/properties/{prop['id']}", headers=user_token,
                     json={"address_label": "Nouvelle adresse", "ownership_status": "verified"})
    assert r.status_code == 200
    assert r.json()["address_label"] == "Nouvelle adresse"
    assert r.json()["ownership_status"] == "pending"


def test_delete_property_removes_files(client, user_token, prop):
    files_before = set(os.listdir(settings.UPLOAD_DIR))
    assert files_before
    r = client.delete(f"{API}/properties/{prop['id']}", headers=user_token)
    assert r.status_code == 204
    assert client.get(f"{API}/properties/{prop['id']}", headers=user_token).status_code == 404
    assert len(os.listdir(settings.UPLOAD_DIR)) == len(files_before) - 1


# --- Ressources rattachées ---------------------------------------------------

RESOURCES = [
    ("works", {"title": "Isolation combles", "category": "TRAVAUX", "date": "2020-05-01",
               "cost": 4500, "provider": "Iso SAS", "description": "Laine 300mm", "status": "done"},
     {"cost": 4700, "status": "in_progress"}),
    ("expenses", {"label": "Taxe foncière", "category": "OPEX", "amount": 2450, "frequency": "annuel"},
     {"amount": 2500}),
    ("tasks", {"title": "Remplacer joint douche", "category": "PLOMBERIE", "priority": "URGENTE",
               "due_date": "2025-01-15"},
     {"done": True}),
]


@pytest.mark.parametrize("path,body,patch", RESOURCES)
def test_child_crud(client, user_token, prop, path, body, patch):
    base = f"{API}/properties/{prop['id']}/{path}"
    r = client.post(base, headers=user_token, json=body)
    assert r.status_code == 201, r.text
    item = r.json()
    for k, v in body.items():
        assert item[k] == v

    assert [i["id"] for i in client.get(base, headers=user_token).json()] == [item["id"]]

    r = client.patch(f"{base}/{item['id']}", headers=user_token, json=patch)
    assert r.status_code == 200, r.text
    for k, v in patch.items():
        assert r.json()[k] == v

    assert client.delete(f"{base}/{item['id']}", headers=user_token).status_code == 204
    assert client.get(base, headers=user_token).json() == []
    assert client.patch(f"{base}/{item['id']}", headers=user_token, json=patch).status_code == 404


@pytest.mark.parametrize("path,body,patch", RESOURCES)
def test_child_isolation(client, user_token, other_headers, prop, path, body, patch):
    base = f"{API}/properties/{prop['id']}/{path}"
    item = client.post(base, headers=user_token, json=body).json()

    assert client.get(base, headers=other_headers).status_code == 404
    assert client.post(base, headers=other_headers, json=body).status_code == 404
    assert client.patch(f"{base}/{item['id']}", headers=other_headers, json=patch).status_code == 404
    assert client.delete(f"{base}/{item['id']}", headers=other_headers).status_code == 404
    # Un élément d'un bien ne peut pas être modifié via l'URL d'un autre bien
    other_prop = create_property(client, other_headers).json()
    assert client.patch(f"{API}/properties/{other_prop['id']}/{path}/{item['id']}",
                        headers=other_headers, json=patch).status_code == 404
    assert len(client.get(base, headers=user_token).json()) == 1


def test_child_validation(client, user_token, prop):
    base = f"{API}/properties/{prop['id']}"
    assert client.post(f"{base}/works", headers=user_token, json={"title": ""}).status_code == 422
    assert client.post(f"{base}/expenses", headers=user_token, json={"label": "x", "amount": -1}).status_code == 422
    assert client.post(f"{base}/tasks", headers=user_token, json={"title": "x", "priority": "WHATEVER"}).status_code == 422


def test_property_isolation(client, user_token, other_headers, prop):
    pid = prop["id"]
    assert client.get(f"{API}/properties", headers=other_headers).json() == []
    assert client.get(f"{API}/properties/{pid}", headers=other_headers).status_code == 404
    assert client.patch(f"{API}/properties/{pid}", headers=other_headers,
                        json={"address_label": "pwned"}).status_code == 404
    assert client.delete(f"{API}/properties/{pid}", headers=other_headers).status_code == 404
    assert client.get(f"{API}/properties/{pid}", headers=user_token).json()["address_label"] != "pwned"


# --- Documents ---------------------------------------------------------------

def test_document_upload_download_delete(client, user_token, prop):
    r = upload_doc(client, user_token, prop["id"], content=PNG, mime="image/png", name="../../etc/photo.png",
                   description="Facture 2024")
    assert r.status_code == 201, r.text
    doc = r.json()
    assert doc["original_filename"] == "photo.png"
    assert doc["size"] == len(PNG)
    assert doc["date"] == "2024-03-01"
    assert doc["ai_analysis"] is None

    # Stocké sous UPLOAD_DIR avec un nom aléatoire
    stored = [f for f in os.listdir(settings.UPLOAD_DIR) if f.endswith(".png")]
    assert stored and all("photo" not in f for f in stored)

    url = f"{API}/properties/{prop['id']}/documents/{doc['id']}/download"
    assert client.get(url).status_code == 401
    r = client.get(url, headers=user_token)
    assert r.status_code == 200
    assert r.content == PNG
    assert r.headers["content-type"] == "image/png"
    assert "attachment" in r.headers["content-disposition"]

    r = client.patch(f"{API}/properties/{prop['id']}/documents/{doc['id']}", headers=user_token,
                     json={"title": "Renommé"})
    assert r.json()["title"] == "Renommé"

    assert client.delete(f"{API}/properties/{prop['id']}/documents/{doc['id']}", headers=user_token).status_code == 204
    assert client.get(url, headers=user_token).status_code == 404


def test_document_type_and_size_limits(client, user_token, prop, monkeypatch):
    assert upload_doc(client, user_token, prop["id"], content=b"hi", mime="text/plain", name="a.txt").status_code == 415
    assert upload_doc(client, user_token, prop["id"], content=b"<svg/>", mime="image/svg+xml").status_code == 415
    assert upload_doc(client, user_token, prop["id"], content=b"GIF89a", mime="image/png").status_code == 415
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)
    big = b"%PDF" + b"0" * (1024 * 1024)
    assert upload_doc(client, user_token, prop["id"], content=big).status_code == 413
    docs = client.get(f"{API}/properties/{prop['id']}/documents", headers=user_token).json()
    assert [d["doc_type"] for d in docs] == ["preuve_propriete"]


def test_document_isolation(client, user_token, other_headers, prop):
    doc = upload_doc(client, user_token, prop["id"]).json()
    base = f"{API}/properties/{prop['id']}/documents"
    assert client.get(base, headers=other_headers).status_code == 404
    assert client.get(f"{base}/{doc['id']}", headers=other_headers).status_code == 404
    assert client.get(f"{base}/{doc['id']}/download", headers=other_headers).status_code == 404
    assert client.delete(f"{base}/{doc['id']}", headers=other_headers).status_code == 404
    assert upload_doc(client, other_headers, prop["id"]).status_code == 404
    # Accès au document via un bien qui appartient à l'attaquant
    other_prop = create_property(client, other_headers).json()
    assert client.get(f"{API}/properties/{other_prop['id']}/documents/{doc['id']}/download",
                      headers=other_headers).status_code == 404


def test_document_with_client_analysis(client, user_token, prop):
    analysis = {"detected_type": "INVOICE", "montant_ttc": 120.5, "artisan_nom": "ACME"}
    r = upload_doc(client, user_token, prop["id"], ai_analysis=json.dumps(analysis))
    assert r.status_code == 201, r.text
    assert r.json()["ai_analysis"]["montant_ttc"] == 120.5
    bad = upload_doc(client, user_token, prop["id"], ai_analysis=json.dumps({"detected_type": "NOPE"}))
    assert bad.status_code == 422


@pytest.fixture
def mock_gemini(monkeypatch):
    response = MagicMock()
    response.text = '{"detected_type": "QUOTE", "montant_total": 990, "artisan_nom": "Toit SAS"}'
    generate = AsyncMock(return_value=response)
    fake_client = MagicMock()
    fake_client.aio.models.generate_content = generate
    monkeypatch.setattr(document_service, "_client", fake_client)
    return generate


def test_document_upload_with_server_analysis(client, user_token, prop, mock_gemini):
    r = upload_doc(client, user_token, prop["id"], analyze="true")
    assert r.status_code == 201, r.text
    assert r.json()["ai_analysis"]["detected_type"] == "QUOTE"
    mock_gemini.assert_awaited_once()
    # Sans consentement (analyze absent) : pas d'appel à Gemini
    upload_doc(client, user_token, prop["id"])
    mock_gemini.assert_awaited_once()


# --- Vérification de propriété (admin) ---------------------------------------

def test_admin_verification_flow(client, user_token, admin_headers, prop):
    assert client.get(f"{API}/admin/properties", headers=user_token).status_code == 403
    assert client.post(f"{API}/admin/properties/{prop['id']}/ownership", headers=user_token,
                       json={"status": "verified"}).status_code == 403

    pending = client.get(f"{API}/admin/properties", headers=admin_headers).json()
    entry = next(p for p in pending if p["id"] == prop["id"])
    assert entry["owner_email"]
    assert len(entry["proof_documents"]) == 1

    # L'admin peut lire le bien et télécharger le justificatif, mais pas modifier le bien
    proof_id = entry["proof_documents"][0]["id"]
    r = client.get(f"{API}/properties/{prop['id']}/documents/{proof_id}/download", headers=admin_headers)
    assert r.status_code == 200 and r.content == PDF
    assert client.patch(f"{API}/properties/{prop['id']}", headers=admin_headers,
                        json={"address_label": "x"}).status_code == 404

    r = client.post(f"{API}/admin/properties/{prop['id']}/ownership", headers=admin_headers,
                    json={"status": "rejected", "comment": "Document illisible"})
    assert r.status_code == 200
    mine = client.get(f"{API}/properties/{prop['id']}", headers=user_token).json()
    assert mine["ownership_status"] == "rejected"
    assert mine["ownership_comment"] == "Document illisible"

    # Nouveau justificatif : le bien repasse en attente
    upload_doc(client, user_token, prop["id"], doc_type="preuve_propriete", title="Titre")
    assert client.get(f"{API}/properties/{prop['id']}", headers=user_token).json()["ownership_status"] == "pending"

    r = client.post(f"{API}/admin/properties/{prop['id']}/ownership", headers=admin_headers,
                    json={"status": "verified"})
    assert r.json()["ownership_status"] == "verified"
    assert prop["id"] not in [p["id"] for p in client.get(f"{API}/admin/properties", headers=admin_headers).json()]
    verified = client.get(f"{API}/admin/properties?status=verified", headers=admin_headers).json()
    assert prop["id"] in [p["id"] for p in verified]

    assert client.post(f"{API}/admin/properties/{prop['id']}/ownership", headers=admin_headers,
                       json={"status": "pending"}).status_code == 422
    assert client.post(f"{API}/admin/properties/does-not-exist/ownership", headers=admin_headers,
                       json={"status": "verified"}).status_code == 404


def test_users_me_exposes_is_admin(client, user_token, admin_headers):
    assert client.get(f"{API}/users/me", headers=user_token).json()["is_admin"] is False
    assert client.get(f"{API}/users/me", headers=admin_headers).json()["is_admin"] is True


def test_upload_dir_is_not_served(client, user_token, prop):
    name = os.listdir(settings.UPLOAD_DIR)[0]
    for path in (f"/uploads/{name}", f"/{name}", f"{API}/uploads/{name}"):
        assert client.get(path).status_code == 404
    assert Path(settings.UPLOAD_DIR).resolve().is_dir()
