# Journal de Déploiement - Projet Kadris (Architecture V2)
**Date de dernière mise à jour :** 1er Décembre 2025
**Infrastructure :** VPS OVH (Ubuntu 24.04)
**Stack :** Docker, Python (FastAPI), PostgreSQL (PostGIS), Redis.

## 1. 🏗️ Architecture Mise en Place
Nous sommes passés d'une architecture Frontend-only à une architecture Backend auto-hébergée.

*   **Base de Données :** PostgreSQL 15 + Extension PostGIS (Géolocalisation).
*   **Backend API :** Python avec FastAPI (Port 8000).
*   **ETL Worker :** Conteneur Python dédié aux tâches de fond (Import données).
*   **Cache :** Redis (Port 6379).
*   **Administration :** Adminer (Interface Web pour la BDD sur le port 8080).

## 2. 📂 Structure des Fichiers sur le VPS (/opt/kadris)

```plaintext
/opt/kadris/
├── backend/
│   ├── Dockerfile            # Définition de l'image Python
│   ├── requirements.txt      # Librairies (fastapi, pandas, sqlalchemy...)
│   ├── main.py               # Point d'entrée de l'API (Hello World)
│   └── import_dvf.py         # Script d'import DVF (Ancienne méthode)
├── data/
│   ├── postgres/             # Stockage persistant de la BDD
│   ├── redis/                # Stockage du cache
│   └── ingestion/            # Zone tampon pour les fichiers (CSV, SQL...)
└── docker-compose.yml        # Orchestration des services
```

## 3. ⚙️ Configurations Finales (Fonctionnelles)

### A. Le docker-compose.yml (Version Stable)
*Note : Mot de passe en dur pour simplifier le dev, Worker stabilisé avec tail -f.*

```yaml
services:
  # --- Base de données PostGIS ---
  postgres:
    image: postgis/postgis:15-3.3
    container_name: kadris_postgres
    environment:
      POSTGRES_DB: kadris_data
      POSTGRES_USER: kadris
      POSTGRES_PASSWORD: <MOT_DE_PASSE_POSTGRES>
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - kadris_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kadris -d kadris_data"]
      interval: 10s
      timeout: 5s
      retries: 5

  # --- Cache Redis ---
  redis:
    image: redis:7-alpine
    container_name: kadris_redis
    networks:
      - kadris_network
    restart: unless-stopped

  # --- Backend / API FastAPI ---
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kadris_backend
    command: uvicorn main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    networks:
      - kadris_network
    environment:
      DATABASE_URL: postgresql://kadris:<MOT_DE_PASSE_POSTGRES>@postgres/kadris_data
    depends_on:
      postgres:
        condition: service_healthy
    restart: always

  # --- Worker ETL (Ingestion) ---
  etl_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kadris_etl_worker
    command: tail -f /dev/null  # Maintenu en vie artificiellement
    volumes:
      - ./backend:/app
      - ./data/ingestion:/app/data
    networks:
      - kadris_network
    environment:
      DATABASE_URL: postgresql://kadris:<MOT_DE_PASSE_POSTGRES>@postgres/kadris_data
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # --- Interface Admin ---
  adminer:
    image: adminer
    container_name: kadris_adminer
    ports:
      - "8080:8080"
    networks:
      - kadris_network
    depends_on:
      - postgres

networks:
  kadris_network:
    driver: bridge
```

### B. Le Dockerfile (Backend & Worker)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
```

### C. Le requirements.txt

```plaintext
fastapi
uvicorn
psycopg2-binary
sqlalchemy
geoalchemy2
requests
pandas
```

## 4. 📜 Historique des Actions & Résolutions

### Phase 1 : Initialisation & Docker
*   **Problème :** Permissions Docker refusées (`dial unix /var/run/docker.sock: permission denied`).
*   **Solution :** Ajout de l'utilisateur au groupe : `sudo usermod -aG docker ubuntu` + Reconnexion SSH.
*   **Problème :** Base de données redémarrait en boucle (Restarting).
*   **Cause :** Conflit de volume (fichiers corrompus par root) et variable mot de passe non lue.
*   **Solution :** Nettoyage radical (`sudo rm -rf ./data/postgres/*`), passage du mot de passe en dur dans le YAML, utilisation de `--remove-orphans`.

### Phase 2 : Ingestion DVF "Brute" (Succès)
*   **Script :** Création d'un script Python (`import_dvf.py`) pour télécharger et ingérer les CSV de data.gouv.fr.
*   **Problème :** Erreur 403/404 lors du téléchargement automatique.
*   **Solution :** Ajout de "Headers" HTTP (User-Agent) pour simuler un navigateur web.
*   **Résultat :** Importation réussie de 16 millions de transactions (Années 2014 à 2024) dans la table `dvf_transactions`.

### Phase 3 : Transition vers DVF+ (En cours)
*   **Découverte :** Identification de la source DVF+ (Cerema), qui fournit des données SQL nettoyées et structurées (mieux que notre import brut).
*   **Stratégie :** Conserver l'ancien import temporairement, créer une nouvelle base `kadris_dvfplus`, et y injecter le dump SQL.
*   **Transfert des fichiers (Le défi) :**
    *   `scp` depuis le domicile : Trop lent, échec.
    *   `wget` lien direct : Échec (Box protège ses liens, téléchargement de pages HTML par erreur).
*   **Solution retenue :** Transfert via FileZilla (SFTP) depuis une connexion Fibre rapide.
*   **Préparation FileZilla :**
    *   Création dossier : `sudo mkdir -p /opt/kadris/data/ingestion`
    *   Attribution des droits : `sudo chown -R ubuntu:ubuntu /opt/kadris/data/ingestion`

## 5. 🚦 État Actuel & Prochaines Étapes

### État Actuel (Au moment de la pause)
*   **Serveur :** Propre. Le dossier `/opt/kadris/data/ingestion` a été vidé des fichiers corrompus.
*   **Infrastructure :** Tous les conteneurs (DB, API, Worker) sont Up et stables.
*   **Données :** La base contient les données brutes (DVF 2014-2024), mais nous allons basculer sur DVF+.

### À Faire (To-Do List)
1.  **Transfert DVF+ :** Utiliser FileZilla avec une connexion Fibre pour envoyer les fichiers SQL (.7z ou .sql) dans `/opt/kadris/data/ingestion`.
2.  **Création Base DVF+ :**
    ```bash
    sudo docker compose exec postgres createdb -U kadris kadris_dvfplus
    sudo docker compose exec postgres psql -U kadris -d kadris_dvfplus -c "CREATE EXTENSION postgis;"
    ```
3.  **Import SQL :**
    ```bash
    # Si fichier compressé .gz
    zcat data/ingestion/fichier.sql.gz | sudo docker compose exec -T postgres psql -U kadris -d kadris_dvfplus
    # Si fichier standard .sql
    sudo docker compose exec -T postgres psql -U kadris -d kadris_dvfplus < data/ingestion/fichier.sql
    ```
4.  **Basculer l'API :** Modifier `DATABASE_URL` dans le `docker-compose.yml` pour pointer vers `kadris_dvfplus`.
5.  **Nettoyage :** Supprimer l'ancienne base et les fichiers d'ingestion pour libérer l'espace disque.

## 🛠️ Commandes Utiles (Anti-sèche)

*   **Voir les conteneurs :** `sudo docker compose ps`
*   **Relancer tout proprement :** `sudo docker compose up -d --remove-orphans`
*   **Voir les logs du worker :** `sudo docker compose logs -f etl_worker`
*   **Entrer dans la BDD (SQL) :** `sudo docker compose exec postgres psql -U kadris -d kadris_data`
*   **Lancer une commande dans le worker :** `sudo docker compose exec etl_worker python mon_script.py`
