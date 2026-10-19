"""Application des migrations Alembic depuis le code (démarrage de l'API, create_admin.py)."""
from pathlib import Path
from typing import Optional

from alembic import command
from alembic.config import Config

BACKEND_DIR = Path(__file__).resolve().parents[2]
ALEMBIC_INI = BACKEND_DIR / "alembic.ini"


def alembic_config(database_url: Optional[str] = None) -> Config:
    cfg = Config(str(ALEMBIC_INI))
    cfg.attributes["skip_logging_config"] = True
    if database_url:
        # configparser : les % doivent être doublés
        cfg.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return cfg


def upgrade_to_head(database_url: Optional[str] = None) -> None:
    """Équivalent de `alembic upgrade head` (DATABASE_URL par défaut)."""
    command.upgrade(alembic_config(database_url), "head")
