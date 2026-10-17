"""Les migrations Alembic créent le schéma attendu, y compris sur une base pré-Alembic."""
import sqlalchemy as sa
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from app.db.base import Base
from app.db.migrate import upgrade_to_head

TABLES = {"user", "property", "work", "expense", "task", "document", "note", "alembic_version"}


def _diff(url):
    engine = sa.create_engine(url)
    with engine.connect() as conn:
        return compare_metadata(MigrationContext.configure(conn), Base.metadata)


def test_upgrade_head_on_empty_sqlite(tmp_path):
    url = f"sqlite:///{tmp_path}/empty.db"
    upgrade_to_head(url)
    assert set(sa.inspect(sa.create_engine(url)).get_table_names()) == TABLES
    # Les modèles et la migration décrivent le même schéma
    assert _diff(url) == []
    # Idempotent
    upgrade_to_head(url)


def test_upgrade_head_on_legacy_db_without_is_admin(tmp_path):
    url = f"sqlite:///{tmp_path}/legacy.db"
    engine = sa.create_engine(url)
    with engine.begin() as conn:
        conn.execute(sa.text(
            'CREATE TABLE "user" (id VARCHAR PRIMARY KEY, email VARCHAR NOT NULL, '
            'hashed_password VARCHAR NOT NULL, is_active BOOLEAN, created_at DATETIME)'
        ))
        conn.execute(sa.text('CREATE INDEX ix_user_id ON "user" (id)'))
        conn.execute(sa.text('CREATE UNIQUE INDEX ix_user_email ON "user" (email)'))
        conn.execute(sa.text(
            "INSERT INTO \"user\" (id, email, hashed_password, is_active) VALUES ('u1', 'a@b.fr', 'h', 1)"
        ))
    upgrade_to_head(url)
    insp = sa.inspect(sa.create_engine(url))
    assert set(insp.get_table_names()) == TABLES
    assert "is_admin" in {c["name"] for c in insp.get_columns("user")}
    with sa.create_engine(url).connect() as conn:
        row = conn.execute(sa.text('SELECT email, is_admin FROM "user"')).one()
    assert row == ("a@b.fr", 0)
