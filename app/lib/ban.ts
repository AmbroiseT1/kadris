// Fichier : lib/ban.ts

export interface BanFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    properties: {
        label: string;
        score: number;
        housenumber?: string;
        id: string;
        type: string;
        name: string;
        postcode: string;
        citycode: string;
        x: number;
        y: number;
        city: string;
        context: string;
        importance: number;
        street: string;
    };
}

export interface BanResponse {
    type: string;
    version: string;
    features: BanFeature[];
    attribution: string;
    licence: string;
    query: string;
    limit: number;
}

/**
 * Effectue un géocodage inverse via l'API Base Adresse Nationale (BAN).
 * @param lat Latitude
 * @param lon Longitude
 * @returns L'adresse formatée ou null si non trouvée
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
    try {
        const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data: BanResponse = await res.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].properties.label;
        }
        return null;
    } catch (error) {
        console.error("Erreur reverseGeocode:", error);
        return null;
    }
}
