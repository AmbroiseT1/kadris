from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings
from conftest import API, USER_PASSWORD, login, register_user


def _token(sub, key=None, exp_delta=timedelta(minutes=5), type_="access"):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": sub, "type": type_, "iat": now, "exp": now + exp_delta},
        key or settings.SECRET_KEY,
        algorithm="HS256",
    )


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_register_and_duplicate(client):
    email = register_user(client)
    r = client.post(f"{API}/auth/register", json={"email": email, "password": USER_PASSWORD})
    assert r.status_code == 400


def test_register_rejects_short_password(client):
    r = client.post(f"{API}/auth/register", json={"email": "short@example.com", "password": "short"})
    assert r.status_code == 422


def test_register_response_has_no_password_and_not_admin(client):
    r = client.post(
        f"{API}/auth/register", json={"email": "plain@example.com", "password": USER_PASSWORD}
    )
    body = r.json()
    assert body["is_admin"] is False
    assert "password" not in body and "hashed_password" not in body


def test_login_ok(client, user_credentials):
    email, password = user_credentials
    r = login(client, email, password)
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"


def test_login_bad_password_is_401(client, user_credentials):
    email, _ = user_credentials
    r = login(client, email, "wrong-password-xx")
    assert r.status_code == 401


def test_login_unknown_user_is_401(client):
    assert login(client, "nobody@example.com", "whatever-password").status_code == 401


def test_users_me(client, user_credentials, user_token):
    r = client.get(f"{API}/users/me", headers=user_token)
    assert r.status_code == 200
    assert r.json()["email"] == user_credentials[0]


def test_users_me_requires_auth(client):
    assert client.get(f"{API}/users/me").status_code == 401


def test_users_list_forbidden_for_normal_user(client, user_token):
    assert client.get(f"{API}/users/", headers=user_token).status_code == 403


def test_users_list_ok_for_admin(client, admin_headers):
    r = client.get(f"{API}/users/", headers=admin_headers)
    assert r.status_code == 200
    assert "admin@example.com" in [u["email"] for u in r.json()]


def test_admin_not_reset_at_startup(client, admin_headers):
    """ensure_admin ne doit jamais écraser un compte existant."""
    from app.db.init_db import ensure_admin
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        assert ensure_admin(db, "admin@example.com", "another-password-999") is None
    finally:
        db.close()
    assert login(client, "admin@example.com", "admin-password-123").status_code == 200


def test_token_signed_with_wrong_key_is_401(client, user_credentials):
    me = client.get(
        f"{API}/users/me",
        headers={"Authorization": "Bearer " + login(client, *user_credentials).json()["access_token"]},
    ).json()
    bad = _token(me["id"], key="a-completely-different-secret-key-0123456789")
    r = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {bad}"})
    assert r.status_code == 401


def test_expired_token_is_401(client, user_credentials):
    me = client.get(
        f"{API}/users/me",
        headers={"Authorization": "Bearer " + login(client, *user_credentials).json()["access_token"]},
    ).json()
    expired = _token(me["id"], exp_delta=timedelta(minutes=-5))
    r = client.get(f"{API}/users/me", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_garbage_token_is_401(client):
    r = client.get(f"{API}/users/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_register_rate_limit(client):
    for i in range(settings.REGISTER_MAX_PER_IP):
        r = client.post(
            f"{API}/auth/register",
            json={"email": f"rl{i}@example.com", "password": USER_PASSWORD},
        )
        assert r.status_code == 200, r.text
    r = client.post(
        f"{API}/auth/register", json={"email": "rl-over@example.com", "password": USER_PASSWORD}
    )
    assert r.status_code == 429


def test_login_per_email_lockout(client, user_credentials):
    email, password = user_credentials
    for _ in range(settings.LOGIN_MAX_ATTEMPTS):
        assert login(client, email, "wrong-password-xx").status_code == 401
    # même le bon mot de passe est refusé tant que la fenêtre court
    assert login(client, email, password).status_code == 429
    # un autre compte, depuis la même IP, n'est pas verrouillé par ce compteur
    other = register_user(client)
    assert login(client, other, USER_PASSWORD).status_code == 200


def test_login_per_ip_limit(client):
    """Une IP qui échoue sur beaucoup d'emails différents finit bloquée (compteur IP seul)."""
    for i in range(settings.LOGIN_MAX_ATTEMPTS_PER_IP):
        assert login(client, f"spray{i}@example.com", "wrong-password-xx").status_code == 401
    victim = register_user(client)
    assert login(client, victim, USER_PASSWORD).status_code == 429
