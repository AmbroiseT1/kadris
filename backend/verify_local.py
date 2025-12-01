import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

models_to_test = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-pro']

for m_name in models_to_test:
    try:
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS: {m_name}")
        break
    except Exception as e:
        print(f"FAILED: {m_name} - {e}")
