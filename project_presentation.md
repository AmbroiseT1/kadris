# Présentation du Projet Bricq (ex-Kadris)

## 1. Présentation générale du projet

### Objectifs du projet
Bricq est une plateforme numérique destinée aux propriétaires immobiliers. Son objectif principal est de fournir un "Passeport Immobilier" complet et un audit technique détaillé pour n'importe quel bien. La plateforme agrège des données provenant de multiples sources publiques et privées pour offrir une vision à 360° d'une propriété : performance énergétique, risques, urbanisme, environnement de quartier, et connectivité.

### Contexte d'utilisation
L'application s'adresse aux particuliers souhaitant mieux connaître leur patrimoine, préparer une vente, ou optimiser la gestion de leur bien. Elle permet de centraliser des informations souvent dispersées et techniques dans une interface claire et pédagogique.

### Fonctionnalités actuelles
*   **Tableau de bord propriétaire** : Vue d'ensemble des biens gérés.
*   **Ajout de bien** : Interface intuitive pour ajouter une propriété via son adresse, avec récupération automatique des données.
*   **Passeport Immobilier (Rapport détaillé)** :
    *   **Synthèse** : Résumé des indicateurs clés (surface, année, DPE, estimation).
    *   **Bâtiment** : Données techniques détaillées (matériaux, isolation, chauffage) issues de la BDNB et du DPE.
    *   **Quartier** : Analyse de l'environnement (commerces, écoles, transports) et données socio-démographiques.
    *   **Risques** : Exposition aux risques naturels et technologiques (Géorisques).
    *   **Urbanisme** : Informations sur les règles d'urbanisme locales (PLU, zonage).
    *   **Prix & DVF** : Analyse du marché local basée sur les transactions historiques (Demandes de Valeurs Foncières).
    *   **Analyse** : Insights sur le potentiel du bien et recommandations.
*   **Visualisation 3D** : Intégration de maquettes 3D interactives pour certains biens.

### Choix techniques effectués
*   **Framework Frontend** : Next.js 16 (App Router) pour une application réactive et performante.
*   **Langage** : TypeScript pour la robustesse et la maintenabilité du code.
*   **Styles** : Tailwind CSS v4 pour un design moderne et rapide à mettre en œuvre.
*   **Cartographie** : Leaflet et React-Leaflet pour les affichages cartographiques.
*   **Visualisation 3D** : Three.js et React Three Fiber.
*   **Données** : Architecture basée sur l'agrégation d'API externes (ADEME, BDNB, IGN, Géorisques, ARCEP, etc.) via des fonctions utilitaires dédiées.

---

## 2. Schéma détaillé de l'arborescence du code

### Arborescence textuelle

```
brique-app/
├── app/                        # Cœur de l'application Next.js (App Router)
│   ├── dashboard/              # Page du tableau de bord principal
│   ├── how-it-works/           # Page explicative "Comment ça marche"
│   ├── lib/                    # Bibliothèques de fonctions utilitaires et API
│   │   ├── analysis.ts         # Logique d'analyse des données immobilières
│   │   ├── arcep.ts            # Connectivité (Fibre/4G/5G)
│   │   ├── bndb.ts             # Base de Données Nationale des Bâtiments
│   │   ├── dpe.ts              # Diagnostics de Performance Énergétique (ADEME)
│   │   ├── dvf.ts              # Demandes de Valeurs Foncières (Transactions)
│   │   ├── eau.ts              # Qualité de l'eau
│   │   ├── georisques.ts       # Risques naturels et technologiques
│   │   ├── quartier.ts         # Données socio-démographiques et services
│   │   ├── rnb.ts              # Référentiel National des Bâtiments
│   │   ├── types.ts            # Définitions des types TypeScript globaux
│   │   ├── urbanisme.ts        # Données d'urbanisme (GPU)
│   │   └── utils.ts            # Fonctions utilitaires génériques
│   ├── login/                  # Page de connexion
│   ├── profile/                # Page de profil utilisateur
│   ├── properties/             # Gestion des propriétés
│   │   ├── add/                # Page d'ajout d'une nouvelle propriété
│   │   └── page.tsx            # Liste des propriétés
│   ├── report/                 # Génération des rapports détaillés
│   │   └── [cityCode]/         # Route dynamique par code ville/dossier
│   ├── layout.tsx              # Layout racine de l'application
│   └── page.tsx                # Page d'accueil (Landing page)
├── components/                 # Composants React réutilisables
│   ├── dashboard/              # Composants spécifiques au tableau de bord
│   ├── report/                 # Composants des onglets du rapport (TabBatiment, etc.)
│   └── ui/                     # Composants d'interface génériques (Boutons, Inputs...)
├── public/                     # Fichiers statiques (Images, Logos)
├── utils/                      # Autres utilitaires (ex: supabase/client.ts)
├── package.json                # Dépendances et scripts du projet
└── tailwind.config.ts          # Configuration du design system
```

### Rôle des répertoires et fichiers principaux

*   **`app/`** : Contient toute la structure de navigation et les pages de l'application. L'utilisation du dossier `lib/` à l'intérieur permet de centraliser la logique métier et les appels API côté serveur ou client.
*   **`app/lib/*.ts`** : Ces fichiers sont cruciaux car ils isolent la complexité de chaque source de données externe. Par exemple, `dpe.ts` gère spécifiquement la récupération et le formatage des données DPE de l'ADEME.
*   **`app/report/[cityCode]/page.tsx`** : C'est le contrôleur principal de la vue "Passeport Immobilier". Il orchestre le chargement parallèle de toutes les données via les fonctions de `lib/` et les distribue aux composants d'affichage.
*   **`components/report/`** : Contient les vues spécifiques pour chaque section du rapport (Onglets). Chaque fichier (ex: `TabBatiment.tsx`) est responsable de l'affichage d'un domaine métier précis.
*   **`components/ui/`** : Bibliothèque de composants atomiques pour assurer une cohérence visuelle.

### Logique d'organisation globale
L'architecture suit une approche modulaire centrée sur les fonctionnalités ("Feature-based"). Les données sont récupérées à la demande (souvent côté client via `useEffect` dans les pages de rapport pour l'instant, ou via des Server Actions potentiels). La séparation entre la logique d'acquisition de données (`lib/`) et la logique de présentation (`components/`) est stricte, facilitant la maintenance et l'évolution des sources de données sans impacter l'UI.

---

## 3. Next Steps

### Évolutions nécessaires pour structurer un backend
Actuellement, l'application semble gérer beaucoup d'états localement ou via des appels directs aux API tierces. Pour passer à l'échelle et gérer des utilisateurs réels :
1.  **Persistance des données** : Mettre en place une base de données pour sauvegarder les profils utilisateurs, leurs propriétés, et les rapports générés (pour éviter de re-fetcher les données API à chaque visite).
2.  **Authentification robuste** : Sécuriser l'accès aux données personnelles.
3.  **Mise en cache** : Stocker les résultats des API tierces (DPE, DVF) qui changent peu souvent pour améliorer les performances et réduire la dépendance aux services externes.

### Choix technologiques recommandés
*   **Backend / Base de données** : **Supabase** (PostgreSQL) est fortement recommandé pour sa facilité d'intégration avec Next.js, son authentification intégrée et ses capacités temps réel. C'est un choix "Serverless" cohérent avec l'architecture actuelle.
*   **ORM** : **Prisma** ou **Drizzle** pour interagir avec la base de données de manière typée et sécurisée.
*   **Authentification** : **Supabase Auth** ou **NextAuth.js** (si besoin de providers multiples complexes).

### Priorités de développement
1.  **Mise en place de la Base de Données (Supabase)** : Créer les tables `users`, `properties`, `reports`.
2.  **Connexion du Frontend au Backend** : Remplacer le stockage local/mock par des appels à la base de données pour la liste des propriétés.
3.  **Optimisation du chargement du Rapport** : Implémenter une stratégie de cache (via Next.js Data Cache ou en base de données) pour les données API lourdes.
4.  **Finalisation de l'UI** : Polir les composants existants et assurer le responsive design sur toutes les pages.

### Risques ou points d'attention
*   **Dépendance aux API tierces** : Les API publiques (ADEME, BDNB) peuvent changer, être dépréciées (comme vu avec le DPE) ou avoir des temps de réponse variables. Une couche d'abstraction robuste (déjà initiée dans `lib/`) et du caching sont indispensables.
*   **Complexité de la donnée** : La donnée immobilière est hétérogène. Le croisement des sources (par géolocalisation ou ID) peut être imprécis. Il faut prévoir des mécanismes de correction manuelle pour l'utilisateur.
*   **Performance** : Le chargement de multiples sources de données en parallèle peut ralentir l'affichage. L'utilisation de `Suspense` et du chargement progressif (Streaming) de Next.js sera clé.
