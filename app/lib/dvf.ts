// Fichier : lib/dvf.ts
// Transactions DVF via le backend (/public-data/dvf/*), qui lit les fichiers « DVF géolocalisées »
// d'Etalab par commune. Les adresses viennent du fichier DVF : plus de géocodage inverse BAN par vente.

import { api } from './api';

export interface TransactionDVF {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: number;
  valeur_fonciere_corrigee: number; // Prix corrigé de l'inflation
  type_local: string;
  surface_reelle_bati: number;
  surface_terrain: number;
  prix_m2: number;
  distance?: number;
  is_target?: boolean;
  appreciation?: number;
  adresse: string;
  numero_plan?: string;
  is_flip?: boolean;
  flip_details?: { previous_date: string; previous_price: number; plus_value: number; percent: number };
  coords: { lat: number; lon: number };
}

export interface MarketStats {
  prix_moyen_m2: number;
  prix_min: number;
  prix_max: number;
  volume_ventes: number;
  tendance_annuelle: number;
  tension_marche: 'Faible' | 'Normale' | 'Elevée'; // Vitesse d'écoulement / Volume
  prix_par_surface: {
    small: number; // < 50m²
    medium: number; // 50-120m²
    large: number; // > 120m²
  };
  ratio_terrain_bati_moyen: number;
}

export interface PriceStats {
  nombre_transactions: number;
  prix_moyen_m2: number;
  prix_median_m2: number;
  prix_min_m2: number;
  prix_max_m2: number;
}

export interface BackendMarketStats extends PriceStats {
  rayon_m?: number;
  /** Médianes par type dans le rayon (null = aucune vente comparable). */
  par_type?: { Appartement: PriceStats | null; Maison: PriceStats | null };
  /** Médianes à l'échelle de la commune / de l'arrondissement. */
  commune?: { Appartement: PriceStats | null; Maison: PriceStats | null };
  periode?: { debut: string; fin: string } | null;
  millesimes?: number[];
  fetched_at?: string;
  code_insee?: string;
}

export interface DVFMeta {
  source: string;
  fetched_at: string;
  code_insee: string;
  millesimes: number[];
  partial: boolean;
  rayon_m: number;
  total: number;
}

export const DVF_RADIUS_M = 500;
const TARGET_RADIUS_M = 15;
const INFLATION_RATE = 0.025; // 2.5% par an en moyenne lissée

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTransaction(m: any): TransactionDVF {
  const dateVente = new Date(m.date_mutation);
  const yearsDiff = (Date.now() - dateVente.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return {
    id_mutation: String(m.id_mutation),
    date_mutation: m.date_mutation,
    valeur_fonciere: m.valeur_fonciere,
    valeur_fonciere_corrigee: Math.round(m.valeur_fonciere * Math.pow(1 + INFLATION_RATE, Math.max(0, yearsDiff))),
    type_local: m.type_principal,
    surface_reelle_bati: m.surface_bati,
    surface_terrain: m.surface_terrain,
    prix_m2: m.prix_m2 || 0,
    distance: m.distance,
    is_target: typeof m.distance === 'number' && m.distance < TARGET_RADIUS_M,
    adresse: m.adresse || 'Adresse non communiquée',
    numero_plan: m.id_parcelles?.[0],
    coords: { lat: m.latitude, lon: m.longitude },
  };
}

/** Flip radar : reventes d'un même bien (même parcelle, même type, surface identique) sous 36 mois avec plus-value. */
function detectFlips(transactions: TransactionDVF[]): void {
  const history = new Map<string, TransactionDVF[]>();
  for (const t of transactions) {
    if (!t.numero_plan || !t.surface_reelle_bati) continue;
    const key = `${t.numero_plan}_${t.type_local}_${Math.round(t.surface_reelle_bati)}`;
    const list = history.get(key) || [];
    list.push(t);
    history.set(key, list);
  }
  history.forEach((sales) => {
    if (sales.length < 2) return;
    sales.sort((a, b) => new Date(b.date_mutation).getTime() - new Date(a.date_mutation).getTime());
    for (let i = 0; i < sales.length - 1; i++) {
      const recent = sales[i];
      const old = sales[i + 1];
      const monthsDiff = (new Date(recent.date_mutation).getTime() - new Date(old.date_mutation).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff < 36 && monthsDiff > 1 && recent.valeur_fonciere > old.valeur_fonciere) {
        recent.is_flip = true;
        recent.flip_details = {
          previous_date: old.date_mutation,
          previous_price: old.valeur_fonciere,
          plus_value: recent.valeur_fonciere - old.valeur_fonciere,
          percent: ((recent.valeur_fonciere - old.valeur_fonciere) / old.valeur_fonciere) * 100,
        };
      }
    }
  });
}

/**
 * Transactions DVF autour du point, avec métadonnées (millésimes, date de consultation).
 * Lève une erreur si la source est injoignable (le rapport affiche alors « Données indisponibles »).
 */
export async function fetchDVFReport(
  lat: number,
  lon: number,
  codeInsee?: string,
  radius: number = DVF_RADIUS_M
): Promise<{ transactions: TransactionDVF[]; meta: DVFMeta }> {
  const { data } = await api.get('/public-data/dvf/transactions', {
    params: { lat, lon, radius, limit: 2000, ...(codeInsee ? { code_insee: codeInsee } : {}) },
    timeout: 60000,
  });
  const transactions: TransactionDVF[] = (data.transactions || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => m.valeur_fonciere > 0 && m.date_mutation)
    .map(toTransaction);

  detectFlips(transactions);

  transactions.sort((a, b) => {
    if (a.is_target && !b.is_target) return -1;
    if (!a.is_target && b.is_target) return 1;
    return new Date(b.date_mutation).getTime() - new Date(a.date_mutation).getTime();
  });

  const { transactions: _omit, ...meta } = data;
  void _omit;
  return { transactions, meta: meta as DVFMeta };
}

/** Variante tolérante (tableau vide en cas d'erreur), conservée pour le tableau de bord. */
export async function fetchDVF(lat: number, lon: number, codeInsee?: string): Promise<TransactionDVF[]> {
  try {
    return (await fetchDVFReport(lat, lon, codeInsee)).transactions;
  } catch (error) {
    console.error("Erreur DVF:", error);
    return [];
  }
}

/** Statistiques de marché (moyenne/médiane €/m², par type, commune). Lève si la source est injoignable. */
export async function fetchMarketStatsStrict(lat: number, lon: number, radius: number = DVF_RADIUS_M, codeInsee?: string): Promise<BackendMarketStats> {
  const { data } = await api.get('/public-data/dvf/stats', {
    params: { lat, lon, radius, ...(codeInsee ? { code_insee: codeInsee } : {}) },
    timeout: 60000,
  });
  return data;
}

export async function fetchMarketStats(lat: number, lon: number, radius: number = DVF_RADIUS_M, codeInsee?: string): Promise<BackendMarketStats | null> {
  try {
    return await fetchMarketStatsStrict(lat, lon, radius, codeInsee);
  } catch (error) {
    console.error("Erreur fetchMarketStats:", error);
    return null;
  }
}

export function calculateMarketStats(transactions: TransactionDVF[], typeFilter?: string): MarketStats {
  // On filtre les transactions selon le type SI demandé
  // ET on exclut celles qui n'ont pas de prix au m² (donc pas de surface batie)
  const filtered = transactions.filter(t =>
    (typeFilter ? t.type_local === typeFilter : true) &&
    t.prix_m2 > 0
  );

  if (filtered.length === 0) {
    return {
      prix_moyen_m2: 0, prix_min: 0, prix_max: 0, volume_ventes: 0, tendance_annuelle: 0,
      tension_marche: 'Faible',
      prix_par_surface: { small: 0, medium: 0, large: 0 },
      ratio_terrain_bati_moyen: 0
    };
  }

  const pricesM2 = filtered.map(t => t.prix_m2);
  const avgM2 = Math.round(pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length);

  // 1. Segmentation par surface
  const small = filtered.filter(t => t.surface_reelle_bati < 50);
  const medium = filtered.filter(t => t.surface_reelle_bati >= 50 && t.surface_reelle_bati < 120);
  const large = filtered.filter(t => t.surface_reelle_bati >= 120);

  const getAvg = (arr: TransactionDVF[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b.prix_m2, 0) / arr.length) : 0;

  // 2. Tension du Marché (Volume 12 derniers mois vs Moyenne historique)
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const salesLast12m = filtered.filter(t => new Date(t.date_mutation) >= oneYearAgo).length;
  const oldestDate = new Date(Math.min(...filtered.map(t => new Date(t.date_mutation).getTime())));
  const yearsRange = Math.max(1, (now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  const avgAnnualVolume = filtered.length / yearsRange;

  let tension: 'Faible' | 'Normale' | 'Elevée' = 'Normale';
  if (salesLast12m > avgAnnualVolume * 1.2) tension = 'Elevée';
  if (salesLast12m < avgAnnualVolume * 0.8) tension = 'Faible';

  // 3. Ratio Terrain/Bâti (pour les maisons)
  const houses = filtered.filter(t => t.type_local === 'Maison' && t.surface_terrain > 0);
  const avgRatio = houses.length
    ? houses.reduce((a, b) => a + (b.surface_terrain / b.surface_reelle_bati), 0) / houses.length
    : 0;

  // 4. Tendance : ventes des 2 dernières années civiles vs antérieures
  const pivot = now.getFullYear() - 2;
  const recentSales = filtered.filter(t => new Date(t.date_mutation).getFullYear() >= pivot);
  const oldSales = filtered.filter(t => new Date(t.date_mutation).getFullYear() < pivot);

  let trend = 0;
  if (recentSales.length > 0 && oldSales.length > 0) {
    const avgRecent = recentSales.reduce((a, b) => a + b.prix_m2, 0) / recentSales.length;
    const avgOld = oldSales.reduce((a, b) => a + b.prix_m2, 0) / oldSales.length;
    trend = ((avgRecent - avgOld) / avgOld) * 100;
  }

  return {
    prix_moyen_m2: avgM2,
    prix_min: Math.min(...pricesM2),
    prix_max: Math.max(...pricesM2),
    volume_ventes: filtered.length,
    tendance_annuelle: parseFloat(trend.toFixed(1)),
    tension_marche: tension,
    prix_par_surface: {
      small: getAvg(small),
      medium: getAvg(medium),
      large: getAvg(large)
    },
    ratio_terrain_bati_moyen: parseFloat(avgRatio.toFixed(1))
  };
}
