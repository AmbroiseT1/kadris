from enum import Enum
from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field
from datetime import date

class DocumentType(str, Enum):
    INVOICE = "INVOICE"
    QUOTE = "QUOTE"
    INSURANCE = "INSURANCE"
    TAX_NOTICE = "TAX_NOTICE"
    PROPERTY_DEED = "PROPERTY_DEED"
    DPE = "DPE"
    UNKNOWN = "UNKNOWN"

class InvoiceData(BaseModel):
    detected_type: Literal[DocumentType.INVOICE] = DocumentType.INVOICE
    montant_ttc: float = Field(..., description="Montant total TTC de la facture")
    artisan_nom: str = Field(..., description="Nom de l'entreprise ou de l'artisan")
    date_facture: Optional[date] = Field(None, description="Date d'émission de la facture")
    description_travaux: Optional[str] = Field(None, description="Brève description des travaux")

class QuoteData(BaseModel):
    detected_type: Literal[DocumentType.QUOTE] = DocumentType.QUOTE
    montant_total: float = Field(..., description="Montant total du devis")
    artisan_nom: str = Field(..., description="Nom de l'artisan")
    validite_date: Optional[date] = Field(None, description="Date de fin de validité")

class TaxData(BaseModel):
    detected_type: Literal[DocumentType.TAX_NOTICE] = DocumentType.TAX_NOTICE
    annee: int = Field(..., description="Année d'imposition")
    montant_total: float = Field(..., description="Montant à payer")
    type_taxe: Literal["FONCIERE", "HABITATION", "ORDURES_MENAGERES"] = Field(..., description="Type de taxe")

class InsuranceData(BaseModel):
    detected_type: Literal[DocumentType.INSURANCE] = DocumentType.INSURANCE
    assureur: str = Field(..., description="Nom de la compagnie d'assurance")
    numero_contrat: str = Field(..., description="Numéro du contrat")
    date_echeance: Optional[date] = Field(None, description="Date d'échéance")

class PropertyDeedData(BaseModel):
    detected_type: Literal[DocumentType.PROPERTY_DEED] = DocumentType.PROPERTY_DEED
    notaire_nom: Optional[str] = Field(None, description="Nom du notaire")
    date_acte: Optional[date] = Field(None, description="Date de signature")
    prix_acquisition: Optional[float] = None

class DPEData(BaseModel):
    detected_type: Literal[DocumentType.DPE] = DocumentType.DPE
    classe_energetique: Literal["A", "B", "C", "D", "E", "F", "G"] = Field(..., description="Étiquette énergie")
    classe_ges: Literal["A", "B", "C", "D", "E", "F", "G"] = Field(..., description="Étiquette GES")

class UnknownData(BaseModel):
    detected_type: Literal[DocumentType.UNKNOWN] = DocumentType.UNKNOWN
    summary: str = Field(..., description="Résumé du contenu non identifié")

AnalyzedDocument = Union[
    InvoiceData, QuoteData, TaxData, InsuranceData, PropertyDeedData, DPEData, UnknownData
]
