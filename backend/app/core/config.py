from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Bricq API"
    API_V1_STR: str = "/api/v1"
    
    # Base de données (Valeur par défaut issue de ton journal)
    DATABASE_URL: str = "postgresql://kadris:***REMOVED_DB_PASSWORD***@postgres/kadris_data"
    
    # IA
    GEMINI_API_KEY: str

    # Security
    SECRET_KEY: str = "***REMOVED_JWT_KEY***" # Generated random key
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
