import base64
import json
from fastapi import UploadFile
import google.generativeai as genai
from app.core.config import settings
from app.schemas.document import AnalyzedDocument, UnknownData

# Configuration de Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

async def analyze_document_with_ai(file: UploadFile) -> AnalyzedDocument:
    # 1. Lecture et encodage
    content = await file.read()
    mime_type = file.content_type or "image/jpeg"
    
    # Gemini accepte directement les bytes pour les images/PDF dans certaines versions,
    # mais l'approche standard est souvent de passer l'objet Part ou le contenu encodé.
    # Pour simplifier et être robuste, on va utiliser l'encodage standard ou l'objet Blob si supporté.
    # Ici, on va utiliser le dictionnaire standard pour le contenu inline.
    
    document_part = {
        "mime_type": mime_type,
        "data": content
    }

    # 2. Configuration du modèle avec Structured Output
    # Gemini 1.5 Flash est rapide et économique
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": AnalyzedDocument
        }
    )

    # 3. Prompt Système & Utilisateur
    prompt = """
    Tu es un expert en audit immobilier. 
    Analyse le document fourni, classifie-le parmi les types autorisés (INVOICE, QUOTE, INSURANCE, TAX_NOTICE, PROPERTY_DEED, DPE) 
    et extrais les données correspondantes selon le schéma défini.
    Si le document ne correspond à aucune catégorie précise, classe-le en UNKNOWN avec un résumé.
    """

    # 4. Appel Gemini
    try:
        response = model.generate_content([prompt, document_part])
        
        # Le résultat est déjà une chaîne JSON valide grâce au response_mime_type
        json_result = response.text
        
        # On parse pour valider avec Pydantic (double sécurité)
        parsed_result = AnalyzedDocument.model_validate_json(json_result)
        return parsed_result

    except Exception as e:
        print(f"Erreur IA (Gemini): {e}")
        return UnknownData(summary="Erreur technique lors de l'analyse avec Gemini.")
