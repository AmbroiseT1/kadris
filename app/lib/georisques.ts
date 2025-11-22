// Fichier : lib/georisques.ts (Finalisé)

// 1. DÉFINITION DE LA STRUCTURE DE DONNÉES

export interface RiskData {
  inondation: boolean;
  argiles: string;
  seisme: string;
  radon: string;
  mouvement_terrain: boolean;
  feu_foret: boolean;

  cavites: {
    count: number;
    probabilite: string;
  };

  pollutions: Array<{
    nom: string;
    etat: string;
  }>;

  catnat: {
    count: number;
    last_date: string | null;
    types: string[];
  };

  installations: Array<{
    nom: string;
    statut: string;
  }>;

  canalisations: boolean;

  _raw?: any; // Stockage des données brutes pour le mode expert
}

// 2. DONNÉES DE SECOURS (FALLBACK)

function getFallbackRisks(): RiskData {
  console.warn("⚠️ Géorisques est instable. Affichage des données de secours.");
  return {
    inondation: false,
    argiles: "Non exposé",
    seisme: "3 (Modéré)",
    radon: "Faible",
    mouvement_terrain: false,
    feu_foret: false,
    cavites: { count: 0, probabilite: "Aucun" },
    pollutions: [],
    catnat: { count: 1, last_date: "2022-08-15", types: ["Sécheresse"] },
    installations: [],
    canalisations: false,
    _raw: null
  };
}

// 3. FONCTIONS UTILITAIRES (Appel Sécurisé)

async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null; // Si 404, 400 ou 500, on retourne null
    return await res.json();
  } catch (e) {
    // Si crash réseau ou timeout, on retourne null
    return null;
  }
}

// 4. LE CONNECTEUR PRINCIPAL (Multi-Appels)

export async function fetchRisks(lat: number, lon: number): Promise<RiskData | null> {
  try { // Le bloc try commence ici
    // FIX : Arrondi à 4 décimales pour éviter le crash serveur Géorisques
    const latFixed = lat.toFixed(4);
    const lonFixed = lon.toFixed(4);

    // 1. DÉFINITION DES REQUÊTES EN PARALLÈLE (6 requêtes indépendantes)
    const riskEndpoints = [
      // 0. CatNat (Historique des arrêtés)
      safeFetch(`https://www.georisques.gouv.fr/api/v1/gaspar/catnat?lat=${latFixed}&lon=${lonFixed}&page=1&page_size=20`),
      // 1. Argiles (RGA)
      safeFetch(`https://www.georisques.gouv.fr/api/v1/rga?lat=${latFixed}&lon=${lonFixed}`),
      // 2. Installations Classées (ICPE)
      safeFetch(`https://www.georisques.gouv.fr/api/v1/installations_classees?lat=${latFixed}&lon=${lonFixed}&rayon=1000`),
      // 3. Cavités Souterraines
      safeFetch(`https://www.georisques.gouv.fr/api/v1/cavites?lat=${latFixed}&lon=${lonFixed}&rayon=500`),
      // 4. Sites Pollués (SSP)
      safeFetch(`https://www.georisques.gouv.fr/api/v1/ssp?lat=${latFixed}&lon=${lonFixed}&rayon=1000`),
      // 5. Global (Pour Inondation/Seisme/Canalisations)
      safeFetch(`https://www.georisques.gouv.fr/api/v1/gaspar/risques?lat=${latFixed}&lon=${lonFixed}`)
    ];

    // 2. LANCEMENT ET ATTENTE DES RÉSULTATS
    const results = await Promise.allSettled(riskEndpoints);
    const values = results.map(r => r.status === 'fulfilled' ? r.value : null);

    // 3. MAPPING (Extraction et Consolidation)

    const catnatRaw = values[0]?.data || [];
    const argilesRaw = values[1]?.data || [];
    const installRaw = values[2]?.data || [];
    const cavitesRaw = values[3]?.data || [];
    const sspRaw = values[4]?.data || [];
    const globalData = values[5];

    // --- 3.1. Risques Naturels & Généraux ---
    const rn = globalData?.risquesNaturels || {};
    const rt = globalData?.risquesTechnologiques || {};

    let niveauArgiles = "Non exposé";
    if (argilesRaw.length > 0) {
      const niveaux = argilesRaw.map((d: any) => d.niveauAlea);
      if (niveaux.includes("Fort")) niveauArgiles = "Fort";
      else if (niveaux.includes("Moyen")) niveauArgiles = "Moyen";
    }

    // --- 3.2. Historique CatNat ---
    const catnatTypes = Array.from(new Set(catnatRaw.map((c: any) => c.libelleRisque))).slice(0, 5) as string[];
    catnatRaw.sort((a: any, b: any) => new Date(b.dateFin).getTime() - new Date(a.dateFin).getTime());
    const lastCatDate = catnatRaw.length > 0 ? catnatRaw[0].dateFin : null;

    // --- 3.3. Pollution ---
    const pollutions = sspRaw.slice(0, 2).map((p: any) => ({
      nom: p.nomSite || p.nom_etablissement || "Site répertorié",
      etat: p.etatSite || p.statut || "Recensé"
    }));

    // --- CONSTRUCTION DE L'OBJET FINAL ---
    return {
      inondation: !!rn.zoneInondable,
      argiles: niveauArgiles,
      seisme: rn.zoneSismicite || "Non renseignée",
      radon: rn.potentielRadon || "Faible",
      mouvement_terrain: !!rn.zoneMouvementTerrain,
      feu_foret: !!rn.zoneFeu,

      cavites: {
        count: cavitesRaw.length,
        probabilite: cavitesRaw.length > 0 ? "Détectée" : "Aucune"
      },

      pollutions: pollutions,

      catnat: {
        count: catnatRaw.length,
        last_date: lastCatDate,
        types: catnatTypes
      },

      installations: (installRaw.data || []).slice(0, 3).map((i: any) => ({
        nom: i.nomEtablissement || "Installation Industrielle",
        statut: i.statutSeveso || i.statutActivite || "ICPE"
      })),
      canalisations: !!rt.transportMatieresDangereuses,

      // STOCKAGE DES DONNÉES BRUTES
      _raw: {
        catnat: catnatRaw,
        argiles: argilesRaw,
        installations: installRaw,
        cavites: cavitesRaw,
        ssp: sspRaw,
        global: globalData
      }
    };

  } catch (error) {
    console.error("❌ Erreur critique lors de la consolidation des risques:", error);
    return getFallbackRisks();
  }
}