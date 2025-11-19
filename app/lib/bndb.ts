// lib/bdnb.ts

// Interface simplifiée des données qu'on veut récupérer
export interface BuildingData {
  dpe_lettre?: string;
  annee_construction?: number;
  materiaux_murs?: string;
  materiaux_toiture?: string;
  hauteur?: number;
  nb_logements?: number;
}

export async function fetchBuildingData(cleInterop: string): Promise<BuildingData | null> {
  if (!cleInterop) return null;

  try {
    // CORRECTION ICI : On pointe vers la vue "/adresse" pour pouvoir filtrer par clé interop
    const url = `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse?limit=1&cle_interop_adr=eq.${cleInterop}`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error("Erreur BDNB:", res.statusText);
      return null;
    }

    const data = await res.json();

    if (data && data.length > 0) {
      const batiment = data[0];
      // On extrait juste ce qui nous intéresse pour le rapport
      return {
        dpe_lettre: batiment.classe_bilan_dpe_moyen, // Ex: 'D', 'E'...
        annee_construction: batiment.annee_construction_reelle_t, // Ex: 1980
        materiaux_murs: batiment.mat_mur_txt, // Ex: 'Béton'
        materiaux_toiture: batiment.mat_toit_txt, // Ex: 'Tuiles'
        hauteur: batiment.hauteur_mean, // Hauteur moyenne
        nb_logements: batiment.nb_log,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Crash appel BDNB:", error);
    return null;
  }
}