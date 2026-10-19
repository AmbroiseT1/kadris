import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '@/app/lib/api';

export interface Resource<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    reload: () => void;
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

const EMPTY: never[] = [];

/** Liste chargée depuis l'API pour un bien, avec états de chargement et d'erreur. */
export function useResource<T>(
    propertyId: string | null,
    fetcher: (propertyId: string) => Promise<T[]>,
    errorText: string,
): Resource<T> {
    // Résultat de la dernière requête terminée, associé à sa clé (bien + version) :
    // « loading » et « error » en sont dérivés, sans setState synchrone dans l'effet.
    const [result, setResult] = useState<{ key: string | null; items: T[]; error: string | null }>({
        key: null,
        items: [],
        error: null,
    });
    const [version, setVersion] = useState(0);
    const requestKey = propertyId ? `${propertyId}:${version}` : null;

    useEffect(() => {
        if (!propertyId || !requestKey) return;
        let cancelled = false;
        fetcher(propertyId)
            .then((data) => { if (!cancelled) setResult({ key: requestKey, items: data, error: null }); })
            .catch((e) => {
                if (!cancelled) {
                    setResult((r) => ({ key: requestKey, items: r.items, error: apiErrorMessage(e, errorText) }));
                }
            });
        return () => { cancelled = true; };
        // fetcher / errorText sont des constantes du module appelant
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId, version]);

    const setItems = useCallback<React.Dispatch<React.SetStateAction<T[]>>>((action) => {
        setResult((r) => ({ ...r, items: typeof action === 'function' ? action(r.items) : action }));
    }, []);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    const items: T[] = propertyId ? result.items : EMPTY;
    const loading = requestKey !== null && result.key !== requestKey;
    const error = result.key === requestKey ? result.error : null;

    return { items, loading, error, reload, setItems };
}
