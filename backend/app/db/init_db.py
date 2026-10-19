import logging
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core import security
from app.db.models.user import User

logger = logging.getLogger(__name__)


def _check_admin_password(password: str) -> None:
    if len(password) < security.MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Le mot de passe admin doit faire au moins {security.MIN_PASSWORD_LENGTH} caractères"
        )


def ensure_admin(db: Session, email: str, password: str) -> Optional[User]:
    """Crée le compte admin s'il n'existe pas. Renvoie None (sans rien modifier) s'il existe déjà.

    Utilisé au démarrage de l'API : ne réinitialise jamais un mot de passe existant.
    """
    email = email.strip().lower()
    if db.query(User).filter(func.lower(User.email) == email).first() is not None:
        return None
    _check_admin_password(password)
    user = User(
        email=email,
        hashed_password=security.get_password_hash(password),
        is_active=True,
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def upsert_admin(db: Session, email: str, password: str) -> User:
    """Crée le compte admin, ou promeut le compte existant et remplace son mot de passe.

    Réservé au script manuel create_admin.py (réinitialisation volontaire).
    """
    email = email.strip().lower()
    _check_admin_password(password)

    user: Optional[User] = db.query(User).filter(func.lower(User.email) == email).first()
    if user is None:
        user = User(email=email, is_active=True)
        db.add(user)
    user.hashed_password = security.get_password_hash(password)
    user.is_admin = True
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user
