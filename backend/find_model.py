import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

found = False
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        if 'flash' in m.name:
            print(f"MODEL:{m.name}")
            found = True
            break

if not found:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"MODEL:{m.name}")
            break
