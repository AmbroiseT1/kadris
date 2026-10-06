# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Configuration pour que Python trouve bien nos modules
ENV PYTHONPATH=/app

# IP(s) du reverse proxy autorisé à transmettre X-Forwarded-For (lu par uvicorn).
# Indispensable pour que l'anti brute-force voie la vraie IP du client.
ENV FORWARDED_ALLOW_IPS=127.0.0.1

# Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
