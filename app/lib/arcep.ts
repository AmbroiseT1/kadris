// Fichier : lib/arcep.ts
//
// ⚠️ « Ma connexion internet » (Arcep) ne publie pas d'API documentée par adresse : les données ouvertes
// sont des fichiers en masse (data.gouv.fr). On interroge les points d'accès utilisés par le site ;
// s'ils ne répondent pas, la rubrique est marquée « Données indisponibles » — jamais de score fictif.

import { SourceUnavailableError } from './sources';

export interface ConnectivityData {
    /** null = l'éligibilité fixe n'a pas pu être vérifiée. */
    fixe: {
        fibre: boolean;       // Vrai si au moins un opérateur propose la fibre
        max_debit: string;    // "1 Gbit/s et plus", "30 Mbit/s"...
        operateurs: string[]; // Liste des opérateurs fibre dispos
        techno_principale: string; // "Fibre", "Câble", "ADSL"
    } | null;
    /** null = la couverture mobile n'a pas pu être vérifiée. */
    mobile: {
        g5: boolean;          // 5G disponible ?
        g4: boolean;          // 4G disponible ?
        meilleur_operateur: string;
        couverture: string;   // "Très bonne", "Bonne"...
    } | null;
    /** Sur 100 ; null tant que fixe ET mobile n'ont pas été vérifiés. */
    score_connectivite: number | null;
}

const BASE_URL = "https://maconnexioninternet.arcep.fr/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getJson(url: string): Promise<any | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data : null;
    } catch {
        return null;
    }
}

/**
 * Lève SourceUnavailableError si ni le fixe ni le mobile n'ont répondu.
 */
export async function fetchConnectivity(lat: number, lon: number, codeBan: string): Promise<ConnectivityData> {
    const urlMobile = `${BASE_URL}/eligibilites/mobile?x=${encodeURIComponent(lon)}&y=${encodeURIComponent(lat)}&srid=4326`;
    const urlFixe = `${BASE_URL}/eligibilites/fixe?codeadr=${encodeURIComponent(codeBan)}`;

    const [mobileRaw, fixeRaw] = await Promise.all([getJson(urlMobile), getJson(urlFixe)]);
    if (!mobileRaw && !fixeRaw) throw new SourceUnavailableError('Arcep');

    let mobile: ConnectivityData['mobile'] = null;
    if (mobileRaw) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const has5G = mobileRaw.some((d: any) => d.code_techno === "5G" && d.code_niveau === "TBC"); // Très Bonne Couverture
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const has4G = mobileRaw.some((d: any) => d.code_techno === "4G" && d.code_niveau === "TBC");
        mobile = {
            g5: has5G,
            g4: has4G,
            meilleur_operateur: mobileRaw[0]?.operateur || "Multiple",
            couverture: has5G ? "Excellente (5G)" : has4G ? "Très Bonne (4G+)" : "Moyenne"
        };
    }

    let fixe: ConnectivityData['fixe'] = null;
    if (fixeRaw) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offresFibre = fixeRaw.filter((d: any) => d.tech_code === "FO");
        const hasFibre = offresFibre.length > 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bestSpeed = [...fixeRaw].sort((a: any, b: any) => b.down_rang - a.down_rang)[0]?.down_nom || "Inconnu";
        fixe = {
            fibre: hasFibre,
            max_debit: bestSpeed,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            operateurs: [...new Set(offresFibre.map((d: any) => d.op_nom))] as string[],
            techno_principale: hasFibre ? "Fibre Optique (FttH)" : "ADSL / VDSL"
        };
    }

    // Score uniquement si les deux volets ont été vérifiés
    let score: number | null = null;
    if (fixe && mobile) {
        score = fixe.fibre ? 60 : fixe.techno_principale.includes("VDSL") ? 30 : 10;
        score += mobile.g5 ? 40 : mobile.g4 ? 20 : 0;
        score = Math.min(score, 100);
    }

    return { fixe, mobile, score_connectivite: score };
}
