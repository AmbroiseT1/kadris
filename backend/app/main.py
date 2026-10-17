import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine, SessionLocal
from app.db.base_class import Base
from app.db.models import user  # Import pour que Base connaisse le modèle User
from app.db.init_db import ensure_admin, ensure_user_columns

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Compte admin depuis l'environnement (ADMIN_EMAIL + ADMIN_PASSWORD), créé seulement s'il
    # n'existe pas : un mot de passe existant n'est jamais écrasé (voir create_admin.py).
    if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
        db = SessionLocal()
        try:
            if ensure_admin(db, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD):
                logger.info("Compte admin créé : %s", settings.ADMIN_EMAIL)
        finally:
            db.close()
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,  # Auth par header Bearer, pas de cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response

# Inclusion des routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Création des tables au démarrage (Simple pour le MVP)
Base.metadata.create_all(bind=engine)
ensure_user_columns(engine)

@app.get("/")
def root():
    return {"message": "Bricq API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
