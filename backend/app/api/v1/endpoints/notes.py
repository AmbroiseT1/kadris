"""Bloc-notes de l'utilisateur, global ou rattaché à un bien. Une note n'est visible que par
son auteur (administrateurs compris)."""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.api import deps
from app.api.v1.endpoints.properties import get_property_for_user
from app.db.models.property import Note
from app.db.models.user import User
from app.schemas.property import NoteCreate, NoteOut, NoteUpdate

router = APIRouter()


def _get_note(db: Session, note_id: str, user: User) -> Note:
    note = db.get(Note, note_id)
    if note is None or note.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note introuvable")
    return note


@router.get("", response_model=List[NoteOut])
def list_notes(
    property_id: Optional[str] = Query(None, description="Notes de ce bien ; sans paramètre : notes globales"),
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    q = db.query(Note).filter(Note.user_id == user.id)
    if property_id is not None:
        get_property_for_user(db, property_id, user, write=True)
        q = q.filter(Note.property_id == property_id)
    else:
        q = q.filter(Note.property_id.is_(None))
    return q.order_by(Note.updated_at.desc()).all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    body: NoteCreate,
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    if body.property_id is not None:
        get_property_for_user(db, body.property_id, user, write=True)
    note = Note(user_id=user.id, property_id=body.property_id, content=body.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteOut)
def read_note(note_id: str, db: Session = Depends(deps.get_db),
              user: User = Depends(deps.get_current_user)) -> Any:
    return _get_note(db, note_id, user)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: str, body: NoteUpdate, db: Session = Depends(deps.get_db),
                user: User = Depends(deps.get_current_user)) -> Any:
    note = _get_note(db, note_id, user)
    note.content = body.content
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: str, db: Session = Depends(deps.get_db),
                user: User = Depends(deps.get_current_user)) -> Response:
    db.delete(_get_note(db, note_id, user))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
