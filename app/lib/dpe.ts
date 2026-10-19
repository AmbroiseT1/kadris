// Fichier : lib/dpe.ts

import { isValidCleInterop } from './bndb';
import { SourceUnavailableError } from './sources';

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

    /**
     * Mode de rattachement du DPE au bien :
     * - 'ban'       : DPE déclaré à la même adresse BAN (identifiant_ban) ;
     * - 'proximite' : DPE le plus récent dans un rayon de 15 m — peut concerner un autre logement.
     */
    match?: 'ban' | 'proximite';
    /** Libellé à afficher systématiquement à côté de l'étiquette. */
    match_label?: string;
    /** Nombre de DPE trouvés à l'adresse / dans le rayon. */
    nb_dpe_trouves?: number;

    // Données brutes complètes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw?: any;
}

// Dataset ADEME « DPE Logements existants (depuis juillet 2021) »
const DATASET_URL = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";
const PROXIMITY_RADIUS_M = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryAdeme(params: Record<string, string>): Promise<{ total: number; results: any[] }> {
    const qs = new URLSearchParams({ size: "1", sort: "-date_etablissement_dpe", ...params });
    let res: Response;
    try {
        res = await fetch(`${DATASET_URL}?${qs.toString()}`);
    } catch (e) {
        throw new SourceUnavailableError("ADEME DPE", String(e));
    }
    if (!res.ok) throw new SourceUnavailableError("ADEME DPE", `HTTP ${res.status}`);
    const data = await res.json();
    return { total: data.total ?? data.results?.length ?? 0, results: data.results || [] };
}

function matchLabel(match: DPEData['match'], typeBatiment: string | undefined, total: number): string {
    const isAppart = (typeBatiment || '').toLowerCase().includes('appartement');
    if (match === 'ban') {
        if (isAppart || total > 1) return `DPE d'un logement à cette adresse (${total} DPE recensé${total > 1 ? 's' : ''})`;
        return "DPE du logement à cette adresse";
    }
    return "DPE d'un logement de l'immeuble (rattaché par proximité ≤ 15 m, peut concerner un logement voisin)";
}

/**
 * DPE le plus récent du bien.
 * 1. Recherche par identifiant BAN (`identifiant_ban` = clé d'interopérabilité BAN) quand il est connu ;
 * 2. à défaut, DPE le plus récent dans un rayon de 15 m, explicitement signalé comme tel.
 * Retourne null si aucun DPE ; lève SourceUnavailableError si l'API ADEME ne répond pas.
 */
export async function fetchDPE(lat: number, lon: number, identifiantBan?: string): Promise<DPEData | null> {
    let match: DPEData['match'] = 'proximite';
    let found: { total: number; results: unknown[] } | null = null;

    if (identifiantBan && isValidCleInterop(identifiantBan)) {
        const byBan = await queryAdeme({ qs: `identifiant_ban:"${identifiantBan}"` });
        if (byBan.results.length > 0) {
            found = byBan;
            match = 'ban';
        }
    }
    if (!found) {
        const byGeo = await queryAdeme({ geo_distance: `${lon},${lat},${PROXIMITY_RADIUS_M}` });
        if (byGeo.results.length === 0) return null;
        found = byGeo;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = found.results[0];
    return {
        classe_bilan_dpe: d.etiquette_dpe,
        classe_ges: d.etiquette_ges,
        conso_5_usages_ep_m2: d.conso_5_usages_par_m2_ep,
        emission_ges_5_usages_m2: d.emission_ges_5_usages_par_m2,
        date_etablissement_dpe: d.date_etablissement_dpe,
        numero_dpe: d.numero_dpe,

        annee_construction_dpe: d.annee_construction?.toString(),
        surface_habitable_logement: d.surface_habitable_logement,
        type_batiment: d.type_batiment,
        type_energie_chauffage: d.type_energie_n1, // Énergie principale
        type_installation_chauffage: d.type_installation_chauffage,
        type_generateur_chauffage: d.type_generateur_chauffage_principal,
        u_mur_exterieur: d.ubat_w_par_m2_k, // Approximation : Ubat global

        match,
        match_label: matchLabel(match, d.type_batiment, found.total),
        nb_dpe_trouves: found.total,
        raw: d
    };
}
