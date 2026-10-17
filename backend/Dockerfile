# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Utilisateur non-root ; /app doit lui être inscriptible (cache disque .cache du proxy Overpass)
RUN useradd --system --create-home --uid 10001 bricq

# Copie du code
COPY --chown=bricq:bricq . .
RUN chown bricq:bricq /app && mkdir -p /app/uploads && chown bricq:bricq /app/uploads

# Documents déposés par les propriétaires (UPLOAD_DIR) : à monter sur un volume persistant,
# sinon ils sont perdus à chaque recréation du conteneur.
VOLUME ["/app/uploads"]

# Configuration pour que Python trouve bien nos modules
ENV PYTHONPATH=/app

USER bricq

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

# --proxy-headers + --forwarded-allow-ips="*" : uvicorn fait confiance à X-Forwarded-For de
# N'IMPORTE QUELLE source. L'API DOIT donc n'être joignable que derrière un reverse proxy de
# confiance (nginx, Traefik...), jamais exposée directement : sinon un client pourrait forger
# son IP et contourner l'anti brute-force. Si l'IP du proxy est fixe, la restreindre ici.
#
# Schéma de la base : l'API applique `alembic upgrade head` au démarrage (lifespan), y compris
# sur une base existante d'avant Alembic. Pour migrer dans une étape séparée :
# RUN_MIGRATIONS_ON_STARTUP=false puis `docker compose run --rm api alembic upgrade head`.
#
# --workers 1 (volontaire) : les limiteurs de débit (app/core/rate_limit.py) sont en mémoire
# par processus. Avec N workers, chaque limite serait multipliée par N.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips=*"]
