"""Vérification des justificatifs de propriété (réservé aux administrateurs)."""
from typing import Any, List, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from app.api import deps
from app.api.v1.endpoints.properties import property_out
from app.db.models.property import DOC_TYPE_OWNERSHIP_PROOF, Property
from app.db.models.user import User
from app.schemas.property import AdminPropertyOut, OwnershipDecision, ProofDocumentRef

router = APIRouter()


def _admin_out(db: Session, prop: Property) -> AdminPropertyOut:
    owner = db.get(User, prop.user_id)
    return AdminPropertyOut(
        **property_out(prop).model_dump(),
        owner_email=owner.email if owner else "",
        proof_documents=[
            ProofDocumentRef.model_validate(d)
            for d in prop.documents if d.doc_type == DOC_TYPE_OWNERSHIP_PROOF
        ],
    )


@router.get("/properties", response_model=List[AdminPropertyOut])
def list_properties_for_review(
    ownership_status: Literal["pending", "verified", "rejected", "all"] = Query("pending", alias="status"),
    db: Session = Depends(deps.get_db),
    _admin: User = Depends(deps.get_current_admin),
) -> Any:
    q = db.query(Property).options(selectinload(Property.documents))
    if ownership_status != "all":
        q = q.filter(Property.ownership_status == ownership_status)
    return [_admin_out(db, p) for p in q.order_by(Property.created_at).all()]


@router.post("/properties/{property_id}/ownership", response_model=AdminPropertyOut)
def set_ownership_status(
    property_id: str,
    body: OwnershipDecision,
    db: Session = Depends(deps.get_db),
    _admin: User = Depends(deps.get_current_admin),
) -> Any:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien introuvable")
    prop.ownership_status = body.status
    prop.ownership_comment = body.comment
    db.commit()
    db.refresh(prop)
    return _admin_out(db, prop)
