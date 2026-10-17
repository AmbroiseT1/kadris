from fastapi import APIRouter
from app.api.v1.endpoints import analysis, auth, users, proxy
from app.api.v1.endpoints import admin, notes, properties

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(analysis.router, prefix="/documents", tags=["documents"])
api_router.include_router(proxy.router, prefix="/proxy", tags=["proxy"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
