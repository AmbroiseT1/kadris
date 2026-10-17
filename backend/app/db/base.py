"""Importe tous les modèles pour que Base.metadata les connaisse (Alembic, tests)."""
from app.db.base_class import Base  # noqa: F401
from app.db.models.user import User  # noqa: F401
from app.db.models.property import Document, Expense, Note, Property, Task, Work  # noqa: F401
