from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.db.models.user import User as UserModel
from app.schemas.user import User

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[User])
def list_users(
    db: Session = Depends(deps.get_db),
    _admin: UserModel = Depends(deps.get_current_admin),
) -> Any:
    """
    Liste des comptes (réservé aux administrateurs).
    """
    return db.query(UserModel).order_by(UserModel.created_at).all()
