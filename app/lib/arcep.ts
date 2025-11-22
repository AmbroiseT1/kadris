// Fichier : lib/arcep.ts

export interface ConnectivityData {
    fixe: {
        fibre: boolean;       // Vrai si au moins un opérateur propose la fibre
        max_debit: string;    // "1 Gbit/s et plus", "30 Mbit/s"...
        operateurs: string[]; // Liste des opérateurs fibre dispos
        techno_principale: string; // "Fibre", "Câble", "ADSL"
    };
    mobile: {
        g5: boolean;          // 5G disponible ?
        g4: boolean;          // 4G disponible ?
        meilleur_operateur: string; // Celui qui capte le mieux
        couverture: string;   // "Très bonne", "Bonne"...
    };
    score_connectivite: number; // Sur 100
}

export async function fetchConnectivity(lat: number, lon: number, codeBan: string): Promise<ConnectivityData | null> {
    try {
        // L'API Arcep publique (base URL standard)
        const BASE_URL = "https://maconnexioninternet.arcep.fr/api";

        // 1. APPEL MOBILE (Lat/Lon)
        // SRID 4326 = Coordonnées GPS standard (WGS84)
        const urlMobile = `${BASE_URL}/eligibilites/mobile?x=${lon}&y=${lat}&srid=4326`;

        // 2. APPEL FIXE (Code BAN)
        // Le code BAN (ex: 59350_1530_00012) correspond au 'codeadr' de l'ARCEP
        const urlFixe = `${BASE_URL}/eligibilites/fixe?codeadr=${codeBan}`;

        console.log("📡 Appel ARCEP (Connectivité)...");

        const [resMobile, resFixe] = await Promise.all([
            fetch(urlMobile).catch(err => null), // On catch pour ne pas tout planter si un endpoint échoue
            fetch(urlFixe).catch(err => null)
        ]);

        // --- TRAITEMENT MOBILE ---
        let mobileData = { g5: false, g4: false, meilleur_operateur: "Inconnu", couverture: "Inconnue" };
        if (resMobile && resMobile.ok) {
            const data = await resMobile.json();
            // On cherche la meilleure techno (5G > 4G)
            const has5G = data.some((d: any) => d.code_techno === "5G" && d.code_niveau === "TBC"); // Très Bonne Couverture
            const has4G = data.some((d: any) => d.code_techno === "4G" && d.code_niveau === "TBC");

            mobileData = {
                g5: has5G,
                g4: has4G,
                meilleur_operateur: data[0]?.operateur || "Multiple",
                couverture: has5G ? "Excellente (5G)" : has4G ? "Très Bonne (4G+)" : "Moyenne"
            };
        }

        // --- TRAITEMENT FIXE (FIBRE) ---
        let fixeData = { fibre: false, max_debit: "Inconnu", operateurs: [] as string[], techno_principale: "ADSL/Inconnu" };
        if (resFixe && resFixe.ok) {
            const data = await resFixe.json();
            // On filtre pour voir si la Fibre (FO) est dispo
            const offresFibre = data.filter((d: any) => d.tech_code === "FO");
            const hasFibre = offresFibre.length > 0;

            // On récupère le meilleur débit théorique
            const bestSpeed = data.sort((a: any, b: any) => b.down_rang - a.down_rang)[0]?.down_nom || "Inconnu";

            fixeData = {
                fibre: hasFibre,
                max_debit: bestSpeed,
                operateurs: [...new Set(offresFibre.map((d: any) => d.op_nom))] as string[],
                techno_principale: hasFibre ? "Fibre Optique (FttH)" : "ADSL / VDSL"
            };
        }

        // --- SCORING ---
        let score = 0;
        if (fixeData.fibre) score += 60;
        else if (fixeData.techno_principale.includes("VDSL")) score += 30;
        else score += 10;

        if (mobileData.g5) score += 40;
        else if (mobileData.g4) score += 20;

        return {
            fixe: fixeData,
            mobile: mobileData,
            score_connectivite: Math.min(score, 100)
        };

    } catch (error) {
        console.error("Erreur ARCEP:", error);
        // Fallback propre en cas d'erreur
        return {
            fixe: { fibre: false, max_debit: "Non testé", operateurs: [], techno_principale: "Non testé" },
            mobile: { g5: false, g4: false, meilleur_operateur: "-", couverture: "Non testé" },
            score_connectivite: 0
        };
    }
}
