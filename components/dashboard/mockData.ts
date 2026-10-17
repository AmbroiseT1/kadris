import { BuildingData } from "@/app/lib/types";
import type { CategoryData } from "@/app/lib/quartier";

const emptyCategory = (count: number): CategoryData => ({ count, score_norm: 0, items: [] });

export const MOCK_BUILDING_DATA: BuildingData = {
    adresse_ban: "12 Rue des Lilas, 75019 Paris",
    annee_construction: "1920",
    dpe_lettre: "E",
    materiaux_murs: "Briques pleines",
    materiaux_toiture: "Tuiles mécaniques",
    hauteur: 12.5,
    nb_niveaux: 3,
    surface_sol: 145,
    altitude: 42,
    nb_logements: 1,
    usage: "Résidentiel",
    fiabilite: "Élevée",
    coords: { lat: 48.88, lon: 2.38 },
    risques_detailles: {
        pdf_url: "https://files.georisques.fr/errial/2023/10/25/ERP_2023_10_25_00000.pdf", // Fake URL
        lat: 48.88,
        lon: 2.38,
        argiles: "Moyen",
        inondation: false,
    },
    urbanisme: {
        zonage: {
            code: "Ua",
            libelle: "Zone urbaine dense",
            type: "U",
            conseil: "Hauteur max: 15m, emprise au sol: 60%",
            is_constructible: true,
            url_doc: null,
        },
        document: null,
        contraintes: [],
        servitudes: [],
    },
    quartier: {
        categories: {
            education: emptyCategory(3),
            sante: emptyCategory(0),
            alimentation: emptyCategory(12),
            restauration: emptyCategory(0),
            transport: emptyCategory(5),
            loisirs: emptyCategory(0),
            securite: emptyCategory(0),
            administration: emptyCategory(0),
        },
        nuisances: {
            autoroute: { present: false, distance: 0, name: "" },
            ferre: { present: false, distance: 0, name: "" },
            aerien: { present: false, distance: 0, name: "" },
            industriel: { present: false, distance: 0, name: "" },
            score_calme: 80,
        },
        scores: { famille: 70, investisseur: 65, qualite_vie: 72, fiabilite: 50 },
    },
    dpe_reel: {
        classe_bilan_dpe: "E",
        classe_ges: "E",
        conso_5_usages_ep_m2: 280,
        emission_ges_5_usages_m2: 55,
        date_etablissement_dpe: "2023-01-01",
        numero_dpe: "MOCK",
    }
};
