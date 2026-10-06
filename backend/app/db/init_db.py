import logging
from typing import Optional
from sqlalchemy import func, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from app.core import security
from app.db.models.user import User

logger = logging.getLogger(__name__)


def ensure_user_columns(engine: Engine) -> None:
    """Ajoute la colonne is_admin aux bases existantes (create_all ne modifie pas les tables)."""
    columns = {c["name"] for c in inspect(engine).get_columns("user")}
    if "is_admin" not in columns:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false'))
        logger.info("Colonne user.is_admin ajoutée")


def upsert_admin(db: Session, email: str, password: str) -> User:
    """Crée le compte admin, ou promeut le compte existant et remplace son mot de passe."""
    email = email.strip().lower()
    if len(password) < security.MIN_PASSWORD_LENGTH:
        raise ValueError(
            f"Le mot de passe admin doit faire au moins {security.MIN_PASSWORD_LENGTH} caractères"
        )

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
