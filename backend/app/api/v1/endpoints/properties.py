"""Espace propriétaire : biens et ressources rattachées (travaux, charges, tâches, documents).

Règle d'accès, appliquée à CHAQUE route : le bien doit appartenir à l'utilisateur courant,
sinon 404 (on ne révèle pas son existence). Les administrateurs peuvent LIRE tous les biens
(pour la vérification de propriété) mais ne modifient que les leurs.
"""
import logging
from typing import Any, List, Optional, Type
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, TypeAdapter, ValidationError
import datetime as dt
from sqlalchemy.orm import Session, selectinload
from app.api import deps
from app.db.models.property import (
    DOC_TYPE_OWNERSHIP_PROOF, OWNERSHIP_PENDING, OWNERSHIP_REJECTED, OWNERSHIP_VERIFIED,
    Document, Expense, Property, Task, Work,
)
from app.db.models.user import User
from app.schemas.document import AnalyzedDocument
from app.schemas.property import (
    DocumentOut, DocumentUpdate, ExpenseCreate, ExpenseOut, ExpenseUpdate, PropertyFields,
    PropertyOut, PropertyUpdate, TaskCreate, TaskOut, TaskUpdate, WorkCreate, WorkOut, WorkUpdate,
)
from app.services import document_service, storage

logger = logging.getLogger(__name__)

router = APIRouter()

_analysis_adapter = TypeAdapter(AnalyzedDocument)


def _not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien introuvable")


def get_property_for_user(db: Session, property_id: str, user: User, *, write: bool = False) -> Property:
    prop = db.get(Property, property_id)
    if prop is None:
        raise _not_found()
    if prop.user_id == user.id:
        return prop
    if user.is_admin and not write:
        return prop
    raise _not_found()


def property_out(prop: Property) -> PropertyOut:
    out = PropertyOut.model_validate(prop)
    out.has_ownership_proof = any(d.doc_type == DOC_TYPE_OWNERSHIP_PROOF for d in prop.documents)
    return out


def _validation_error(exc: ValidationError) -> RequestValidationError:
    return RequestValidationError(exc.errors(include_url=False, include_context=False))


# --- Biens -------------------------------------------------------------------

@router.get("", response_model=List[PropertyOut])
def list_properties(
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    props = (
        db.query(Property)
        .options(selectinload(Property.documents))
        .filter(Property.user_id == user.id)
        .order_by(Property.created_at)
        .all()
    )
    return [property_out(p) for p in props]


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: str = Form(..., description="Champs du bien (PropertyFields) en JSON"),
    proof: Optional[UploadFile] = File(None, description="Justificatif de propriété (PDF/image)"),
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    """Crée un bien. Un justificatif de propriété est obligatoire (sauf pour un administrateur) ;
    il est stocké comme document `preuve_propriete` et le bien reste `pending` jusqu'à
    vérification par un administrateur."""
    try:
        fields = PropertyFields.model_validate_json(payload)
    except ValidationError as exc:
        raise _validation_error(exc)

    if proof is not None and not proof.filename:
        proof = None  # champ fichier envoyé vide
    if proof is None and not user.is_admin:
        raise HTTPException(
            status_code=422,
            detail="Un justificatif de propriété est requis.",
        )

    content = mime = None
    if proof is not None:
        content, mime = await storage.read_validated_document(proof)

    prop = Property(
        user_id=user.id,
        ownership_status=OWNERSHIP_VERIFIED if user.is_admin else OWNERSHIP_PENDING,
        **fields.model_dump(),
    )
    db.add(prop)
    stored = None
    try:
        db.flush()
        if content is not None:
            stored = storage.save_file(content, mime)
            db.add(Document(
                property_id=prop.id,
                title="Justificatif de propriété",
                doc_type=DOC_TYPE_OWNERSHIP_PROOF,
                original_filename=_safe_filename(proof.filename),
                stored_path=stored,
                mime_type=mime,
                size=len(content),
            ))
        db.commit()
    except Exception:
        db.rollback()
        if stored:
            storage.delete_file(stored)
        raise
    db.refresh(prop)
    return property_out(prop)


@router.get("/{property_id}", response_model=PropertyOut)
def read_property(
    property_id: str,
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    return property_out(get_property_for_user(db, property_id, user))


@router.patch("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: str,
    body: PropertyUpdate,
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    prop = get_property_for_user(db, property_id, user, write=True)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(prop, k, v)
    db.commit()
    db.refresh(prop)
    return property_out(prop)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: str,
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Response:
    prop = get_property_for_user(db, property_id, user, write=True)
    files = [d.stored_path for d in prop.documents]
    db.delete(prop)
    db.commit()
    for f in files:
        storage.delete_file(f)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Travaux, charges, tâches (CRUD générique) --------------------------------

def _register_child_crud(
    path: str,
    model: Type[Any],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    out_schema: Type[BaseModel],
    order_by: Any,
    label: str,
) -> None:
    def _get_child(db: Session, prop: Property, item_id: str):
        item = db.get(model, item_id)
        if item is None or item.property_id != prop.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} introuvable")
        return item

    @router.get(f"/{{property_id}}/{path}", response_model=List[out_schema], name=f"list_{path}")
    def list_items(property_id: str, db: Session = Depends(deps.get_db),
                   user: User = Depends(deps.get_current_user)) -> Any:
        prop = get_property_for_user(db, property_id, user)
        return db.query(model).filter(model.property_id == prop.id).order_by(*order_by).all()

    @router.post(f"/{{property_id}}/{path}", response_model=out_schema,
                 status_code=status.HTTP_201_CREATED, name=f"create_{path}")
    def create_item(property_id: str, body: create_schema, db: Session = Depends(deps.get_db),  # type: ignore[valid-type]
                    user: User = Depends(deps.get_current_user)) -> Any:
        prop = get_property_for_user(db, property_id, user, write=True)
        item = model(property_id=prop.id, **body.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @router.patch(f"/{{property_id}}/{path}/{{item_id}}", response_model=out_schema, name=f"update_{path}")
    def update_item(property_id: str, item_id: str, body: update_schema,  # type: ignore[valid-type]
                    db: Session = Depends(deps.get_db),
                    user: User = Depends(deps.get_current_user)) -> Any:
        prop = get_property_for_user(db, property_id, user, write=True)
        item = _get_child(db, prop, item_id)
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(item, k, v)
        db.commit()
        db.refresh(item)
        return item

    @router.delete(f"/{{property_id}}/{path}/{{item_id}}", status_code=status.HTTP_204_NO_CONTENT,
                   name=f"delete_{path}")
    def delete_item(property_id: str, item_id: str, db: Session = Depends(deps.get_db),
                    user: User = Depends(deps.get_current_user)) -> Response:
        prop = get_property_for_user(db, property_id, user, write=True)
        db.delete(_get_child(db, prop, item_id))
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)


_register_child_crud("works", Work, WorkCreate, WorkUpdate, WorkOut,
                     (Work.date.desc(), Work.created_at.desc()), "Travaux")
_register_child_crud("expenses", Expense, ExpenseCreate, ExpenseUpdate, ExpenseOut,
                     (Expense.created_at.desc(),), "Charge")
_register_child_crud("tasks", Task, TaskCreate, TaskUpdate, TaskOut,
                     (Task.done, Task.due_date, Task.created_at), "Tâche")


# --- Documents ---------------------------------------------------------------

class _DocumentMeta(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    doc_type: str = Field(min_length=1, max_length=50)
    date: Optional[dt.date] = None
    description: Optional[str] = Field(None, max_length=5000)


def _safe_filename(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    # Garde seulement le nom de base, sans caractères de contrôle
    base = name.replace("\\", "/").rsplit("/", 1)[-1]
    base = "".join(c for c in base if c.isprintable() and c not in '"')
    return base[:255] or None


def _get_document(db: Session, prop: Property, doc_id: str) -> Document:
    doc = db.get(Document, doc_id)
    if doc is None or doc.property_id != prop.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document introuvable")
    return doc


@router.get("/{property_id}/documents", response_model=List[DocumentOut])
def list_documents(property_id: str, db: Session = Depends(deps.get_db),
                   user: User = Depends(deps.get_current_user)) -> Any:
    prop = get_property_for_user(db, property_id, user)
    return (
        db.query(Document)
        .filter(Document.property_id == prop.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post("/{property_id}/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    property_id: str,
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: str = Form(...),
    date: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    analyze: bool = Form(False, description="Analyser le document avec Gemini et conserver le résultat"),
    ai_analysis: Optional[str] = Form(None, description="Résultat de /documents/analyze déjà obtenu (JSON)"),
    db: Session = Depends(deps.get_db),
    user: User = Depends(deps.get_current_user),
) -> Any:
    prop = get_property_for_user(db, property_id, user, write=True)
    try:
        meta = _DocumentMeta(title=title, doc_type=doc_type, date=date or None, description=description or None)
        analysis = (
            _analysis_adapter.validate_json(ai_analysis).model_dump(mode="json") if ai_analysis else None
        )
    except ValidationError as exc:
        raise _validation_error(exc)

    content, mime = await storage.read_validated_document(file)

    if analyze and analysis is None:
        try:
            result = await document_service.analyze_document_with_ai(content, mime)
            analysis = result.model_dump(mode="json")
        except HTTPException:
            # IA indisponible (pas de clé) : le document est quand même conservé
            analysis = None

    stored = storage.save_file(content, mime)
    try:
        doc = Document(
            property_id=prop.id,
            original_filename=_safe_filename(file.filename),
            stored_path=stored,
            mime_type=mime,
            size=len(content),
            ai_analysis=analysis,
            **meta.model_dump(),
        )
        db.add(doc)
        # Nouveau justificatif après un refus : le bien repasse en attente de vérification
        if meta.doc_type == DOC_TYPE_OWNERSHIP_PROOF and prop.ownership_status == OWNERSHIP_REJECTED:
            prop.ownership_status = OWNERSHIP_PENDING
        db.commit()
    except Exception:
        db.rollback()
        storage.delete_file(stored)
        raise
    db.refresh(doc)
    return doc


@router.get("/{property_id}/documents/{doc_id}", response_model=DocumentOut)
def read_document(property_id: str, doc_id: str, db: Session = Depends(deps.get_db),
                  user: User = Depends(deps.get_current_user)) -> Any:
    prop = get_property_for_user(db, property_id, user)
    return _get_document(db, prop, doc_id)


@router.patch("/{property_id}/documents/{doc_id}", response_model=DocumentOut)
def update_document(property_id: str, doc_id: str, body: DocumentUpdate,
                    db: Session = Depends(deps.get_db),
                    user: User = Depends(deps.get_current_user)) -> Any:
    prop = get_property_for_user(db, property_id, user, write=True)
    doc = _get_document(db, prop, doc_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(doc, k, v)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{property_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(property_id: str, doc_id: str, db: Session = Depends(deps.get_db),
                    user: User = Depends(deps.get_current_user)) -> Response:
    prop = get_property_for_user(db, property_id, user, write=True)
    doc = _get_document(db, prop, doc_id)
    stored = doc.stored_path
    db.delete(doc)
    db.commit()
    storage.delete_file(stored)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{property_id}/documents/{doc_id}/download")
def download_document(property_id: str, doc_id: str, db: Session = Depends(deps.get_db),
                      user: User = Depends(deps.get_current_user)) -> Any:
    prop = get_property_for_user(db, property_id, user)
    doc = _get_document(db, prop, doc_id)
    path = storage.resolve_path(doc.stored_path)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier introuvable")
    filename = doc.original_filename or f"document{storage.ALLOWED_MIME_TYPES.get(doc.mime_type, '')}"
    return FileResponse(
        path,
        media_type=doc.mime_type,
        filename=filename,  # Content-Disposition: attachment
        headers={"Cache-Control": "private, no-store"},
    )
