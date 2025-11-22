// Fichier : lib/eau.ts

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

// Liste des paramètres prioritaires à afficher
const TARGET_PARAMS = [
    { key: 'nitrate', label: 'Nitrates', unit: 'mg/L', limit: 50 },
    { key: 'ph', label: 'pH', unit: 'pH', min: 6.5, max: 9 },
    { key: 'chlor', label: 'Chlore', unit: 'mg/L' },
    { key: 'durete', label: 'Dureté (TH)', unit: '°f' },
    { key: 'conductivite', label: 'Conductivité', unit: 'µS/cm' },
    { key: 'escherichia', label: 'E. Coli', unit: 'n/100mL', limit: 0 },
    { key: 'bacteries_coliformes', label: 'Bact. Coliformes', unit: 'n/100mL', limit: 0 }
];

export async function fetchWaterQuality(codeInsee: string): Promise<WaterData | null> {
    try {
        if (!codeInsee) return null;

        // On récupère un historique plus large pour trouver tous les paramètres
        const url = `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${codeInsee}&size=100&sort=desc`;

        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();

        if (!data.data || data.data.length === 0) return null;

        // 1. Trouver la conclusion la plus récente
        const resultWithConclusion = data.data.find((r: any) => r.conclusion_conformite_prelevement) || data.data[0];
        const conclusion = resultWithConclusion.conclusion_conformite_prelevement || "Données techniques disponibles, conclusion non renseignée.";
        const isConforme = !conclusion.toLowerCase().includes("non conforme");

        // 2. Extraire les paramètres clés (le plus récent pour chaque type)
        const params: WaterParameter[] = [];

        for (const target of TARGET_PARAMS) {
            // Recherche floue sur le libellé
            const match = data.data.find((r: any) =>
                r.libelle_parametre &&
                r.libelle_parametre.toLowerCase().includes(target.key)
            );

            if (match) {
                let color: WaterParameter['code_couleur'] = 'gray';
                const val = match.resultat_numerique;

                // Logique de couleur basique
                if (target.limit !== undefined) {
                    color = val > target.limit ? 'red' : 'green';
                } else if (target.min !== undefined && target.max !== undefined) {
                    color = (val < target.min || val > target.max) ? 'red' : 'green';
                }

                params.push({
                    id: target.key,
                    nom: target.label,
                    valeur: val,
                    unite: match.libelle_unite || target.unit,
                    limite: target.limit ? `< ${target.limit}` : undefined,
                    code_couleur: color
                });
            }
        }

        return {
            conformite: isConforme,
            conclusion: conclusion,
            date_prelevement: resultWithConclusion.date_prelevement,
            reseau: resultWithConclusion.nom_distributeur || resultWithConclusion.nom_quartier || "Réseau communal",
            parametres_cles: params
        };

    } catch (error) {
        console.error("Erreur Hub'Eau:", error);
        return null;
    }
}