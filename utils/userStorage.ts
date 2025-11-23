// User profile storage utilities

export interface UserProfile {
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

/**
 * Get the user profile for a specific email
 */
export const getUserProfile = (email: string): UserProfile | null => {
    if (typeof window === 'undefined') return null;

    const allProfiles = localStorage.getItem('userProfiles');
    if (!allProfiles) return null;

    try {
        const parsed = JSON.parse(allProfiles);
        return parsed[email] || null;
    } catch (error) {
        console.error('Error parsing user profiles:', error);
        return null;
    }
};

/**
 * Get the current user's profile
 */
export const getCurrentUserProfile = (): UserProfile | null => {
    if (typeof window === 'undefined') return null;

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;

    return getUserProfile(currentUser);
};

/**
 * Create or update a user profile
 */
export const saveUserProfile = (profile: UserProfile): void => {
    if (typeof window === 'undefined') return;

    const allProfiles = localStorage.getItem('userProfiles');
    const parsed = allProfiles ? JSON.parse(allProfiles) : {};

    parsed[profile.email] = profile;
    localStorage.setItem('userProfiles', JSON.stringify(parsed));
};

/**
 * Create a new user profile
 */
export const createUserProfile = (
    email: string,
    firstName: string,
    lastName: string
): UserProfile => {
    const profile: UserProfile = {
        email,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
    };

    saveUserProfile(profile);
    return profile;
};

/**
 * Update an existing user profile
 */
export const updateUserProfile = (
    email: string,
    updates: Partial<Omit<UserProfile, 'email' | 'createdAt'>>
): void => {
    const existing = getUserProfile(email);
    if (!existing) {
        console.error('User profile not found');
        return;
    }

    const updated = {
        ...existing,
        ...updates,
    };

    saveUserProfile(updated);
};

/**
 * Delete a user profile
 */
export const deleteUserProfile = (email: string): void => {
    if (typeof window === 'undefined') return;

    const allProfiles = localStorage.getItem('userProfiles');
    if (!allProfiles) return;

    try {
        const parsed = JSON.parse(allProfiles);
        delete parsed[email];
        localStorage.setItem('userProfiles', JSON.stringify(parsed));
    } catch (error) {
        console.error('Error deleting user profile:', error);
    }
};
