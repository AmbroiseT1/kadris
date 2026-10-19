import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ResourceState {
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

/** Chargement / erreur / vide communs aux widgets du tableau de bord. Renvoie null si le contenu doit s'afficher. */
export function WidgetStatus({ loading, error, onRetry, isEmpty, emptyText }: ResourceState & { isEmpty: boolean; emptyText: string }) {
    if (loading) {
        return (
            <div className="flex items-center gap-2 py-6 text-sm text-texte-2 font-mono">
                <Loader2 size={16} className="animate-spin" /> Chargement...
            </div>
        );
    }
    if (error) {
        return (
            <div role="alert" className="py-6 text-sm text-alerte">
                {error}{' '}
                <button onClick={onRetry} className="underline font-medium hover:text-alerte">Réessayer</button>
            </div>
        );
    }
    if (isEmpty) {
        return <div className="text-center py-8 text-texte-2 font-mono text-sm">{emptyText}</div>;
    }
    return null;
}
