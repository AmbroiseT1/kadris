// Fichier : lib/eau.ts
// Qualité de l'eau distribuée — API Hub'Eau « qualite_eau_potable » (résultats d'analyses du contrôle sanitaire).
// Les paramètres sont identifiés par leur code SANDRE (`code_parametre`), jamais par recherche de texte dans
// le libellé (« ph » correspondait aussi à « phosphore »).

import { SourceUnavailableError } from './sources';

export interface WaterParameter {
    id: string;
    nom: string;
    valeur: string | number;
    unite: string;
    limite?: string;
    code_couleur?: 'green' | 'orange' | 'red' | 'gray';
}

export interface WaterData {
    conformite: boolean;
    conclusion: string;
    date_prelevement: string;
    reseau: string;
    parametres_cles: WaterParameter[];
}

interface TargetParam {
    code: string; // Code SANDRE
    label: string;
    unit: string;
    /** Limite de qualité réglementaire (valeur maximale). 0 est une vraie limite (bactériologie). */
    limit?: number;
    min?: number;
    max?: number;
}

// Codes SANDRE (référentiel des paramètres) — https://www.sandre.eaufrance.fr/
export const TARGET_PARAMS: TargetParam[] = [
    { code: '1340', label: 'Nitrates', unit: 'mg/L', limit: 50 },
    { code: '1302', label: 'pH', unit: 'unité pH', min: 6.5, max: 9 },
    { code: '1398', label: 'Chlore libre', unit: 'mg/L' },
    { code: '7972', label: 'Dureté (TH)', unit: '°f' },
    { code: '1303', label: 'Conductivité à 25 °C', unit: 'µS/cm' },
    { code: '1382', label: 'Plomb', unit: 'µg/L', limit: 10 },
    { code: '1449', label: 'E. coli', unit: 'n/100mL', limit: 0 },
    { code: '6455', label: 'Entérocoques', unit: 'n/100mL', limit: 0 },
    { code: '1447', label: 'Bact. coliformes', unit: 'n/100mL', limit: 0 },
];

const BASE_URL = 'https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryHubeau(codeCommune: string): Promise<any[]> {
    const qs = new URLSearchParams({
        code_commune: codeCommune,
        code_parametre: TARGET_PARAMS.map(p => p.code).join(','),
        size: '200',
        sort: 'desc',
    });
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}?${qs.toString()}`);
    } catch (e) {
        throw new SourceUnavailableError("Hub'Eau", String(e));
    }
    // 206 = réponse paginée partielle (normal sur Hub'Eau)
    if (!res.ok) throw new SourceUnavailableError("Hub'Eau", `HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
}

/** Hub'Eau indexe Paris/Lyon/Marseille sur la commune entière, la clé BAN sur l'arrondissement. */
function plmParent(code: string): string | undefined {
    const n = parseInt(code, 10);
    if (n >= 75101 && n <= 75120) return '75056';
    if (n >= 69381 && n <= 69389) return '69123';
    if (n >= 13201 && n <= 13216) return '13055';
    return undefined;
}

function colorFor(target: TargetParam, val: number): WaterParameter['code_couleur'] {
    if (Number.isNaN(val)) return 'gray';
    if (target.limit !== undefined) return val > target.limit ? 'red' : 'green';
    if (target.min !== undefined && target.max !== undefined) return val < target.min || val > target.max ? 'red' : 'green';
    return 'gray';
}

/**
 * Retourne null s'il n'existe aucune analyse publiée pour la commune ;
 * lève SourceUnavailableError si Hub'Eau ne répond pas.
 */
export async function fetchWaterQuality(codeInsee: string): Promise<WaterData | null> {
    if (!codeInsee) return null;

    let rows = await queryHubeau(codeInsee);
    const parent = plmParent(codeInsee);
    if (rows.length === 0 && parent) rows = await queryHubeau(parent);
    if (rows.length === 0) return null;

    // 1. Conclusion du prélèvement le plus récent
    const latest = rows.find(r => r.conclusion_conformite_prelevement) || rows[0];
    const conclusion: string = latest.conclusion_conformite_prelevement || "Données techniques disponibles, conclusion non renseignée.";
    const nonConformeFlag = latest.conformite_limites_bact_prelevement === 'N' || latest.conformite_limites_pc_prelevement === 'N';
    const isConforme = !nonConformeFlag && !conclusion.toLowerCase().includes('non conforme');

    // 2. Valeur la plus récente pour chaque code SANDRE (résultats triés par date décroissante)
    const params: WaterParameter[] = [];
    for (const target of TARGET_PARAMS) {
        const match = rows.find(r => String(r.code_parametre) === target.code && r.resultat_numerique !== null && r.resultat_numerique !== undefined);
        if (!match) continue;
        const val = Number(match.resultat_numerique);
        params.push({
            id: target.code,
            nom: target.label,
            valeur: val,
            unite: match.libelle_unite || target.unit,
            limite: target.limit !== undefined
                ? `≤ ${target.limit}`
                : target.min !== undefined && target.max !== undefined ? `${target.min} – ${target.max}` : undefined,
            code_couleur: colorFor(target, val),
        });
    }

    return {
        conformite: isConforme,
        conclusion,
        date_prelevement: latest.date_prelevement,
        reseau: latest.nom_distributeur || latest.nom_uge || latest.nom_quartier || "Réseau communal",
        parametres_cles: params
    };
}
