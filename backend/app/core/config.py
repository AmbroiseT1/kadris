from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bricq API"
    API_V1_STR: str = "/api/v1"

    # Base de données : aucune valeur par défaut, à fournir via l'environnement ou .env
    DATABASE_URL: str

    # IA
    GEMINI_API_KEY: str

    # Security
    # Clé de signature des JWT. Obligatoire : générer avec
    #   python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Origines autorisées pour le CORS, séparées par des virgules
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Compte administrateur créé/mis à jour au démarrage si les deux sont définis
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None

    # Upload de documents
    MAX_UPLOAD_SIZE_MB: int = 10

    # Anti brute-force sur /auth/login
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW_SECONDS: int = 300

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_strength(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY doit faire au moins 32 caractères")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
