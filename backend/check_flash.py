import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

target = "models/gemini-1.5-flash"
found = False
for m in genai.list_models():
    if m.name == target or target in m.name:
        print(f"FOUND: {m.name}")
        found = True

if not found:
    print("NOT FOUND")
    print("Available:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
