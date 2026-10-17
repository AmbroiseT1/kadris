"""Schéma initial : comptes + espace propriétaire.

Fonctionne aussi sur une base existante créée avant Alembic par `Base.metadata.create_all`
(table `user` déjà présente, avec ou sans `is_admin`) : chaque table n'est créée que si elle
n'existe pas, et la colonne `user.is_admin` est ajoutée si elle manque. Aucun `alembic stamp`
manuel n'est donc nécessaire.

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _tables() -> set:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _uuid_pk() -> sa.Column:
    return sa.Column("id", sa.String(), primary_key=True)


def _created_at() -> sa.Column:
    return sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)


def _property_fk() -> sa.Column:
    return sa.Column("property_id", sa.String(), sa.ForeignKey("property.id", ondelete="CASCADE"),
                     nullable=False)


def upgrade() -> None:
    existing = _tables()

    # --- user (peut préexister) ---
    if "user" not in existing:
        op.create_table(
            "user",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        )
        op.create_index("ix_user_id", "user", ["id"])
        op.create_index("ix_user_email", "user", ["email"], unique=True)
    else:
        columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("user")}
        if "is_admin" not in columns:
            with op.batch_alter_table("user") as batch:
                batch.add_column(sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False))

    if "property" not in existing:
        op.create_table(
            "property",
            _uuid_pk(),
            sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
            sa.Column("address_label", sa.String(500), nullable=False),
            sa.Column("cle_interop", sa.String(64), nullable=True),
            sa.Column("lat", sa.Float(), nullable=True),
            sa.Column("lon", sa.Float(), nullable=True),
            sa.Column("code_insee", sa.String(10), nullable=True),
            sa.Column("building_data", sa.JSON(), nullable=True),
            sa.Column("ownership_status", sa.String(20), server_default="pending", nullable=False),
            sa.Column("ownership_comment", sa.String(1000), nullable=True),
            _created_at(),
        )
        op.create_index("ix_property_user_id", "property", ["user_id"])
        op.create_index("ix_property_cle_interop", "property", ["cle_interop"])
        op.create_index("ix_property_ownership_status", "property", ["ownership_status"])

    if "work" not in existing:
        op.create_table(
            "work",
            _uuid_pk(),
            _property_fk(),
            sa.Column("title", sa.String(200), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
            sa.Column("date", sa.Date(), nullable=True),
            sa.Column("cost", sa.Float(), nullable=True),
            sa.Column("provider", sa.String(200), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(20), server_default="done", nullable=False),
            _created_at(),
        )
        op.create_index("ix_work_property_id", "work", ["property_id"])

    if "expense" not in existing:
        op.create_table(
            "expense",
            _uuid_pk(),
            _property_fk(),
            sa.Column("label", sa.String(200), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("frequency", sa.String(20), nullable=True),
            sa.Column("provider", sa.String(200), nullable=True),
            sa.Column("date", sa.Date(), nullable=True),
            _created_at(),
        )
        op.create_index("ix_expense_property_id", "expense", ["property_id"])

    if "task" not in existing:
        op.create_table(
            "task",
            _uuid_pk(),
            _property_fk(),
            sa.Column("title", sa.String(200), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
            sa.Column("due_date", sa.Date(), nullable=True),
            sa.Column("done", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("priority", sa.String(20), nullable=True),
            sa.Column("estimated_cost", sa.Float(), nullable=True),
            _created_at(),
        )
        op.create_index("ix_task_property_id", "task", ["property_id"])

    if "document" not in existing:
        op.create_table(
            "document",
            _uuid_pk(),
            _property_fk(),
            sa.Column("title", sa.String(200), nullable=False),
            sa.Column("doc_type", sa.String(50), nullable=False),
            sa.Column("date", sa.Date(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("original_filename", sa.String(255), nullable=True),
            sa.Column("stored_path", sa.String(255), nullable=False),
            sa.Column("mime_type", sa.String(100), nullable=False),
            sa.Column("size", sa.Integer(), nullable=False),
            sa.Column("ai_analysis", sa.JSON(), nullable=True),
            _created_at(),
        )
        op.create_index("ix_document_property_id", "document", ["property_id"])

    if "note" not in existing:
        op.create_table(
            "note",
            _uuid_pk(),
            sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE"), nullable=False),
            sa.Column("property_id", sa.String(), sa.ForeignKey("property.id", ondelete="CASCADE"), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_note_user_id", "note", ["user_id"])
        op.create_index("ix_note_property_id", "note", ["property_id"])


def downgrade() -> None:
    # Ne supprime pas `user` : la table peut préexister à Alembic et contient les comptes
    for table in ("note", "document", "task", "expense", "work", "property"):
        op.drop_table(table)
