from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.rate_limit import client_ip, too_many_requests
from app.db.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    email = form_data.username.strip().lower()
    # Derrière un reverse proxy, request.client.host n'est la vraie IP que si uvicorn
    # tourne avec --proxy-headers et FORWARDED_ALLOW_IPS (voir Dockerfile).
    ip = client_ip(request)
    # Clé IP + compte : un attaquant ne verrouille pas le compte de la victime depuis une autre IP
    # (voir le commentaire de app/core/security.py pour les limites de ce compromis).
    limiter_key = f"{ip}:{email}"
    ip_key = f"ip:{ip}"

    if security.login_rate_limiter.is_blocked(limiter_key) or security.ip_rate_limiter.is_blocked(ip_key):
        raise too_many_requests("Trop de tentatives. Réessayez dans quelques minutes.")

    user = db.query(User).filter(func.lower(User.email) == email).first()
    # Toujours vérifier un hash pour ne pas révéler l'existence du compte par le temps de réponse
    password_ok = security.verify_password(
        form_data.password, user.hashed_password if user else security.DUMMY_PASSWORD_HASH
    )
    if not user or not password_ok or not user.is_active:
        security.login_rate_limiter.record(limiter_key)
        security.ip_rate_limiter.record(ip_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    security.login_rate_limiter.reset(limiter_key)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserSchema)
def register_new_user(
    *,
    request: Request,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user without the need to be logged in
    """
    if not security.register_rate_limiter.hit(client_ip(request)):
        raise too_many_requests("Trop d'inscriptions depuis cette adresse. Réessayez plus tard.")

    user = db.query(User).filter(func.lower(User.email) == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
