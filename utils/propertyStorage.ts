// Anciennes données locales : avant l'API, les biens étaient enregistrés dans
// localStorage.userProperties ({ [email]: PropertyData[] }). Ces helpers servent
// uniquement à proposer leur import vers le serveur, puis à les effacer.
// Les biens sont désormais lus et écrits via propertiesApi (app/lib/api.ts).

import type { PropertyFields } from '@/app/lib/api';

const LEGACY_KEY = 'userProperties';

export interface LegacyProperty {
    id: string;
    data: {
        adresse_ban: string;
        coords?: { lat: number; lon: number };
        cle_interop?: string;
        [key: string]: unknown;
    };
    claimedAt?: string;
}

function readAll(): Record<string, LegacyProperty[]> {
    if (typeof window === 'undefined') return {};
    try {
        const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

/** Biens enregistrés localement pour ce compte (par email), s'il en reste. */
export function getLegacyProperties(email: string): LegacyProperty[] {
    const list = readAll()[email];
    return Array.isArray(list) ? list.filter((p) => p && p.data && typeof p.data.adresse_ban === 'string') : [];
}

/** Retire un bien importé (ou tous si id absent) des données locales de ce compte. */
export function clearLegacyProperties(email: string, id?: string): void {
    if (typeof window === 'undefined') return;
    try {
        const all = readAll();
        if (id) {
            all[email] = (all[email] || []).filter((p) => p.id !== id);
            if (all[email].length === 0) delete all[email];
        } else {
            delete all[email];
        }
        if (Object.keys(all).length === 0) localStorage.removeItem(LEGACY_KEY);
        else localStorage.setItem(LEGACY_KEY, JSON.stringify(all));
        // Ancienne clé « utilisateur courant », plus utilisée
        localStorage.removeItem('currentUser');
    } catch {
        // stockage indisponible : rien à faire
    }
}

export function legacyToPropertyFields(p: LegacyProperty): PropertyFields {
    const { coords, cle_interop, ...rest } = p.data;
    return {
        address_label: p.data.adresse_ban,
        cle_interop: cle_interop ?? null,
        lat: coords?.lat ?? null,
        lon: coords?.lon ?? null,
        building_data: { ...rest },
    };
}
