import { BuildingData } from "@/app/lib/types";

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
        argiles: "Moyen",
        inondation: "Faible",
        radon: "Faible",
        sismicite: "Zone 1",
        pdf_url: "https://files.georisques.fr/errial/2023/10/25/ERP_2023_10_25_00000.pdf" // Fake URL
    },
    urbanisme: {
        zone: "Ua",
        description: "Zone urbaine dense",
        dispositions: ["Hauteur max: 15m", "Emprise au sol: 60%"]
    },
    quartier: {
        nom: "Amérique",
        commerces: 12,
        ecoles: 3,
        transports: 5
    },
    dpe_reel: {
        lettre_conso: "E",
        lettre_ges: "E",
        conso_primaire: 280,
        ges: 55
    }
};
