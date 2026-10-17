import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '@/app/lib/api';

export interface Resource<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    reload: () => void;
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/** Liste chargée depuis l'API pour un bien, avec états de chargement et d'erreur. */
export function useResource<T>(
    propertyId: string | null,
    fetcher: (propertyId: string) => Promise<T[]>,
    errorText: string,
): Resource<T> {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!propertyId) {
            setItems([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetcher(propertyId)
            .then((data) => { if (!cancelled) setItems(data); })
            .catch((e) => { if (!cancelled) setError(apiErrorMessage(e, errorText)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // fetcher / errorText sont des constantes du module appelant
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return { items, loading, error, reload, setItems };
}
