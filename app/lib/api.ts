import axios from 'axios';

// On utilise la variable d'environnement ou une valeur par défaut pour le dev local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
});

// Intercepteur pour injecter le token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (Token expiré ou invalide)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                // La redirection vers /login est gérée par AuthContext
            }
        }
        return Promise.reject(error);
    }
);

/** Message d'erreur lisible (français) pour une erreur renvoyée par l'API. */
export function apiErrorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez réessayer."): string {
    if (!axios.isAxiosError(error)) return fallback;
    const status = error.response?.status;
    if (!error.response) return "Serveur injoignable. Vérifiez votre connexion.";
    if (status === 429) return "Trop de tentatives, réessayez plus tard.";
    if (status === 413) return "Fichier trop volumineux (10 Mo maximum).";
    if (status === 415) return "Format non supporté (PDF, JPEG, PNG, WEBP ou HEIC uniquement).";
    if (status === 404) return "Élément introuvable.";
    if (status === 401) return "Session expirée, veuillez vous reconnecter.";
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
    if (status === 422) return "Certains champs sont invalides.";
    return fallback;
}

// ---------------------------------------------------------------------------
// Espace propriétaire
// ---------------------------------------------------------------------------

export type OwnershipStatus = 'pending' | 'verified' | 'rejected';

export interface PropertyFields {
    address_label: string;
    cle_interop?: string | null;
    lat?: number | null;
    lon?: number | null;
    code_insee?: string | null;
    building_data?: Record<string, unknown> | null;
}

export interface Property extends PropertyFields {
    id: string;
    user_id: string;
    ownership_status: OwnershipStatus;
    ownership_comment?: string | null;
    has_ownership_proof: boolean;
    created_at: string;
}

export type WorkStatus = 'planned' | 'in_progress' | 'done';

export interface WorkInput {
    title: string;
    category?: string | null;
    date?: string | null;
    cost?: number | null;
    provider?: string | null;
    description?: string | null;
    status?: WorkStatus;
}
export interface Work extends WorkInput {
    id: string;
    property_id: string;
    status: WorkStatus;
    created_at: string;
}

export type ExpenseFrequency = 'mensuel' | 'annuel' | 'ponctuel';

export interface ExpenseInput {
    label: string;
    category?: string | null;
    amount: number;
    frequency?: ExpenseFrequency | null;
    provider?: string | null;
    date?: string | null;
}
export interface Expense extends ExpenseInput {
    id: string;
    property_id: string;
    created_at: string;
}

export type TaskPriority = 'BASSE' | 'MOYENNE' | 'URGENTE';

export interface TaskInput {
    title: string;
    category?: string | null;
    due_date?: string | null;
    done?: boolean;
    priority?: TaskPriority | null;
    estimated_cost?: number | null;
}
export interface Task extends TaskInput {
    id: string;
    property_id: string;
    done: boolean;
    created_at: string;
}

export const DOC_TYPE_OWNERSHIP_PROOF = 'preuve_propriete';

export interface PropertyDocument {
    id: string;
    property_id: string;
    title: string;
    doc_type: string;
    date?: string | null;
    description?: string | null;
    original_filename?: string | null;
    mime_type: string;
    size: number;
    ai_analysis?: Record<string, unknown> | null;
    created_at: string;
}

export interface DocumentUploadInput {
    file: File;
    title: string;
    doc_type: string;
    date?: string | null;
    description?: string | null;
    /** Résultat de /documents/analyze déjà obtenu (évite un second appel à Gemini). */
    ai_analysis?: Record<string, unknown> | null;
}

export interface Note {
    id: string;
    property_id?: string | null;
    content: string;
    updated_at: string;
}

export interface AdminProperty extends Property {
    owner_email: string;
    proof_documents: Pick<PropertyDocument, 'id' | 'title' | 'original_filename' | 'mime_type' | 'size' | 'created_at'>[];
}

const p = (id: string) => `/properties/${encodeURIComponent(id)}`;

export const propertiesApi = {
    list: async (): Promise<Property[]> => (await api.get('/properties')).data,
    get: async (id: string): Promise<Property> => (await api.get(p(id))).data,
    /** Création avec justificatif de propriété (obligatoire sauf pour un administrateur). */
    create: async (fields: PropertyFields, proof: File | null): Promise<Property> => {
        const form = new FormData();
        form.append('payload', JSON.stringify(fields));
        if (proof) form.append('proof', proof);
        return (await api.post('/properties', form)).data;
    },
    update: async (id: string, fields: Partial<PropertyFields>): Promise<Property> =>
        (await api.patch(p(id), fields)).data,
    remove: async (id: string): Promise<void> => { await api.delete(p(id)); },
};

function childApi<TIn, TOut>(segment: string) {
    return {
        list: async (propertyId: string): Promise<TOut[]> =>
            (await api.get(`${p(propertyId)}/${segment}`)).data,
        create: async (propertyId: string, body: TIn): Promise<TOut> =>
            (await api.post(`${p(propertyId)}/${segment}`, body)).data,
        update: async (propertyId: string, id: string, body: Partial<TIn>): Promise<TOut> =>
            (await api.patch(`${p(propertyId)}/${segment}/${encodeURIComponent(id)}`, body)).data,
        remove: async (propertyId: string, id: string): Promise<void> => {
            await api.delete(`${p(propertyId)}/${segment}/${encodeURIComponent(id)}`);
        },
    };
}

export const worksApi = childApi<WorkInput, Work>('works');
export const expensesApi = childApi<ExpenseInput, Expense>('expenses');
export const tasksApi = childApi<TaskInput, Task>('tasks');

export const documentsApi = {
    list: async (propertyId: string): Promise<PropertyDocument[]> =>
        (await api.get(`${p(propertyId)}/documents`)).data,
    upload: async (propertyId: string, input: DocumentUploadInput): Promise<PropertyDocument> => {
        const form = new FormData();
        form.append('file', input.file);
        form.append('title', input.title);
        form.append('doc_type', input.doc_type);
        if (input.date) form.append('date', input.date);
        if (input.description) form.append('description', input.description);
        if (input.ai_analysis) form.append('ai_analysis', JSON.stringify(input.ai_analysis));
        return (await api.post(`${p(propertyId)}/documents`, form)).data;
    },
    remove: async (propertyId: string, id: string): Promise<void> => {
        await api.delete(`${p(propertyId)}/documents/${encodeURIComponent(id)}`);
    },
    /** Téléchargement authentifié (le fichier n'a pas d'URL publique). */
    download: async (propertyId: string, doc: Pick<PropertyDocument, 'id' | 'title' | 'original_filename'>): Promise<void> => {
        const res = await api.get(`${p(propertyId)}/documents/${encodeURIComponent(doc.id)}/download`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(res.data as Blob);
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.original_filename || doc.title;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        }
    },
};

/** Résultat de l'analyse IA (voir backend/app/schemas/document.py). */
export interface AnalyzedDocument {
    detected_type: 'INVOICE' | 'QUOTE' | 'INSURANCE' | 'TAX_NOTICE' | 'PROPERTY_DEED' | 'DPE' | 'UNKNOWN';
    [key: string]: unknown;
}

/**
 * Envoie le fichier à Google (Gemini) pour analyse. À n'appeler qu'après le consentement
 * explicite de l'utilisateur. Le fichier n'est pas conservé par cet appel.
 */
export async function analyzeDocument(file: File): Promise<AnalyzedDocument> {
    const upload = new FormData();
    upload.append('file', file);
    return (await api.post('/documents/analyze', upload)).data;
}

export const notesApi = {
    list: async (propertyId?: string | null): Promise<Note[]> =>
        (await api.get('/notes', { params: propertyId ? { property_id: propertyId } : undefined })).data,
    create: async (content: string, propertyId?: string | null): Promise<Note> =>
        (await api.post('/notes', { content, property_id: propertyId ?? null })).data,
    update: async (id: string, content: string): Promise<Note> =>
        (await api.patch(`/notes/${encodeURIComponent(id)}`, { content })).data,
    remove: async (id: string): Promise<void> => { await api.delete(`/notes/${encodeURIComponent(id)}`); },
};

export const adminApi = {
    listProperties: async (status: OwnershipStatus | 'all' = 'pending'): Promise<AdminProperty[]> =>
        (await api.get('/admin/properties', { params: { status } })).data,
    setOwnership: async (id: string, status: 'verified' | 'rejected', comment?: string): Promise<AdminProperty> =>
        (await api.post(`/admin/properties/${encodeURIComponent(id)}/ownership`, { status, comment: comment || null })).data,
};
