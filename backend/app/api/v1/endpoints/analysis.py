from fastapi import APIRouter, UploadFile, File
from app.schemas.document import AnalyzedDocument
from app.services.document_service import analyze_document_with_ai

router = APIRouter()

@router.post("/analyze", response_model=AnalyzedDocument)
async def analyze_file(file: UploadFile = File(...)):
    """
    Upload un fichier (PDF/Image), détecte son type et extrait les infos via IA.
    """
    return await analyze_document_with_ai(file)
