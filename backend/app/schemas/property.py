import json
import datetime as dt
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

OwnershipStatus = Literal["pending", "verified", "rejected"]

# Taille max de l'instantané bâtiment (JSON sérialisé)
MAX_BUILDING_DATA_BYTES = 100_000


def _check_json_size(v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if v is not None and len(json.dumps(v, default=str)) > MAX_BUILDING_DATA_BYTES:
        raise ValueError("building_data trop volumineux")
    return v


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Biens -------------------------------------------------------------------

class PropertyFields(BaseModel):
    address_label: str = Field(min_length=1, max_length=500)
    cle_interop: Optional[str] = Field(None, max_length=64)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    code_insee: Optional[str] = Field(None, max_length=10)
    building_data: Optional[Dict[str, Any]] = None

    @field_validator("building_data")
    @classmethod
    def _building_data_size(cls, v):
        return _check_json_size(v)


class PropertyUpdate(BaseModel):
    """Champs modifiables par le propriétaire (le statut de propriété est réservé aux admins)."""
    address_label: Optional[str] = Field(None, min_length=1, max_length=500)
    cle_interop: Optional[str] = Field(None, max_length=64)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    code_insee: Optional[str] = Field(None, max_length=10)
    building_data: Optional[Dict[str, Any]] = None

    @field_validator("building_data")
    @classmethod
    def _building_data_size(cls, v):
        return _check_json_size(v)


class PropertyOut(ORMModel):
    id: str
    user_id: str
    address_label: str
    cle_interop: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    code_insee: Optional[str] = None
    building_data: Optional[Dict[str, Any]] = None
    ownership_status: OwnershipStatus
    ownership_comment: Optional[str] = None
    has_ownership_proof: bool = False
    created_at: dt.datetime


class OwnershipDecision(BaseModel):
    status: Literal["verified", "rejected"]
    comment: Optional[str] = Field(None, max_length=1000)


class ProofDocumentRef(ORMModel):
    id: str
    title: str
    original_filename: Optional[str] = None
    mime_type: str
    size: int
    created_at: dt.datetime


class AdminPropertyOut(PropertyOut):
    owner_email: str
    proof_documents: List[ProofDocumentRef] = []


# --- Travaux -----------------------------------------------------------------

WorkStatus = Literal["planned", "in_progress", "done"]


class WorkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    date: Optional[dt.date] = None
    cost: Optional[float] = Field(None, ge=0, le=1e9)
    provider: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    status: WorkStatus = "done"


class WorkUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    date: Optional[dt.date] = None
    cost: Optional[float] = Field(None, ge=0, le=1e9)
    provider: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[WorkStatus] = None


class WorkOut(ORMModel):
    id: str
    property_id: str
    title: str
    category: Optional[str] = None
    date: Optional[dt.date] = None
    cost: Optional[float] = None
    provider: Optional[str] = None
    description: Optional[str] = None
    status: str
    created_at: dt.datetime


# --- Charges -----------------------------------------------------------------

class ExpenseCreate(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    amount: float = Field(ge=0, le=1e9)
    frequency: Optional[Literal["mensuel", "annuel", "ponctuel"]] = None
    provider: Optional[str] = Field(None, max_length=200)
    date: Optional[dt.date] = None


class ExpenseUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    amount: Optional[float] = Field(None, ge=0, le=1e9)
    frequency: Optional[Literal["mensuel", "annuel", "ponctuel"]] = None
    provider: Optional[str] = Field(None, max_length=200)
    date: Optional[dt.date] = None


class ExpenseOut(ORMModel):
    id: str
    property_id: str
    label: str
    category: Optional[str] = None
    amount: float
    frequency: Optional[str] = None
    provider: Optional[str] = None
    date: Optional[dt.date] = None
    created_at: dt.datetime


# --- Tâches ------------------------------------------------------------------

TaskPriority = Literal["BASSE", "MOYENNE", "URGENTE"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    due_date: Optional[dt.date] = None
    done: bool = False
    priority: Optional[TaskPriority] = None
    estimated_cost: Optional[float] = Field(None, ge=0, le=1e9)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    due_date: Optional[dt.date] = None
    done: Optional[bool] = None
    priority: Optional[TaskPriority] = None
    estimated_cost: Optional[float] = Field(None, ge=0, le=1e9)


class TaskOut(ORMModel):
    id: str
    property_id: str
    title: str
    category: Optional[str] = None
    due_date: Optional[dt.date] = None
    done: bool
    priority: Optional[str] = None
    estimated_cost: Optional[float] = None
    created_at: dt.datetime


# --- Documents ---------------------------------------------------------------

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    doc_type: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[dt.date] = None
    description: Optional[str] = Field(None, max_length=5000)


class DocumentOut(ORMModel):
    """Le chemin de stockage n'est jamais exposé : téléchargement via /download uniquement."""
    id: str
    property_id: str
    title: str
    doc_type: str
    date: Optional[dt.date] = None
    description: Optional[str] = None
    original_filename: Optional[str] = None
    mime_type: str
    size: int
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: dt.datetime


# --- Notes -------------------------------------------------------------------

MAX_NOTE_LENGTH = 20_000


class NoteCreate(BaseModel):
    property_id: Optional[str] = None
    content: str = Field("", max_length=MAX_NOTE_LENGTH)


class NoteUpdate(BaseModel):
    content: str = Field(max_length=MAX_NOTE_LENGTH)


class NoteOut(ORMModel):
    id: str
    property_id: Optional[str] = None
    content: str
    updated_at: dt.datetime
