from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from app.api import deps
from app.core.config import settings
from app.db.models.user import User
from app.schemas.document import AnalyzedDocument
from app.services.document_service import analyze_document_with_ai

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

@router.post("/analyze", response_model=AnalyzedDocument)
async def analyze_file(
    file: UploadFile = File(...),
    _user: User = Depends(deps.get_current_user),
):
    """
    Upload un fichier (PDF/Image), détecte son type et extrait les infos via IA.
    Réservé aux utilisateurs connectés.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Format non supporté (PDF, JPEG, PNG, WEBP ou HEIC uniquement).",
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux (max {settings.MAX_UPLOAD_SIZE_MB} Mo).",
        )

    return await analyze_document_with_ai(content, file.content_type)
