from fastapi import APIRouter
from app.api.v1.endpoints import analysis

api_router = APIRouter()
# Nous ajoutons ici la route d'analyse sous le préfixe /documents
api_router.include_router(analysis.router, prefix="/documents", tags=["documents"])
