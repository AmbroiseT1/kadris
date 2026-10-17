const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatEuro = (n: number | null | undefined): string =>
    n === null || n === undefined ? '' : euro.format(n);

/** "2024-03-01" -> "01/03/2024" (sans décalage de fuseau). */
export const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
};

export const todayIso = (): string => new Date().toISOString().split('T')[0];

/** Champ de formulaire -> nombre ou null. */
export const toNumberOrNull = (v: string): number | null => {
    if (v.trim() === '') return null;
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
};

export const emptyToNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());
