// Fichier : lib/dpe.ts

export interface DPEData {
    // Champs principaux
    classe_bilan_dpe: string; // A à G
    classe_ges: string;        // A à G
    conso_5_usages_ep_m2: number; // kWhEP/m².an
    emission_ges_5_usages_m2: number; // kgCO2/m².an
    date_etablissement_dpe: string;
    numero_dpe: string;

    // Champs complémentaires pour TabBatiment
    annee_construction_dpe?: string;
    surface_habitable_logement?: number;
    type_batiment?: string;
    type_energie_chauffage?: string;
    type_installation_chauffage?: string;
    type_generateur_chauffage?: string;
    type_vitrage?: string;
    u_mur_exterieur?: number;
    u_plancher_haut_deperditif?: number;

    // Données brutes complètes
    raw?: any;
}

export async function fetchDPE(lat: number, lon: number): Promise<DPEData | null> {
    try {
        // Nouveau dataset ADEME "DPE Logements existants (depuis juillet 2021)"
        // ID: dpe03existant
        // Rayon strict (15m) pour cibler le bon bâtiment
        const datasetId = "dpe03existant";
        const query = `https://data.ademe.fr/data-fair/api/v1/datasets/${datasetId}/lines?geo_distance=${lon},${lat},15&size=1&sort=-date_etablissement_dpe`;

        console.log("⚡ Appel API ADEME (DPE V3)...");
        const res = await fetch(query);

        if (!res.ok) {
            console.error(`Erreur API DPE: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            console.log("Aucun DPE trouvé à cette position.");
            return null;
        }

        const d = data.results[0];

        // Mapping des données vers notre format interne
        // On essaie de mapper un maximum de champs utiles pour l'affichage
        return {
            classe_bilan_dpe: d.etiquette_dpe,
            classe_ges: d.etiquette_ges,
            conso_5_usages_ep_m2: d.conso_5_usages_par_m2_ep,
            emission_ges_5_usages_m2: d.emission_ges_5_usages_par_m2,
            date_etablissement_dpe: d.date_etablissement_dpe,
            numero_dpe: d.numero_dpe,

            // Champs additionnels
            annee_construction_dpe: d.annee_construction?.toString(),
            surface_habitable_logement: d.surface_habitable_logement,
            type_batiment: d.type_batiment,
            type_energie_chauffage: d.type_energie_n1, // Énergie principale
            type_installation_chauffage: d.type_installation_chauffage,
            type_generateur_chauffage: d.type_generateur_chauffage_principal,

            // Isolation (valeurs moyennes ou principales si disponibles)
            u_mur_exterieur: d.ubat_w_par_m2_k, // Approximation, c'est le Ubat global

            // Stockage de l'objet brut pour accès complet si besoin
            raw: d
        };

    } catch (error) {
        console.error("Erreur API DPE:", error);
        return null;
    }
}