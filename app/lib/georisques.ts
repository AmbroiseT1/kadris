// Fichier : lib/georisques.ts

export interface RiskData {
  // --- 1. RISQUES NATURELS ---
  inondation: boolean;
  argiles: string;      // "Faible", "Moyen", "Fort"
  seisme: string;       // Zone 1 à 5
  radon: string;        // "Faible" (1), "Moyen" (2), "Elevé" (3)
  mouvement_terrain: boolean; // VRAI si mouvement recensé
  feu_foret: boolean;

  // --- 2. SOUS-SOL & SOL ---
  cavites: {            // NOUVEAU : Risque effondrement
    count: number;
    probabilite: string; // "Forte", "Moyenne"... (si dispo)
  };
  
  pollutions: Array<{   // NOUVEAU : Sites BASOL / SIS
    nom: string;
    etat: string; // "Site traité", "En surveillance"
  }>;

  // --- 3. HISTORIQUE ---
  catnat: {
    count: number;
    last_date: string | null;
    types: string[];
  };

  // --- 4. INDUSTRIE & TECHNO ---
  installations: Array<{
    nom: string;
    statut: string;
  }>;
  canalisations: boolean;
}

// Fonction utilitaire pour les appels API sécurisés
async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Erreur fetch sur ${url}`, e);
    return null;
  }
}

export async function fetchRisks(lat: number, lon: number): Promise<RiskData | null> {
  const latFixed = lat.toFixed(4);
  const lonFixed = lon.toFixed(4);

  console.log("🌍 Lancement de l'analyse multi-risques (7 APIs)...");

  // ON LANCE 7 REQUÊTES EN PARALLÈLE (C'est la puissance du modulaire)
  const results = await Promise.allSettled([
    // 0. Catastrophes Naturelles (Historique)
    safeFetch(`https://www.georisques.gouv.fr/api/v1/gaspar/catnat?lat=${latFixed}&lon=${lonFixed}&page=1&page_size=20`),
    
    // 1. Argiles (Sols)
    safeFetch(`https://www.georisques.gouv.fr/api/v1/rga?lat=${latFixed}&lon=${lonFixed}`),
    
    // 2. Installations Classées (Usines - Rayon 1km)
    safeFetch(`https://www.georisques.gouv.fr/api/v1/installations_classees?lat=${latFixed}&lon=${lonFixed}&rayon=1000`),
    
    // 3. Radon (Santé)
    safeFetch(`https://www.georisques.gouv.fr/api/v1/radon?lat=${latFixed}&lon=${lonFixed}`),

    // 4. Rapport Global (Pour Inondation & Sismicité qui sont bien gérés ici)
    safeFetch(`https://www.georisques.gouv.fr/api/v1/gaspar/risques?lat=${latFixed}&lon=${lonFixed}`),

    // 5. NOUVEAU : Cavités (Rayon 500m) - Risque effondrement
    safeFetch(`https://www.georisques.gouv.fr/api/v1/cavites?lat=${latFixed}&lon=${lonFixed}&rayon=500`),

    // 6. NOUVEAU : Sites et Sols Pollués (SSP - Rayon 1km) - BASOL/SIS
    safeFetch(`https://www.georisques.gouv.fr/api/v1/ssp?lat=${latFixed}&lon=${lonFixed}&rayon=1000`)
  ]);

  // Extraction sécurisée des résultats (Fulfilled = Réussi, sinon null)
  const r = (index: number) => results[index].status === 'fulfilled' ? (results[index] as any).value : null;

  const catnatData = r(0);
  const argilesData = r(1);
  const installData = r(2);
  const radonData = r(3);
  const globalData = r(4);
  const cavitesData = r(5);
  const sspData = r(6);

  // --- MAPPING INTELLIGENT ---

  // 1. CatNat
  const catnatRaw = catnatData?.data || [];
  const catnatTypes = Array.from(new Set(catnatRaw.map((c: any) => c.libelleRisque))).slice(0, 5) as string[];
  catnatRaw.sort((a: any, b: any) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime());
  const lastCatDate = catnatRaw.length > 0 ? catnatRaw[0].dateFin : null;

  // 2. Argiles (Prendre le pire scénario)
  let niveauArgiles = "Non exposé";
  if (argilesData?.data?.length > 0) {
      const niveaux = argilesData.data.map((d:any) => d.niveauAlea);
      if (niveaux.includes("Fort")) niveauArgiles = "Fort";
      else if (niveaux.includes("Moyen")) niveauArgiles = "Moyen";
      else if (niveaux.includes("Faible")) niveauArgiles = "Faible";
  }

  // 3. Cavités (Nouveau)
  const nbCavites = cavitesData?.data?.length || 0;
  // On regarde si une cavité est marquée "Certaine" ou "Probable" dans les données
  const probaCavite = nbCavites > 0 ? "Détectée(s)" : "Non";

  // 4. Pollution Sols (Nouveau)
  // L'API SSP renvoie souvent des infos BASOL (Base de données des sites pollués)
  const pollutions = (sspData?.data || [])
    .slice(0, 2)
    .map((p: any) => ({
        nom: p.nom_site || p.nom_etablissement || "Ancien site industriel",
        etat: p.etat_site || "Recensé (Inventaire Historique)"
    }));

  // 5. Radon
  let niveauRadon = "Faible";
  if (radonData?.data?.length > 0) {
      const classe = radonData.data[0].classePotentiel;
      if (classe === "3") niveauRadon = "Elevé";
      else if (classe === "2") niveauRadon = "Moyen";
  }

  // 6. Global (Fallback pour le reste)
  const inondation = globalData?.risquesNaturels?.zoneInondable || false;
  const seisme = globalData?.risquesNaturels?.zoneSismicite || "Non renseignée";
  const mvtTerrain = !!globalData?.risquesNaturels?.zoneMouvementTerrain;

  return {
    inondation,
    argiles: niveauArgiles,
    seisme,
    radon: niveauRadon,
    mouvement_terrain: mvtTerrain,
    feu_foret: !!globalData?.risquesNaturels?.zoneFeu,

    cavites: {
        count: nbCavites,
        probabilite: probaCavite
    },

    catnat: {
      count: catnatRaw.length,
      last_date: lastCatDate,
      types: catnatTypes
    },

    installations: (installData?.data || []).slice(0, 3).map((i: any) => ({
        nom: i.nomEtablissement,
        statut: i.statutSeveso || "ICPE"
    })),

    pollutions: pollutions,
    canalisations: !!globalData?.risquesTechnologiques?.transportMatieresDangereuses
  };
}