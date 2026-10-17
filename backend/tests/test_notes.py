from conftest import API
from test_properties import create_property


def test_global_note_crud(client, user_token):
    assert client.get(f"{API}/notes", headers=user_token).json() == []
    r = client.post(f"{API}/notes", headers=user_token, json={"content": "Appeler le plombier"})
    assert r.status_code == 201, r.text
    note = r.json()
    assert note["property_id"] is None

    r = client.patch(f"{API}/notes/{note['id']}", headers=user_token, json={"content": "Fait"})
    assert r.json()["content"] == "Fait"
    assert [n["content"] for n in client.get(f"{API}/notes", headers=user_token).json()] == ["Fait"]

    assert client.delete(f"{API}/notes/{note['id']}", headers=user_token).status_code == 204
    assert client.get(f"{API}/notes/{note['id']}", headers=user_token).status_code == 404


def test_property_note(client, user_token):
    prop = create_property(client, user_token).json()
    client.post(f"{API}/notes", headers=user_token, json={"content": "global"})
    r = client.post(f"{API}/notes", headers=user_token, json={"property_id": prop["id"], "content": "bien"})
    assert r.status_code == 201
    notes = client.get(f"{API}/notes", headers=user_token, params={"property_id": prop["id"]}).json()
    assert [n["content"] for n in notes] == ["bien"]
    assert [n["content"] for n in client.get(f"{API}/notes", headers=user_token).json()] == ["global"]


def test_note_isolation(client, user_token, admin_headers):
    prop = create_property(client, user_token).json()
    note = client.post(f"{API}/notes", headers=user_token,
                       json={"property_id": prop["id"], "content": "secret"}).json()

    from test_properties import _headers
    other = _headers(client)
    for h in (other, admin_headers):
        assert client.get(f"{API}/notes", headers=h).json() == []
        assert client.get(f"{API}/notes/{note['id']}", headers=h).status_code == 404
        assert client.patch(f"{API}/notes/{note['id']}", headers=h, json={"content": "x"}).status_code == 404
        assert client.delete(f"{API}/notes/{note['id']}", headers=h).status_code == 404
    assert client.get(f"{API}/notes", headers=other, params={"property_id": prop["id"]}).status_code == 404
    assert client.post(f"{API}/notes", headers=other,
                       json={"property_id": prop["id"], "content": "x"}).status_code == 404
    assert client.get(f"{API}/notes/{note['id']}", headers=user_token).json()["content"] == "secret"


def test_note_size_limit(client, user_token):
    r = client.post(f"{API}/notes", headers=user_token, json={"content": "x" * 20_001})
    assert r.status_code == 422
    r = client.post(f"{API}/notes", headers=user_token, json={"content": "x" * 20_000})
    assert r.status_code == 201
