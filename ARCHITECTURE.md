# Architecture Kadris - Documentation Technique

## 📋 Vue d'Ensemble

Kadris est une application Next.js 14 (App Router) qui fournit des rapports immobiliers détaillés et un espace propriétaire. L'application utilise actuellement une architecture **frontend-only** avec des appels directs à des APIs publiques.

## 🏗️ Architecture Frontend

### Structure des Dossiers

```
brique-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Page d'accueil
│   ├── login/                    # Authentification
│   ├── properties/               # Gestion des biens
│   │   └── add/                  # Ajout de bien
│   ├── dashboard/                # Dashboard propriétaire
│   └── report/[cityCode]/        # Rapport immobilier public
│
├── components/
│   ├── dashboard/                # Composants dashboard propriétaire
│   │   ├── OwnerDashboardPage.tsx    # Page principale
│   │   ├── DetailDrawer.tsx          # Panneau latéral
│   │   ├── TechnicalNavBar.tsx       # Navigation
│   │   ├── ArchitecturalViewer.tsx   # Vue 3D
│   │   └── widgets/                  # Widgets dashboard
│   │
│   ├── report/                   # Composants rapport public
│   │   ├── TabSynthese.tsx          # Vue d'ensemble
│   │   ├── TabBatiment.tsx          # Données bâtiment
│   │   ├── TabDVF.tsx               # Transactions DVF
│   │   ├── TabQuartier.tsx          # Quartier & POIs
│   │   ├── TabRisks.tsx             # Risques naturels
│   │   ├── TabUrbanisme.tsx         # Urbanisme
│   │   └── TabAnalysis.tsx          # Analyse IA
│   │
│   └── ui/                       # Composants UI réutilisables
│
├── app/lib/                      # Logique métier & API
│   ├── bdnb.ts                   # API BDNB (données bâtiment)
│   ├── dvf.ts                    # API DVF (transactions)
│   ├── georisques.ts             # API Géorisques (risques)
│   ├── quartier.ts               # API Overpass (POIs)
│   ├── dpe.ts                    # API DPE (énergétique)
│   ├── eau.ts                    # API qualité eau
│   ├── urbanisme.ts              # API GPU (urbanisme)
│   └── types.ts                  # Types TypeScript
│
└── utils/
    └── propertyStorage.ts        # Gestion localStorage (utilisateurs/biens)
```

## 🔌 APIs Externes Utilisées

### 1. **API BDNB** (Base de Données Nationale des Bâtiments)
- **Endpoint**: `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse`
- **Usage**: Données structurelles du bâtiment
- **Données fournies**:
  - Métadonnées: adresse, année construction, usage
  - Matériaux: murs, toiture, menuiserie
  - Dimensions: surface, hauteur, nombre de niveaux
  - Énergétique: DPE estimé
  - Géolocalisation: coordonnées Lambert 93
- **Fichier**: `app/lib/bdnb.ts`
- **Authentification**: Aucune (API publique)

### 2. **API DVF** (Demandes de Valeurs Foncières)
- **Endpoint**: `https://api.cquest.org/dvf`
- **Usage**: Transactions immobilières dans un rayon de 500m
- **Données fournies**:
  - Prix de vente
  - Date de transaction
  - Surface habitable et terrain
  - Type de bien
  - Nombre de pièces
- **Fichier**: `app/lib/dvf.ts`
- **Authentification**: Aucune

### 3. **API Géorisques**
- **Endpoints multiples**:
  - Argiles: `https://www.georisques.gouv.fr/api/v1/gaspar/alea/`
  - Radon: `https://www.georisques.gouv.fr/api/v1/radon`
  - Inondations: `https://www.georisques.gouv.fr/api/v1/`
  - PDF ERP: `https://errial.georisques.gouv.fr/pdf`
- **Usage**: Risques naturels et technologiques
- **Fichier**: `app/lib/georisques.ts`
- **Authentification**: Aucune

### 4. **API Overpass** (OpenStreetMap)
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Usage**: Points d'intérêt dans un rayon de 500m
- **Données fournies**:
  - Transports: métro, bus, tram
  - Commerces: alimentation, restaurants
  - Santé: médecins, pharmacies
  - Éducation: écoles, crèches
  - Loisirs: parcs, sports
- **Fichier**: `app/lib/quartier.ts`
- **Authentification**: Aucune

### 5. **API ADEME DPE**
- **Endpoint**: `https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants/lines`
- **Usage**: DPE réels des logements
- **Fichier**: `app/lib/dpe.ts`
- **Authentification**: Aucune

### 6. **API Qualité de l'Eau**
- **Endpoint**: `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/`
- **Usage**: Conformité de l'eau potable
- **Fichier**: `app/lib/eau.ts`
- **Authentification**: Aucune

### 7. **API GPU** (Géoportail de l'Urbanisme)
- **Endpoint**: `https://www.geoportail-urbanisme.gouv.fr/api/document/`
- **Usage**: Documents d'urbanisme (PLU, SCOT)
- **Fichier**: `app/lib/urbanisme.ts`
- **Authentification**: Aucune

### 8. **API BAN** (Base Adresse Nationale)
- **Endpoint**: `https://api-adresse.data.gouv.fr/search/`
- **Usage**: Géocodage d'adresses
- **Fichier**: Utilisé dans les composants de saisie
- **Authentification**: Aucune

## 💾 Système de Données Local

### LocalStorage Structure

```typescript
// Utilisateur actuel
localStorage.setItem('currentUser', 'user@email.com');

// Biens par utilisateur
{
  "userProperties": {
    "user@email.com": [
      {
        "id": "unique-id",
        "claimedAt": "2024-01-23T10:30:00.000Z",
        "data": {
          "adresse_ban": "...",
          "coords": { "lat": 48.8566, "lon": 2.3522 },
          "cle_interop": "...",
          // ... autres données BDNB
        }
      }
    ]
  }
}
```

### Fichier de Gestion
- **Fichier**: `utils/propertyStorage.ts`
- **Fonctions clés**:
  - `getCurrentUser()`: Récupère l'utilisateur connecté
  - `setCurrentUser(email)`: Définit l'utilisateur actuel
  - `addPropertyToCurrentUser(propertyData)`: Ajoute un bien
  - `getCurrentUserProperties()`: Liste des biens de l'utilisateur
  - `isAdminUser(email)`: Vérifie si admin (bypass)

## 🔄 Flux de Données

### 1. Page Rapport Public (`/report/[cityCode]`)

```mermaid
graph TD
    A[Utilisateur entre adresse] --> B[API BAN: Géocodage]
    B --> C[cle_interop_adr]
    C --> D[API BDNB: Données bâtiment]
    D --> E[Coordonnées GPS]
    E --> F{Promise.all}
    F --> G[API DVF]
    F --> H[API Géorisques]
    F --> I[API Overpass]
    F --> J[API DPE]
    F --> K[API Eau]
    F --> L[API Urbanisme]
    G & H & I & J & K & L --> M[Rendu Composants Tab*]
```

### 2. Dashboard Propriétaire (`/dashboard`)

```mermaid
graph TD
    A[Connexion utilisateur] --> B[localStorage: currentUser]
    B --> C[Charger biens de l'utilisateur]
    C --> D[Sélection bien actif]
    D --> E[Données BDNB + coords]
    E --> F{Promise.all}
    F --> G[API DVF]
    F --> H[API Géorisques]
    F --> I[API Quartier]
    G & H & I --> J[Mise à jour propertyData]
    J --> K[Rendu DetailDrawer avec Tab*]
```

## 🎨 Composants Clés

### Dashboard Propriétaire

#### `OwnerDashboardPage.tsx`
- **Rôle**: Conteneur principal du dashboard
- **État géré**:
  - `propertyData`: Données du bien actif
  - `dvfData`: Transactions DVF
  - `loadingDVF`: État de chargement
  - `activeCategory`: Catégorie active
- **Fonctions**:
  - `useEffect`: Charge les données à l'ouverture
  - `Promise.all`: Charge DVF + Risques + Quartier en parallèle

#### `DetailDrawer.tsx`
- **Rôle**: Panneau latéral affichant les détails
- **Props**:
  - `propertyData`: Données du bien
  - `dvfData`: Transactions
  - `loadingDVF`: État chargement
  - `documents`, `onAddDocument`: Gestion documents
- **Composants rendus selon catégorie**:
  - `overview` → `TabSynthese`
  - `market` → `TabDVF`
  - `neighborhood` → `TabQuartier`
  - `risks` → `TabRisks`
  - `works` → `SmartActionPlan` + `TimelineFeed`
  - `documents` → `DocumentsVault`

#### `TechnicalNavBar.tsx`
- **Rôle**: Navigation entre catégories
- **Dimensions**: 80px hauteur, 6 boutons
- **Catégories**: overview, neighborhood, market, works, risks, documents

### Rapport Public

#### `page.tsx` (Report)
- Similaire au dashboard mais en lecture seule
- Affiche tous les onglets en navigation horizontale
- Pas de gestion utilisateur

## Pistes de Développement Backend

## 🗄️ Ingestion de Données en Masse (Architecture Recommandée)

### Vue d'Ensemble

L'objectif est de créer un système backend **auto-hébergé sur VPS avec Docker** permettant l'ingestion, le stockage et l'accès rapide aux données immobilières provenant de fichiers CSV volumineux.

### Sources de Données Cibles

#### 1. **DVF (Demandes de Valeurs Foncières)**
- **Source**: https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/
- **Format**: CSV (~ 5-10 GB par an)
- **Fréquence**: Mise à jour semestrielle
- **Colonnes clés**: 
  - `id_mutation`, `date_mutation`, `valeur_fonciere`
  - `type_local`, `surface_reelle_bati`, `nombre_pieces_principales`
  - `code_commune`, `latitude`, `longitude`
  - `adresse_nom_voie`, `adresse_numero`

#### 2. **SITADEL (Système d'Information et de Traitement Automatisé des Données Élémentaires sur les Logements)**
- **Source**: https://www.data.gouv.fr/fr/datasets/base-des-permis-de-construire-et-autres-autorisations-durbanisme-sitadel/
- **Format**: CSV (~ 500 MB - 1 GB)
- **Fréquence**: Mensuelle
- **Colonnes clés**:
  - `numero_dossier`, `date_reelle_autorisation`
  - `type_dossier` (PC, DP, PA...)
  - `nature_projet`, `nombre_logements_autorises`
  - `surface_construite`, `code_commune`

#### 3. **REI-3 (Répertoire des Entreprises et des Établissements)**
- **Source**: INSEE - https://www.insee.fr/fr/information/3591226
- **Format**: CSV (~ 2-3 GB)
- **Fréquence**: Mensuelle
- **Colonnes clés**:
  - `siren`, `siret`, `denominationUniteLegale`
  - `activitePrincipaleEtablissement` (code APE)
  - `geo_adresse`, `latitude`, `longitude`
  - `trancheEffectifsEtablissement`

---

### Architecture Backend sur VPS

#### Stack Technique Recommandée

```yaml
Infrastructure:
  VPS: OVH / Hetzner / Scaleway (16GB RAM minimum, 200GB SSD)
  OS: Ubuntu 22.04 LTS
  
Conteneurisation:
  Docker: v24+
  Docker Compose: Orchestration multi-services
  
Base de Données:
  PostgreSQL: v15+ avec extension PostGIS
  pgAdmin: Interface GUI (optionnel)
  
Ingestion & ETL:
  Python: Scripts d'import CSV
    - pandas: lecture et transformation
    - psycopg2: connexion PostgreSQL
    - geopandas: géolocalisation
  Node.js: API REST

Cache & Files:
  Redis: Cache de requêtes fréquentes
  
Reverse Proxy:
  Nginx: Routage + SSL
  Certbot: Let's Encrypt
```

#### Structure Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: kadris_postgres
    environment:
      POSTGRES_DB: kadris_data
      POSTGRES_USER: kadris
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - kadris_network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: kadris_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - kadris_network
    restart: unless-stopped

  api:
    build: ./backend
    container_name: kadris_api
    environment:
      DATABASE_URL: postgresql://kadris:${DB_PASSWORD}@postgres:5432/kadris_data
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - kadris_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: kadris_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
    networks:
      - kadris_network
    restart: unless-stopped

  etl_worker:
    build: ./etl
    container_name: kadris_etl
    environment:
      DATABASE_URL: postgresql://kadris:${DB_PASSWORD}@postgres:5432/kadris_data
    volumes:
      - ./data/csv:/data/csv  # Montage des CSV
      - ./etl/logs:/logs
    depends_on:
      - postgres
    networks:
      - kadris_network
    # Ne démarre que manuellement pour imports
    restart: "no"

volumes:
  pgdata:
  redis_data:

networks:
  kadris_network:
    driver: bridge
```

---

### Schéma PostgreSQL pour Données en Masse

```sql
-- Extension PostGIS pour géolocalisation
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- TABLE DVF (Transactions immobilières)
-- ========================================
CREATE TABLE dvf_transactions (
    id SERIAL PRIMARY KEY,
    mutation_id VARCHAR(50) UNIQUE NOT NULL,
    date_mutation DATE NOT NULL,
    valeur_fonciere DECIMAL(12, 2),
    
    -- Localisation
    adresse_numero VARCHAR(10),
    adresse_nom_voie TEXT,
    code_postal VARCHAR(5),
    code_commune VARCHAR(5) NOT NULL,
    nom_commune VARCHAR(255),
    
    -- Géolocalisation
    coords GEOGRAPHY(POINT, 4326),
    
    -- Caractéristiques bien
    type_local VARCHAR(50), -- Maison, Appartement, Local
    surface_reelle_bati DECIMAL(10, 2),
    surface_terrain DECIMAL(12, 2),
    nombre_pieces_principales INTEGER,
    
    -- Métadonnées
    imported_at TIMESTAMP DEFAULT NOW(),
    
    -- Index pour performances
    INDEX idx_dvf_date (date_mutation),
    INDEX idx_dvf_commune (code_commune),
    INDEX idx_dvf_coords USING GIST(coords),
    INDEX idx_dvf_type (type_local),
    INDEX idx_dvf_mutation (mutation_id)
);

-- ========================================
-- TABLE SITADEL (Permis de construire)
-- ========================================
CREATE TABLE sitadel_permits (
    id SERIAL PRIMARY KEY,
    numero_dossier VARCHAR(100) UNIQUE NOT NULL,
    date_autorisation DATE,
    date_reelle_autorisation DATE,
    
    -- Type et nature
    type_dossier VARCHAR(10), -- PC, DP, PA, etc.
    nature_projet VARCHAR(100),
    
    -- Localisation
    code_commune VARCHAR(5) NOT NULL,
    libelle_commune VARCHAR(255),
    adresse TEXT,
    
    -- Caractéristiques
    nombre_logements_autorises INTEGER DEFAULT 0,
    nombre_logements_commences INTEGER DEFAULT 0,
    surface_construite DECIMAL(12, 2),
    
    -- Métadonnées
    imported_at TIMESTAMP DEFAULT NOW(),
    
    -- Index
    INDEX idx_sitadel_commune (code_commune),
    INDEX idx_sitadel_date (date_autorisation),
    INDEX idx_sitadel_type (type_dossier)
);

-- ========================================
-- TABLE REI-3 (Entreprises)
-- ========================================
CREATE TABLE rei3_establishments (
    id SERIAL PRIMARY KEY,
    siret VARCHAR(14) UNIQUE NOT NULL,
    siren VARCHAR(9) NOT NULL,
    
    -- Identification
    denomination VARCHAR(255),
    enseigne VARCHAR(255),
    
    -- Activité
    code_ape VARCHAR(10),
    libelle_ape VARCHAR(255),
    tranche_effectifs VARCHAR(50),
    
    -- Localisation
    adresse_complete TEXT,
    code_postal VARCHAR(5),
    code_commune VARCHAR(5),
    libelle_commune VARCHAR(255),
    
    -- Géolocalisation
    coords GEOGRAPHY(POINT, 4326),
    
    -- Statut
    etat_administratif VARCHAR(20), -- Actif, Fermé
    date_creation DATE,
    
    -- Métadonnées
    imported_at TIMESTAMP DEFAULT NOW(),
    
    -- Index
    INDEX idx_rei3_siret (siret),
    INDEX idx_rei3_siren (siren),
    INDEX idx_rei3_commune (code_commune),
    INDEX idx_rei3_ape (code_ape),
    INDEX idx_rei3_coords USING GIST(coords)
);

-- ========================================
-- TABLE DE SUIVI DES IMPORTS
-- ========================================
CREATE TABLE import_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- dvf, sitadel, rei3
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    
    -- Statistiques import
    rows_total INTEGER,
    rows_inserted INTEGER,
    rows_updated INTEGER,
    rows_failed INTEGER,
    
    -- Timing
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, failed
    error_message TEXT,
    
    INDEX idx_import_source (source),
    INDEX idx_import_status (status),
    INDEX idx_import_date (started_at)
);
```

---

### Pipeline ETL (Extract, Transform, Load)

#### Structure du Projet ETL

```
etl/
├── Dockerfile
├── requirements.txt
├── scripts/
│   ├── import_dvf.py
│   ├── import_sitadel.py
│   ├── import_rei3.py
│   └── utils/
│       ├── db.py          # Connexion PostgreSQL
│       ├── geocoding.py   # Conversion adresse → coords
│       └── validators.py  # Validation données
├── config/
│   └── settings.py
└── logs/
```

#### Script d'Import DVF (Exemple)

```python
# etl/scripts/import_dvf.py
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from utils.db import get_db_connection
from utils.geocoding import geocode_if_missing
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def import_dvf_csv(csv_path: str):
    """
    Importe un fichier CSV DVF dans PostgreSQL
    """
    start_time = datetime.now()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Log de démarrage
    cursor.execute("""
        INSERT INTO import_logs (source, filename, started_at)
        VALUES (%s, %s, %s)
        RETURNING id
    """, ('dvf', csv_path.split('/')[-1], start_time))
    log_id = cursor.fetchone()[0]
    conn.commit()
    
    try:
        # Lecture CSV par chunks (économie RAM)
        chunk_size = 10000
        total_inserted = 0
        total_failed = 0
        
        for chunk in pd.read_csv(csv_path, chunksize=chunk_size, dtype=str, low_memory=False):
            # Nettoyage et transformation
            chunk = chunk.rename(columns={
                'id_mutation': 'mutation_id',
                'date_mutation': 'date_mutation',
                'valeur_fonciere': 'valeur_fonciere',
                'adresse_numero': 'adresse_numero',
                'adresse_nom_voie': 'adresse_nom_voie',
                'code_postal': 'code_postal',
                'code_commune': 'code_commune',
                'nom_commune': 'nom_commune',
                'type_local': 'type_local',
                'surface_reelle_bati': 'surface_reelle_bati',
                'nombre_pieces_principales': 'nombre_pieces_principales',
                'latitude': 'latitude',
                'longitude': 'longitude'
            })
            
            # Conversion types
            chunk['date_mutation'] = pd.to_datetime(chunk['date_mutation'], errors='coerce')
            chunk['valeur_fonciere'] = pd.to_numeric(chunk['valeur_fonciere'], errors='coerce')
            chunk['surface_reelle_bati'] = pd.to_numeric(chunk['surface_reelle_bati'], errors='coerce')
            
            # Filtres de qualité
            chunk = chunk[chunk['code_commune'].notna()]
            chunk = chunk[chunk['date_mutation'].notna()]
            
            # Géolocalisation
            chunk['coords'] = chunk.apply(
                lambda row: f"POINT({row['longitude']} {row['latitude']})" 
                if pd.notna(row['latitude']) and pd.notna(row['longitude']) 
                else None, 
                axis=1
            )
            
            # Préparation des données pour insertion
            records = []
            for _, row in chunk.iterrows():
                try:
                    records.append((
                        row['mutation_id'],
                        row['date_mutation'],
                        row['valeur_fonciere'],
                        row['adresse_numero'],
                        row['adresse_nom_voie'],
                        row['code_postal'],
                        row['code_commune'],
                        row['nom_commune'],
                        row['coords'],
                        row['type_local'],
                        row['surface_reelle_bati'],
                        row['nombre_pieces_principales']
                    ))
                except Exception as e:
                    total_failed += 1
                    logger.warning(f"Erreur ligne: {e}")
            
            # Insertion par batch (rapide)
            if records:
                execute_batch(cursor, """
                    INSERT INTO dvf_transactions (
                        mutation_id, date_mutation, valeur_fonciere,
                        adresse_numero, adresse_nom_voie, code_postal,
                        code_commune, nom_commune, coords,
                        type_local, surface_reelle_bati, nombre_pieces_principales
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_GeogFromText(%s), %s, %s, %s)
                    ON CONFLICT (mutation_id) DO UPDATE SET
                        valeur_fonciere = EXCLUDED.valeur_fonciere,
                        coords = EXCLUDED.coords
                """, records, page_size=1000)
                
                total_inserted += len(records)
                conn.commit()
                logger.info(f"Importé {total_inserted} lignes...")
        
        # Mise à jour log de succès
        end_time = datetime.now()
        cursor.execute("""
            UPDATE import_logs
            SET rows_inserted = %s, rows_failed = %s, 
                completed_at = %s, duration_seconds = %s, 
                status = 'completed'
            WHERE id = %s
        """, (total_inserted, total_failed, end_time, 
              (end_time - start_time).seconds, log_id))
        conn.commit()
        
        logger.info(f"✅ Import DVF terminé: {total_inserted} lignes en {(end_time - start_time).seconds}s")
        
    except Exception as e:
        cursor.execute("""
            UPDATE import_logs
            SET status = 'failed', error_message = %s
            WHERE id = %s
        """, (str(e), log_id))
        conn.commit()
        logger.error(f"❌ Erreur import: {e}")
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python import_dvf.py <chemin_csv>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    import_dvf_csv(csv_file)
```

#### Dockerfile ETL

```dockerfile
# etl/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dépendances système pour PostgreSQL et géospatial
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Scripts
COPY scripts/ ./scripts/
COPY config/ ./config/

CMD ["python", "-u", "scripts/import_dvf.py", "/data/csv/dvf-latest.csv"]
```

```txt
# etl/requirements.txt
pandas==2.1.0
psycopg2-binary==2.9.7
geopandas==0.14.0
python-dotenv==1.0.0
requests==2.31.0
```

---

### API Backend pour Accès aux Données

#### Endpoints Recommandés

```typescript
// API Node.js avec Express

// 1. DVF - Transactions par zone géographique
GET /api/data/dvf/search
Query Params:
  - lat: number (required)
  - lon: number (required)
  - radius: number (default: 500m, max: 5000m)
  - date_start: YYYY-MM-DD
  - date_end: YYYY-MM-DD
  - type_local: Maison|Appartement
  - limit: number (default: 100)

Response:
{
  "count": 45,
  "radius": 500,
  "center": { "lat": 48.8566, "lon": 2.3522 },
  "transactions": [
    {
      "mutation_id": "2023-12345",
      "date_mutation": "2023-06-15",
      "valeur_fonciere": 450000,
      "type_local": "Appartement",
      "surface_reelle_bati": 65,
      "nombre_pieces_principales": 3,
      "adresse": "12 Rue de Example",
      "distance_meters": 120
    },
    // ...
  ],
  "stats": {
    "prix_median": 6923,  // €/m²
    "prix_moyen": 7200,
    "nb_ventes": 45
  }
}

// 2. SITADEL - Permis de construire
GET /api/data/sitadel/commune/:codeCommune
Query Params:
  - date_start: YYYY-MM-DD
  - type_dossier: PC|DP|PA

Response:
{
  "code_commune": "75001",
  "count": 12,
  "permits": [
    {
      "numero_dossier": "PC 75001 23 00123",
      "date_autorisation": "2023-05-20",
      "type_dossier": "PC",
      "nombre_logements_autorises": 24,
      "surface_construite": 1800,
      "adresse": "45 Avenue de la République"
    }
  ]
}

// 3. REI-3 - Entreprises par zone
GET /api/data/rei3/search
Query Params:
  - lat: number
  - lon: number
  - radius: number
  - code_ape: string (filtrer par secteur)

Response:
{
  "count": 67,
  "establishments": [
    {
      "siret": "12345678901234",
      "denomination": "Boulangerie Example",
      "code_ape": "1071C",
      "libelle_ape": "Boulangerie et boulangerie-pâtisserie",
      "adresse": "10 Rue du Commerce",
      "distance_meters": 85
    }
  ]
}

// 4. Stats agrégées par commune
GET /api/data/stats/commune/:codeCommune

Response:
{
  "code_commune": "75001",
  "dvf": {
    "nb_transactions_12m": 234,
    "prix_median_m2": 12500,
    "evolution_12m": "+5.2%"
  },
  "sitadel": {
    "nb_permis_12m": 8,
    "nb_logements_autorises": 145
  },
  "rei3": {
    "nb_etablissements_actifs": 1250,
    "top_secteurs": [
      { "ape": "5610A", "libelle": "Restauration", "count": 89 },
      { "ape": "4711B", "libelle": "Commerce alimentaire", "count": 45 }
    ]
  }
}
```

#### Exemple Controller Express

```typescript
// backend/src/controllers/dvfController.ts
import { Request, Response } from 'express';
import { pool } from '../db/connection';

export const searchDVF = async (req: Request, res: Response) => {
    const { lat, lon, radius = 500, date_start, date_end, type_local, limit = 100 } = req.query;
    
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon are required' });
    }
    
    try {
        // Requête avec PostGIS pour recherche géographique
        const query = `
            SELECT 
                mutation_id,
                date_mutation,
                valeur_fonciere,
                type_local,
                surface_reelle_bati,
                nombre_pieces_principales,
                adresse_nom_voie,
                adresse_numero,
                ST_Distance(
                    coords::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance_meters
            FROM dvf_transactions
            WHERE 
                ST_DWithin(
                    coords::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                )
                ${date_start ? 'AND date_mutation >= $4' : ''}
                ${date_end ? `AND date_mutation <= $${date_start ? 5 : 4}` : ''}
                ${type_local ? `AND type_local = $${date_start && date_end ? 6 : date_start || date_end ? 5 : 4}` : ''}
            ORDER BY distance_meters ASC
            LIMIT $${date_start && date_end && type_local ? 7 : type_local && (date_start || date_end) ? 6 : (date_start || date_end) ? 5 : type_local ? 5 : 4}
        `;
        
        const params: any[] = [parseFloat(lon as string), parseFloat(lat as string), parseInt(radius as string)];
        if (date_start) params.push(date_start);
        if (date_end) params.push(date_end);
        if (type_local) params.push(type_local);
        params.push(parseInt(limit as string));
        
        const result = await pool.query(query, params);
        
        // Statistiques
        const stats = {
            prix_median: 0,
            prix_moyen: 0,
            nb_ventes: result.rowCount
        };
        
        if (result.rows.length > 0) {
            const prixM2 = result.rows
                .filter(r => r.valeur_fonciere && r.surface_reelle_bati)
                .map(r => r.valeur_fonciere / r.surface_reelle_bati);
            
            stats.prix_moyen = Math.round(prixM2.reduce((a, b) => a + b, 0) / prixM2.length);
            stats.prix_median = Math.round(prixM2.sort((a, b) => a - b)[Math.floor(prixM2.length / 2)]);
        }
        
        res.json({
            count: result.rowCount,
            radius: parseInt(radius as string),
            center: { lat: parseFloat(lat as string), lon: parseFloat(lon as string) },
            transactions: result.rows,
            stats
        });
        
    } catch (error) {
        console.error('Error searching DVF:', error);
        res.status(500).json({ error: 'Database query failed' });
    }
};
```

---

### Workflow de Mise à Jour des Données

#### Script Automatisé (CRON)

```bash
# /etc/cron.d/kadris-data-update

# DVF - Mise à jour semestrielle (1er du mois à 2h du matin)
0 2 1 1,7 * cd /opt/kadris && docker-comp exec etl_worker python scripts/import_dvf.py /data/csv/dvf-latest.csv >> /var/log/kadris/dvf-import.log 2>&1

# SITADEL - Mise à jour mensuelle (5 du mois à 3h)
0 3 5 * * cd /opt/kadris && docker-compose exec etl_worker python scripts/import_sitadel.py /data/csv/sitadel-latest.csv >> /var/log/kadris/sitadel-import.log 2>&1

# REI-3 - Mise à jour mensuelle (10 du mois à 4h)
0 4 10 * * cd /opt/kadris && docker-compose exec etl_worker python scripts/import_rei3.py /data/csv/rei3-latest.csv >> /var/log/kadris/rei3-import.log 2>&1
```

#### Script de Téléchargement Automatique

```bash
#!/bin/bash
# scripts/download_datasets.sh

DATA_DIR="/opt/kadris/data/csv"
LOG_FILE="/var/log/kadris/download.log"

echo "[$(date)] Starting dataset download..." >> $LOG_FILE

# DVF
echo "Downloading DVF..." >> $LOG_FILE
wget -O $DATA_DIR/dvf-latest.csv "https://www.data.gouv.fr/fr/datasets/r/latest-dvf-url" >> $LOG_FILE 2>&1

# SITADEL
echo "Downloading SITADEL..." >> $LOG_FILE
wget -O $DATA_DIR/sitadel-latest.csv "https://www.data.gouv.fr/fr/datasets/r/latest-sitadel-url" >>  $LOG_FILE 2>&1

# REI-3
echo "Downloading REI-3..." >> $LOG_FILE
wget -O $DATA_DIR/rei3-latest.csv "https://files.data.gouv.fr/insee-sirene/StockEtablissement_utf8.zip" >> $LOG_FILE 2>&1
unzip -o $DATA_DIR/rei3-latest.csv >> $LOG_FILE 2>&1

echo "[$(date)] Download complete." >> $LOG_FILE
```

---

### Optimisations PostgreSQL pour Gros Volumes

```sql
-- Vacuum régulier pour performances
CREATE OR REPLACE FUNCTION auto_vacuum_tables()
RETURNS void AS $$
BEGIN
    VACUUM ANALYZE dvf_transactions;
    VACUUM ANALYZE sitadel_permits;
    VACUUM ANALYZE rei3_establishments;
END;
$$ LANGUAGE plpgsql;

-- CRON PostgreSQL (pg_cron extension)
SELECT cron.schedule('vacuum-tables', '0 5 * * *', 'SELECT auto_vacuum_tables()');

-- Partitionnement par année (DVF)
CREATE TABLE dvf_transactions_2023 PARTITION OF dvf_transactions
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE dvf_transactions_2024 PARTITION OF dvf_transactions
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Index partiels pour requêtes fréquentes
CREATE INDEX idx_dvf_recent 
ON dvf_transactions (date_mutation) 
WHERE date_mutation > NOW() - INTERVAL '2 years';
```

---

### Avantages de cette Architecture

| Avantage | Description |
|----------|-------------|
| **Performance** | Requêtes SQL optimisées avec index géospatiaux |
| **Contrôle  total** | Données hébergées sur VPS, pas de limite API externe |
| **Enrichissement** | Possibilité de croiser DVF + SITADEL + REI-3 |
| **Historique** | Conservation de toutes les données depuis 5+ ans |
| **Coût** | VPS ~20€/mois vs APIs payantes |
| **Fiabilité** | Pas de dépendance aux APIs tierces |
| **Évolutivité** | Ajout facile de nouvelles sources (DPE, Cadastre...) |

---

### Phase 1: API Backend Centrale (Priorité Haute)


#### 1.1 Architecture Recommandée
```
Backend Stack:
- Node.js + Express / Fastify
- PostgreSQL + PostGIS (données géographiques)
- Redis (cache)
- JWT (authentification)
```

#### 1.2 Endpoints à Créer

**Authentification**
```typescript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

**Gestion des Biens**
```typescript
GET    /api/properties              // Liste biens utilisateur
GET    /api/properties/:id          // Détails bien
POST   /api/properties              // Créer bien
PUT    /api/properties/:id          // Modifier bien
DELETE /api/properties/:id          // Supprimer bien
POST   /api/properties/:id/claim    // Revendiquer bien (avec acte)
```

**Rapports**
```typescript
GET /api/reports/:cleInterop        // Rapport complet (cached)
GET /api/reports/:cleInterop/pdf    // PDF du rapport
```

**Données Aggregées** (Cache côté serveur)
```typescript
GET /api/building/:cleInterop       // Données bâtiment (BDNB cached)
GET /api/transactions/:cleInterop   // DVF dans rayon
GET /api/risks/:cleInterop          // Risques (Géorisques cached)
GET /api/neighborhood/:cleInterop   // POIs (Overpass cached)
```

#### 1.3 Avantages Backend
- ✅ **Cache centralisé**: Réduire appels API externes
- ✅ **Rate limiting**: Protéger contre surcharge
- ✅ **Monitoring**: Tracker usage et performances
- ✅ **Clés API sécurisées**: Ne pas exposer dans frontend
- ✅ **Webhooks**: Notifications changements (nouveaux DPE, etc.)
- ✅ **Batch processing**: Rafraîchir données overnight

### Phase 2: Base de Données (Priorité Haute)

#### 2.1 Schéma PostgreSQL

```sql
-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Biens immobiliers
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cle_interop_adr VARCHAR(255) UNIQUE NOT NULL,
    adresse_ban TEXT NOT NULL,
    coords GEOGRAPHY(POINT, 4326), -- PostGIS
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP,
    deed_document_url TEXT, -- URL du titre de propriété
    building_data JSONB, -- Cache données BDNB
    last_refreshed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_properties (user_id),
    INDEX idx_coords USING GIST(coords)
);

-- Transactions (cache DVF)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    mutation_id VARCHAR(255) UNIQUE,
    sale_date DATE,
    price DECIMAL(12,2),
    surface_habitable DECIMAL(10,2),
    property_type VARCHAR(100),
    coords GEOGRAPHY(POINT, 4326),
    cached_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_property_transactions (property_id)
);

-- Travaux
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- plomberie, électricité, etc.
    status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_property_works (property_id)
);

-- Documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50), -- ACTE, DPE, FACTURE, etc.
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    INDEX idx_property_documents (property_id)
);

-- Cache API (éviter surcharge APIs externes)
CREATE TABLE api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    api_source VARCHAR(100) NOT NULL, -- dvf, georisques, etc.
    data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    INDEX idx_cache_key (cache_key),
    INDEX idx_expiry (expires_at)
);
```

#### 2.2 Stratégie de Cache

```typescript
// Exemple de logique cache
async function getCachedOrFetch(cacheKey: string, fetchFn: () => Promise<any>, ttl = 86400) {
    // Vérifier cache
    const cached = await db.query(
        'SELECT data FROM api_cache WHERE cache_key = $1 AND expires_at > NOW()',
        [cacheKey]
    );
    
    if (cached.rows.length > 0) {
        return cached.rows[0].data;
    }
    
    // Fetch fresh data
    const freshData = await fetchFn();
    
    // Store in cache
    await db.query(
        'INSERT INTO api_cache (cache_key, api_source, data, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'$4 seconds\')',
        [cacheKey, 'source', freshData, ttl]
    );
    
    return freshData;
}
```

### Phase 3: Stockage Fichiers (Priorité Moyenne)

#### 3.1 Solutions Recommandées
- **AWS S3** ou **Azure Blob Storage** (scalable)
- **Cloudflare R2** (gratuit jusqu'à 10GB)
- **Supabase Storage** (simple, intégré)

#### 3.2 Workflow Upload
```typescript
POST /api/properties/:id/documents/upload
Content-Type: multipart/form-data

1. Validation fichier (type, taille)
2. Scan antivirus (optionnel mais recommandé)
3. Upload vers S3
4. Générer URL signée
5. Stocker metadata en DB
6. Retourner URL + metadata
```

### Phase 4: Notifications & Webhooks (Priorité Basse)

#### 4.1 Use Cases
- Nouveau DPE disponible pour un bien
- Nouvelle transaction DVF dans le quartier
- Alerte risque naturel (mise à jour Géorisques)
- Rappel échéance travaux

#### 4.2 Technologies
- **Bull Queue** (job scheduling)
- **SendGrid** ou **Resend** (emails)
- **Firebase Cloud Messaging** (push notifications)

### Phase 5: IA & Analyse Avancée (Priorité Basse)

#### 5.1 Features Potentielles
- Estimation prix avec ML (basé sur DVF + caractéristiques)
- Détection anomalies (DPE très mauvais, risques élevés)
- Recommandations travaux prioritaires
- Prévision évolution valeur

#### 5.2 Stack IA
- **Python** (scikit-learn, TensorFlow)
- **API REST** exposant modèles
- **CRON** pour ré-entraînement modèles

## 🔐 Sécurité

### Actuellement (Frontend Only)
- ⚠️ Pas d'authentification réelle
- ⚠️ Données en localStorage (pas sécurisé)
- ⚠️ Pas de validation côté serveur
- ⚠️ APIs publiques exposées (rate limiting côté provider)

### Recommandations Backend
1. **JWT Authentication** avec refresh tokens
2. **bcrypt** pour hash mots de passe
3. **HTTPS only** (Let's Encrypt)
4. **CORS** strict
5. **Rate limiting** par IP et par utilisateur
6. **Validation** avec Zod/Joi sur toutes les entrées
7. **SQL injection** protection (requêtes paramétrées)
8. **XSS** protection (sanitization)
9. **Logs** d'audit pour actions sensibles

## 📊 Monitoring & Performance

### Métriques à Tracker (Backend)
- Temps de réponse API
- Taux d'erreur par endpoint
- Utilisation cache (hit rate)
- Nombre d'appels APIs externes
- Utilisateurs actifs journaliers/mensuels
- Usage stockage (fichiers uploadés)

### Outils Recommandés
- **Prometheus** + **Grafana** (métriques)
- **Sentry** (error tracking)
- **LogRocket** ou **PostHog** (analytics utilisateur)

## 🚀 Déploiement

### Frontend (Actuel)
- **Vercel** ou **Netlify** (Next.js optimisé)
- **Variables environment** pour URLs API

### Backend (Futur)
- **Railway** / **Render** / **Fly.io** (Node.js)
- **Supabase** (all-in-one: DB + Auth + Storage)
- **AWS ECS** / **GCP Cloud Run** (conteneurisé)

### Database
- **Supabase** (PostgreSQL hébergé)
- **Neon** (serverless Postgres)
- **AWS RDS** / **GCP Cloud SQL**

## 📝 Prochaines Étapes Recommandées

### Court Terme (1-2 mois)
1. ✅ Implémenter backend Node.js minimal
2. ✅ Migrer localStorage → PostgreSQL
3. ✅ Authentification JWT
4. ✅ Cache API côté serveur
5. ✅ Upload fichiers (S3)

### Moyen Terme (3-6 mois)
1. PDF generation côté serveur
2. Webhooks pour notifications
3. Dashboard analytics propriétaire
4. API mobile (React Native)

### Long Terme (6-12 mois)
1. Machine Learning pour estimations
2. Marché secondaire (revente rapports)
3. Intégration notaires/agents immobiliers
4. Application mobile native

---

**Version**: 1.0  
**Dernière mise à jour**: 23 novembre 2024  
**Auteur**: Équipe Kadris
