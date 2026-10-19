from datetime import datetime, timedelta, timezone
from typing import Any, Union

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.rate_limit import SlidingWindowLimiter

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

MIN_PASSWORD_LENGTH = 10

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "iat": now, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict:
    """Décode et vérifie un JWT (signature, expiration). Lève jwt.InvalidTokenError sinon
    (jwt.ExpiredSignatureError en est une sous-classe)."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={"require": ["exp", "sub"]},
    )

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Hash factice pour garder un temps de réponse constant quand l'email n'existe pas
DUMMY_PASSWORD_HASH = pwd_context.hash("bricq-dummy-password")


# Anti brute-force sur /auth/login (mémoire du processus, voir app/core/rate_limit.py).
#
# 1) Compteur IP + email : bloque l'essai répété d'un mot de passe sur UN compte depuis une IP.
#    Compromis assumé : la clé contient l'IP, donc un attaquant ne verrouille pas la victime
#    qui se connecte depuis une autre IP. En revanche, la victime derrière la même IP (NAT
#    d'entreprise, proxy mal configuré) peut être bloquée quelques minutes avec l'attaquant.
# 2) Compteur IP seul (plus large) : plafonne le nombre d'échecs d'une IP tous comptes
#    confondus (« password spraying » sur beaucoup d'emails).
login_rate_limiter = SlidingWindowLimiter(settings.LOGIN_MAX_ATTEMPTS, settings.LOGIN_WINDOW_SECONDS)
ip_rate_limiter = SlidingWindowLimiter(settings.LOGIN_MAX_ATTEMPTS_PER_IP, settings.LOGIN_IP_WINDOW_SECONDS)
# Inscriptions par IP
register_rate_limiter = SlidingWindowLimiter(settings.REGISTER_MAX_PER_IP, settings.REGISTER_WINDOW_SECONDS)
# Proxy Overpass par IP
proxy_rate_limiter = SlidingWindowLimiter(settings.PROXY_MAX_PER_IP, settings.PROXY_WINDOW_SECONDS)
