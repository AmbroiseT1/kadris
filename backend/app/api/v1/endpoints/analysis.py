from fastapi import APIRouter, Depends, File, UploadFile
from app.api import deps
from app.db.models.user import User
from app.schemas.document import AnalyzedDocument
from app.services.document_service import analyze_document_with_ai
from app.services.storage import read_validated_upload

router = APIRouter()


@router.post("/analyze", response_model=AnalyzedDocument)
async def analyze_file(
    file: UploadFile = File(...),
    _user: User = Depends(deps.get_current_user),
):
    """
    Upload un fichier (PDF/Image), détecte son type et extrait les infos via IA.
    Réservé aux utilisateurs connectés. Le fichier n'est pas conservé.
    """
    content, mime = await read_validated_upload(file)
    return await analyze_document_with_ai(content, mime)
