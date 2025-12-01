from fastapi import APIRouter
from app.api.v1.endpoints import analysis, auth, users, proxy

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(analysis.router, prefix="/documents", tags=["documents"])
api_router.include_router(proxy.router, prefix="/proxy", tags=["proxy"])
