import google.generativeai as genai
import os
# On charge les variables manuellement pour ce script de test simple
from dotenv import load_dotenv

# Charge le .env local
load_dotenv()

# Adaptation : On cherche GEMINI_API_KEY car c'est le nom qu'on a défini dans le .env
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("ERREUR: Pas de clé API trouvée dans .env (Cherché GEMINI_API_KEY et GOOGLE_API_KEY)")
else:
    genai.configure(api_key=api_key)
    print(f"Clé utilisée : {api_key[:5]}...{api_key[-4:]}")
    print("\n--- Modèles disponibles pour toi ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Nom: {m.name}")
    except Exception as e:
        print(f"Erreur de connexion : {e}")
