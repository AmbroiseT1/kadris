from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bricq API"
    API_V1_STR: str = "/api/v1"

    # Base de données : aucune valeur par défaut, à fournir via l'environnement ou .env
    DATABASE_URL: str

    # IA
    # Optionnelles : sans clé, /documents/analyze répond 503 (le reste de l'API fonctionne)
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # Security
    # Clé de signature des JWT. Obligatoire : générer avec
    #   python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Origines autorisées pour le CORS, séparées par des virgules
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Compte administrateur créé au démarrage s'il n'existe pas (un compte existant n'est jamais
    # modifié ; pour réinitialiser un mot de passe, utiliser create_admin.py)
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None

    # Upload de documents
    MAX_UPLOAD_SIZE_MB: int = 10
    # Dossier de stockage des documents des propriétaires. Hors de tout dossier servi
    # statiquement ; fichiers téléchargeables uniquement via l'API authentifiée.
    # En production (Docker), monter un volume persistant sur ce chemin.
    UPLOAD_DIR: str = "./uploads"

    # Applique les migrations Alembic (alembic upgrade head) au démarrage de l'API
    RUN_MIGRATIONS_ON_STARTUP: bool = True

    # Anti brute-force sur /auth/login
    LOGIN_MAX_ATTEMPTS: int = 5            # échecs par IP + email
    LOGIN_WINDOW_SECONDS: int = 300
    LOGIN_MAX_ATTEMPTS_PER_IP: int = 30    # échecs par IP, tous comptes confondus
    LOGIN_IP_WINDOW_SECONDS: int = 900

    # Inscriptions par IP
    REGISTER_MAX_PER_IP: int = 5
    REGISTER_WINDOW_SECONDS: int = 3600

    # Proxy Overpass : requêtes par IP
    PROXY_MAX_PER_IP: int = 60
    PROXY_WINDOW_SECONDS: int = 60

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
        extra = "ignore"  # .env peut aussi contenir des variables lues par uvicorn ou Docker

settings = Settings()
