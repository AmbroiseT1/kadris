"""Données de l'espace propriétaire : biens, travaux, charges, tâches, documents, notes.

Tout est rattaché (directement ou via le bien) à un utilisateur ; les endpoints vérifient
systématiquement l'appartenance avant toute lecture ou écriture.
"""
import uuid
from sqlalchemy import (
    JSON, Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import false as sa_false
from app.db.base_class import Base


def _uuid() -> str:
    return str(uuid.uuid4())


OWNERSHIP_PENDING = "pending"
OWNERSHIP_VERIFIED = "verified"
OWNERSHIP_REJECTED = "rejected"
OWNERSHIP_STATUSES = (OWNERSHIP_PENDING, OWNERSHIP_VERIFIED, OWNERSHIP_REJECTED)

# Type de document réservé au justificatif de propriété
DOC_TYPE_OWNERSHIP_PROOF = "preuve_propriete"


class Property(Base):
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    address_label = Column(String(500), nullable=False)
    cle_interop = Column(String(64), nullable=True, index=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    code_insee = Column(String(10), nullable=True)
    # Instantané des données bâtiment (BDNB/RNB) au moment de l'ajout, optionnel
    building_data = Column(JSON, nullable=True)
    ownership_status = Column(String(20), nullable=False, default=OWNERSHIP_PENDING,
                              server_default=OWNERSHIP_PENDING, index=True)
    ownership_comment = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    works = relationship("Work", cascade="all, delete-orphan", passive_deletes=True)
    expenses = relationship("Expense", cascade="all, delete-orphan", passive_deletes=True)
    tasks = relationship("Task", cascade="all, delete-orphan", passive_deletes=True)
    documents = relationship("Document", cascade="all, delete-orphan", passive_deletes=True)
    notes = relationship("Note", cascade="all, delete-orphan", passive_deletes=True)


class Work(Base):
    id = Column(String, primary_key=True, default=_uuid)
    property_id = Column(String, ForeignKey("property.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)
    date = Column(Date, nullable=True)
    cost = Column(Float, nullable=True)
    provider = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="done", server_default="done")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Expense(Base):
    id = Column(String, primary_key=True, default=_uuid)
    property_id = Column(String, ForeignKey("property.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)
    amount = Column(Float, nullable=False)
    frequency = Column(String(20), nullable=True)
    provider = Column(String(200), nullable=True)
    date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Task(Base):
    id = Column(String, primary_key=True, default=_uuid)
    property_id = Column(String, ForeignKey("property.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True)
    due_date = Column(Date, nullable=True)
    done = Column(Boolean, nullable=False, default=False, server_default=sa_false())
    priority = Column(String(20), nullable=True)
    estimated_cost = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Document(Base):
    id = Column(String, primary_key=True, default=_uuid)
    property_id = Column(String, ForeignKey("property.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    doc_type = Column(String(50), nullable=False)
    date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    original_filename = Column(String(255), nullable=True)
    # Nom de fichier aléatoire relatif à UPLOAD_DIR (jamais un chemin fourni par le client)
    stored_path = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    ai_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Note(Base):
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String, ForeignKey("property.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
