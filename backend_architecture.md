# Architecture Backend & Service IA (VPS)

## 1. Stratégie VPS & Données (DVF)

### Validation du choix
L'utilisation d'un VPS est **excellente** et recommandée pour votre cas d'usage, pour deux raisons principales :
1.  **Volume de données (DVF)** : Les bases DVF (2020-2024) contiennent des millions de lignes. Les services managés (Supabase Cloud, Neon, etc.) deviennent vite coûteux pour ce volume de stockage et d'I/O. Un VPS avec un disque NVMe sera beaucoup plus performant à coût fixe.
2.  **Traitements Lourds** : L'ingestion, le nettoyage et le croisement géospatial (PostGIS) demandent de la puissance CPU/RAM que vous contrôlez mieux sur un VPS.

### Recommandation Technique
Au lieu d'utiliser Supabase Cloud, déployez une stack **Docker** sur votre VPS contenant :
*   **PostgreSQL + PostGIS** : Pour la base de données.
*   **FastAPI (Python)** : Pour le backend et l'API IA. Python est le langage roi pour la data et l'IA (Pydantic, Pandas, etc.).
*   **Nginx / Traefik** : Comme reverse proxy pour sécuriser l'accès.

---

## 2. Service "DocumentAnalyzer" (Correction & Optimisation)

Votre approche est très bonne, mais je propose une **optimisation majeure** :
Ne faites pas 2 étapes (Classification PUIS Extraction). Les LLM modernes (GPT-4o, Gemini 1.5) sont capables de faire les deux en **une seule passe** grâce au "Structured Output" polymorphique.

Cela réduit la latence de 50% et le coût de 50%.

### Stack Recommandée
*   **Framework** : FastAPI
*   **Validation** : Pydantic v2
*   **LLM Client** : `openai` (ou `instructor` pour une gestion encore plus fine des types).

### Implémentation Détaillée

Voici la structure de code corrigée et optimisée pour votre backend Python.

#### A. Schémas Pydantic (`schemas.py`)

Nous utilisons `Literal` pour le discriminant (le champ qui permet au frontend de savoir de quel type il s'agit instantanément).

```python
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

# --- Modèles Spécifiques ---

class InvoiceData(BaseModel):
    detected_type: Literal[DocumentType.INVOICE] = DocumentType.INVOICE
    montant_ttc: float = Field(..., description="Montant total TTC de la facture")
    artisan_nom: str = Field(..., description="Nom de l'entreprise ou de l'artisan")
    date_facture: Optional[date] = Field(None, description="Date d'émission de la facture")
    description_travaux: Optional[str] = Field(None, description="Brève description des travaux ou services")

class QuoteData(BaseModel):
    detected_type: Literal[DocumentType.QUOTE] = DocumentType.QUOTE
    montant_total: float = Field(..., description="Montant total du devis")
    artisan_nom: str = Field(..., description="Nom de l'artisan")
    validite_date: Optional[date] = Field(None, description="Date de fin de validité du devis")

class TaxData(BaseModel):
    detected_type: Literal[DocumentType.TAX_NOTICE] = DocumentType.TAX_NOTICE
    annee: int = Field(..., description="Année d'imposition")
    montant_total: float = Field(..., description="Montant à payer")
    type_taxe: Literal["FONCIERE", "HABITATION", "ORDURES_MENAGERES"] = Field(..., description="Type de taxe")
    adresse_bien: Optional[str] = Field(None, description="Adresse du bien concerné")

class InsuranceData(BaseModel):
    detected_type: Literal[DocumentType.INSURANCE] = DocumentType.INSURANCE
    assureur: str = Field(..., description="Nom de la compagnie d'assurance")
    numero_contrat: str = Field(..., description="Numéro du contrat ou de la police")
    date_echeance: Optional[date] = Field(None, description="Date de fin de validité ou d'échéance")
    montant_annuel: Optional[float] = None

class PropertyDeedData(BaseModel):
    detected_type: Literal[DocumentType.PROPERTY_DEED] = DocumentType.PROPERTY_DEED
    notaire_nom: Optional[str] = Field(None, description="Nom du notaire ou de l'étude")
    date_acte: Optional[date] = Field(None, description="Date de signature de l'acte")
    reference_cadastrale: List[str] = Field(default_factory=list, description="Liste des références cadastrales mentionnées")
    prix_acquisition: Optional[float] = None

class DPEData(BaseModel):
    detected_type: Literal[DocumentType.DPE] = DocumentType.DPE
    classe_energetique: Literal["A", "B", "C", "D", "E", "F", "G"] = Field(..., description="Étiquette énergie")
    classe_ges: Literal["A", "B", "C", "D", "E", "F", "G"] = Field(..., description="Étiquette GES")
    estimation_cout_annuel: Optional[float] = Field(None, description="Estimation des coûts annuels d'énergie")

class UnknownData(BaseModel):
    detected_type: Literal[DocumentType.UNKNOWN] = DocumentType.UNKNOWN
    summary: str = Field(..., description="Résumé succinct du contenu du document non identifié")

# --- Union Polymorphique ---
# C'est ce type que l'API renverra. Le champ 'detected_type' servira de discriminant.
AnalyzedDocument = Union[
    InvoiceData, 
    QuoteData, 
    TaxData, 
    InsuranceData, 
    PropertyDeedData, 
    DPEData, 
    UnknownData
]
```

#### B. Service d'Analyse (`service.py`)

Utilisation de l'API OpenAI avec `response_format` (Structured Outputs) pour garantir le schéma.

```python
import base64
from fastapi import UploadFile, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from .schemas import AnalyzedDocument, DocumentType

client = OpenAI(api_key="sk-...")

class DocumentAnalyzerService:
    async def analyze_document(self, file: UploadFile) -> AnalyzedDocument:
        # 1. Encodage de l'image/PDF en base64
        content = await file.read()
        base64_image = base64.b64encode(content).decode('utf-8')
        
        # Détection basique du mime type pour l'API
        mime_type = file.content_type or "image/jpeg"

        # 2. Appel LLM "Single-Pass" (Classification + Extraction)
        try:
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-2024-08-06", # Modèle optimisé pour le structured output
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Tu es un expert en audit immobilier. "
                            "Analyse le document fourni (image ou PDF). "
                            "Identifie son type parmi les catégories autorisées et extrais les données correspondantes. "
                            "Si le document ne correspond à aucune catégorie précise, classe-le en UNKNOWN avec un résumé."
                        )
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format=AnalyzedDocument, # MAGIE : Pydantic fait tout le travail
            )

            result = completion.choices[0].message.parsed
            return result

        except Exception as e:
            print(f"Erreur analyse IA: {e}")
            # Fallback en cas d'erreur grave
            from .schemas import UnknownData
            return UnknownData(summary="Erreur lors de l'analyse du document.")

```

### 3. Intégration Frontend (Next.js)

Côté Next.js, vous recevrez un JSON. Grâce au champ `detected_type`, vous pourrez afficher le bon composant dynamiquement.

```typescript
// Exemple conceptuel Frontend
const handleAnalysis = async (file) => {
  const result = await api.analyze(file); // Retourne AnalyzedDocument
  
  switch (result.detected_type) {
    case 'INVOICE':
      return <InvoiceForm initialData={result} />;
    case 'DPE':
      return <DPEForm initialData={result} />;
    case 'UNKNOWN':
      return <Alert>Document non reconnu : {result.summary}</Alert>;
    // ...
  }
}
```

## Résumé des Next Steps pour vous

1.  **VPS** : Installez Docker et lancez un conteneur PostgreSQL avec l'extension PostGIS.
2.  **Backend** : Initialisez un projet FastAPI (`pip install fastapi uvicorn openai pydantic`).
3.  **Code** : Copiez les schémas ci-dessus dans votre projet FastAPI.
4.  **Test** : Créez une route `POST /analyze` qui appelle `DocumentAnalyzerService`.
