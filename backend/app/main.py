from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development - CHANGE IN PRODUCTION!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Création des tables au démarrage (Simple pour le MVP)
from app.db.session import engine
from app.db.base_class import Base
from app.db.models import user  # Import pour que Base connaisse le modèle User

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Bricq API is running", "version": "1.0.0"}
