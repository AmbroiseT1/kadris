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
    montant_ttc: Optional[float] = Field(None, description="Montant total TTC de la facture")
    artisan_nom: Optional[str] = Field(None, description="Nom de l'entreprise ou de l'artisan")
    date_facture: Optional[date] = Field(None, description="Date d'émission de la facture")
    description_travaux: Optional[str] = Field(None, description="Brève description des travaux")

class QuoteData(BaseModel):
    detected_type: Literal[DocumentType.QUOTE] = DocumentType.QUOTE
    montant_total: Optional[float] = Field(None, description="Montant total du devis")
    artisan_nom: Optional[str] = Field(None, description="Nom de l'artisan")
    validite_date: Optional[date] = Field(None, description="Date de fin de validité")

class TaxData(BaseModel):
    detected_type: Literal[DocumentType.TAX_NOTICE] = DocumentType.TAX_NOTICE
    annee: Optional[int] = Field(None, description="Année d'imposition")
    montant_total: Optional[float] = Field(None, description="Montant à payer")
    type_taxe: Optional[Literal["FONCIERE", "HABITATION", "ORDURES_MENAGERES"]] = Field(None, description="Type de taxe")

class InsuranceData(BaseModel):
    detected_type: Literal[DocumentType.INSURANCE] = DocumentType.INSURANCE
    assureur: Optional[str] = Field(None, description="Nom de la compagnie d'assurance")
    numero_contrat: Optional[str] = Field(None, description="Numéro du contrat")
    date_echeance: Optional[date] = Field(None, description="Date d'échéance")

class PropertyDeedData(BaseModel):
    detected_type: Literal[DocumentType.PROPERTY_DEED] = DocumentType.PROPERTY_DEED
    notaire_nom: Optional[str] = Field(None, description="Nom du notaire")
    date_acte: Optional[date] = Field(None, description="Date de signature")
    prix_acquisition: Optional[float] = None

class DPEData(BaseModel):
    detected_type: Literal[DocumentType.DPE] = DocumentType.DPE
    classe_energetique: Optional[Literal["A", "B", "C", "D", "E", "F", "G"]] = Field(None, description="Étiquette énergie")
    classe_ges: Optional[Literal["A", "B", "C", "D", "E", "F", "G"]] = Field(None, description="Étiquette GES")

class UnknownData(BaseModel):
    detected_type: Literal[DocumentType.UNKNOWN] = DocumentType.UNKNOWN
    summary: Optional[str] = Field(None, description="Résumé du contenu non identifié")

AnalyzedDocument = Union[
    InvoiceData, QuoteData, TaxData, InsuranceData, PropertyDeedData, DPEData, UnknownData
]
