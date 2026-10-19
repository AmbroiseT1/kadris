export interface RnbBuilding {
    rnb_id: string;
    status: string;
    point: {
        type: string;
        coordinates: [number, number];
    };
    addresses: {
        street_number: string;
        street_rep?: string;
        street: string;
        city_name: string;
        city_zipcode: string;
    }[];
}

/**
 * Fetches the closest building from the RNB API based on coordinates.
 * @param lat Latitude
 * @param lon Longitude
 * @returns The closest building or null if not found
 */
export async function fetchRnbBuilding(lat: number, lon: number): Promise<RnbBuilding | null> {
    try {
        // RNB API expects "lat,lon" format
        // Using a small radius (e.g., 20m) to ensure we get the specific building
        const response = await fetch(`https://rnb-api.beta.gouv.fr/api/alpha/buildings/closest/?point=${lat},${lon}&radius=20`);

        if (!response.ok) {
            console.error(`RNB API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // The first result is the closest one
            return data.results[0];
        }

        return null;
    } catch (error) {
        console.error("Error fetching RNB building:", error);
        return null;
    }
}
