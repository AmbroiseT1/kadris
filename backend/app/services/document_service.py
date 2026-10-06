import base64
import json
import re
import logging
import google.generativeai as genai
from pydantic import TypeAdapter
from app.core.config import settings
from app.schemas.document import AnalyzedDocument, UnknownData

# Configuration de Google Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

logger = logging.getLogger(__name__)

async def analyze_document_with_ai(content: bytes, mime_type: str) -> AnalyzedDocument:
    # 1. Le fichier est déjà lu et validé (type, taille) par l'endpoint

    # 2. Choix du Modèle "Chirurgical"
    # On utilise gemini-2.0-flash comme demandé
    model_name = 'gemini-2.0-flash'
    model = genai.GenerativeModel(model_name)

    # 3. LE MEGA-PROMPT (Structure Forensique)
    prompt = """
    Rôle : Tu es un auditeur expert en documents immobiliers et comptables (Forensic Document Examiner).
    Ta réputation repose sur une précision de 100%. Tu ne devines jamais.
    
    TÂCHE : Analyse l'image du document fourni étape par étape pour identifier son TYPE et extraire ses DONNÉES.
    
    --- ÉTAPE 1 : ANALYSE DES INDICES VISUELS (SCAN) ---
    Cherche spécifiquement ces indices dans l'en-tête, le corps et le pied de page :
    - Mots clés explicites : "Facture", "Devis", "Taxe Foncière", "Assurance", "DPE", "Acte de Vente".
    - Mentions légales : "SIRET", "TVA Intracommunautaire", "Notaire", "Arrêté du".
    - Dates : Date d'émission, date d'échéance, date de validité, année d'imposition.
    
    --- ÉTAPE 2 : RÈGLES DE CLASSIFICATION STRICTES (PAR ÉLIMINATION) ---
    Utilise cette logique IMPÉRATIVE pour déterminer le 'detected_type' :
    
    1. **INVOICE (Facture)** :
       - DOIT contenir : Le mot "Facture" (ou Invoice).
       - INTERDIT : Les mots "Devis", "Proforma", "Bon de commande", "Proposition".
       - Indice : Cherche "A payer" ou une date de paiement.
       
    2. **QUOTE (Devis)** :
       - DOIT contenir : Le mot "Devis", "Proposition commerciale", "Estimation".
       - Indice : Mention "Bon pour accord", "Signature client", "Valable jusqu'au".
       
    3. **TAX_NOTICE (Avis d'Imposition)** :
       - DOIT contenir : "Avis d'impôt", "Taxe Foncière", "Taxe d'Habitation".
       - Indice : Logo "République Française" ou "Finances Publiques" en haut à gauche.
       
    4. **INSURANCE (Attestation Assurance)** :
       - DOIT contenir : "Attestation d'assurance", "Dispositions particulières", "Échéancier".
       - Indice : Nom d'une compagnie (AXA, Allianz, MAAF, etc.) et "Police N°" ou "Contrat N°".
       
    5. **PROPERTY_DEED (Acte de Propriété)** :
       - DOIT contenir : "Acte de vente", "Attestation de propriété immobilière".
       - Indice : Nom d'un notaire ("Maître..."), Sceau notarial, mentions de publication foncière.
       
    6. **DPE (Diagnostic Performance Énergétique)** :
       - DOIT contenir : "Consommation conventionnelle", "Estimation des coûts".
       - Indice : Graphique avec des lettres colorées (A, B, C...) ou mention "ADEME".

    Si le document ne correspond CLAIREMENT à aucune catégorie ci-dessus, classe-le en **UNKNOWN**.

    --- ÉTAPE 3 : EXTRACTION DES DONNÉES ---
    Une fois le type identifié, extrais les champs correspondants au schéma JSON.
    - Dates : Format strict YYYY-MM-DD. Si une date est ambiguë, cherche le contexte (ex: "Date d'effet" vs "Date d'émission").
    - Montants : Convertis en float (ex: "1 250,50 €" -> 1250.50). Ignore les symboles monétaires.
    - Pour 'artisan_nom' ou 'assureur' : Cherche le logo ou le nom en haut à gauche.
    - Pour 'DPE' : La lettre (A-G) est souvent en GRAS ou dans un encadré coloré.

    --- FORMAT DE RÉPONSE ---
    Réponds UNIQUEMENT par un objet JSON valide.
    Pas de texte avant ou après le JSON.
    """

    # 4. Configuration de Sécurité et Température
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]

    try:
        # 5. Appel API Google
        response = model.generate_content(
            [
                {'mime_type': mime_type, 'data': content},
                prompt
            ],
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0,
                "top_p": 0.95,
                "top_k": 40
            },
            safety_settings=safety_settings
        )

        # 6. Nettoyage et Parsing Robuste
        raw_text = response.text.strip()
        
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        
        raw_text = raw_text.strip()

        # 7. Validation Pydantic
        json_result = json.loads(raw_text)

        # Gestion du cas où Gemini renvoie une liste
        if isinstance(json_result, list):
            if len(json_result) > 0:
                json_result = json_result[0]
            else:
                return UnknownData(summary="L'IA a renvoyé une liste vide.")

        adapter = TypeAdapter(AnalyzedDocument)
        return adapter.validate_python(json_result)

    except json.JSONDecodeError:
        return UnknownData(summary="L'IA a renvoyé un format non-JSON. Impossible de lire les données.")
    except Exception:
        # Le détail technique reste dans les logs serveur, pas dans la réponse client
        logger.exception("Erreur lors de l'analyse Gemini")
        return UnknownData(summary="Erreur technique lors de l'analyse du document.")