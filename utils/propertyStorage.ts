// Property storage utilities for user-specific data management

export interface PropertyData {
    id: string;
    data: {
        adresse_ban: string;
        annee_construction: string;
        dpe_lettre: string;
        materiaux_murs: string;
        materiaux_toiture: string;
        hauteur: number;
        nb_niveaux: number;
        surface_sol: number;
        nb_logements: number;
        usage: string;
        coords?: { lat: number; lon: number };
        cle_interop?: string;
    };
    claimedAt: string;
}

/**
 * Get the currently logged-in user's email
 */
export const getCurrentUser = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('currentUser');
};

/**
 * Set the current user (on login/signup)
 */
export const setCurrentUser = (email: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('currentUser', email);
};

/**
 * Clear the current user (on logout)
 */
export const clearCurrentUser = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('currentUser');
};

/**
 * Get all properties for a specific user
 */
export const getUserProperties = (email: string): PropertyData[] => {
    if (typeof window === 'undefined') return [];

    const allData = localStorage.getItem('userProperties');
    if (!allData) return [];

    try {
        const parsed = JSON.parse(allData);
        return parsed[email] || [];
    } catch (error) {
        console.error('Error parsing user properties:', error);
        return [];
    }
};

/**
 * Get properties for the currently logged-in user
 */
export const getCurrentUserProperties = (): PropertyData[] => {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    return getUserProperties(currentUser);
};

/**
 * Add a property to a specific user's collection
 */
export const addUserProperty = (email: string, property: PropertyData): void => {
    if (typeof window === 'undefined') return;

    const allData = localStorage.getItem('userProperties');
    const parsed = allData ? JSON.parse(allData) : {};

    if (!parsed[email]) {
        parsed[email] = [];
    }

    parsed[email].push(property);
    localStorage.setItem('userProperties', JSON.stringify(parsed));
};

/**
 * Add a property to the current user's collection
 */
export const addPropertyToCurrentUser = (property: PropertyData): void => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('No current user - cannot add property');
        return;
    }
    addUserProperty(currentUser, property);
};

/**
 * Check if current user is admin
 */
export const isAdminUser = (): boolean => {
    const currentUser = getCurrentUser();
    return currentUser?.toLowerCase() === 'amb.torris@gmail.com';
};

/**
 * Migrate old global properties to user-specific storage
 * (Run once to migrate existing data)
 */
export const migrateOldProperties = (userEmail: string): void => {
    if (typeof window === 'undefined') return;

    const oldProperties = localStorage.getItem('userProperties');
    if (!oldProperties) return;

    try {
        const parsed = JSON.parse(oldProperties);
        // Check if it's already in the new format
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Already migrated
            return;
        }

        // Old format - array of properties
        if (Array.isArray(parsed)) {
            const newFormat = {
                [userEmail]: parsed
            };
            localStorage.setItem('userProperties', JSON.stringify(newFormat));
        }
    } catch (error) {
        console.error('Error migrating properties:', error);
    }
};
