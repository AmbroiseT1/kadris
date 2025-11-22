// Fichier : lib/dpe.ts

export interface DPEData {
    classe_energetique: string; // A à G
    classe_ges: string;        // A à G
    conso_ener: number;        // kWh/m².an
    emission_ges: number;      // kgCO2/m².an
    date_etablissement: string;
    id_dpe: string;
    est_neuf: boolean;         // DPE Neuf ou Existant
}

export async function fetchDPE(lat: number, lon: number): Promise<DPEData | null> {
    try {
        // On cherche dans la base ADEME "DPE Logements" (V2 - Post Juillet 2021)
        // Rayon très strict (15m) pour ne pas prendre le DPE du voisin
        const datasetId = "dpe-v2-logements-existants";
        const query = `https://data.ademe.fr/data-fair/api/v1/datasets/${datasetId}/lines?geo_distance=${lon},${lat},15&size=1&sort=-date_etablissement`;

        console.log("⚡ Appel API ADEME (DPE)...");
        const res = await fetch(query);

        if (!res.ok) return null;
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            // Fallback : On pourrait chercher dans les vieux DPE (avant 2021) si besoin
            // Pour l'instant on renvoie null
            return null;
        }

        const d = data.results[0];

        return {
            classe_energetique: d.classe_emission_ges_energie, // DPE V2 combine souvent les deux, sinon prendre etiquette_dpe
            classe_ges: d.etiquette_ges,
            conso_ener: d.conso_3_usages_ep_m2_an, // Conso 3 usages (Chauffage, ECS, Refroidissement)
            emission_ges: d.emission_ges_kgco2_m2_an,
            date_etablissement: d.date_etablissement,
            id_dpe: d.numero_dpe,
            est_neuf: false
        };

    } catch (error) {
        console.error("Erreur API DPE:", error);
        return null;
    }
}