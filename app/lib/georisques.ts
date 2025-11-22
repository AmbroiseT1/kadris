// Fichier : lib/georisques.ts

export interface RiskData {
  pdf_url: string;
  lat: number;
  lon: number;
  argiles?: string;
  inondation?: boolean;
  cavites?: { count: number };
  installations?: any[];
  catnat?: { count: number };
}

/**
 * Génère l'URL du rapport PDF officiel Géorisques.
 * L'API ne nécessite pas de fetch côté serveur, le lien est direct.
 * Format requis : latlon=longitude,latitude
 */
export async function fetchRisks(lat: number, lon: number): Promise<RiskData | null> {
  try {
    // Géorisques demande longitude,latitude (Attention à l'ordre !)
    // On garde une précision raisonnable (5 décimales)
    const latFixed = lat.toFixed(5);
    const lonFixed = lon.toFixed(5);

    // Construction de l'URL selon la documentation officielle
    // Endpoint : /api/v1/rapport_pdf?latlon={lon},{lat}
    const pdfUrl = `https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=${lonFixed},${latFixed}`;

    // On retourne directement l'URL.
    // Pas besoin de fetch() ici car c'est un lien de téléchargement direct pour le navigateur.
    return {
      pdf_url: pdfUrl,
      lat: lat,
      lon: lon
    };

  } catch (error) {
    console.error("Erreur génération URL Géorisques:", error);
    return null;
  }
}