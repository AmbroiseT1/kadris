import { api } from './api';
import proj4 from 'proj4';
import { reverseGeocode } from './ban';

// Définition des projections
const LAMBERT_93 = '+proj=lcc +lat_1=44 +lat_2=49 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

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

const INFLATION_RATE = 0.025; // 2.5% par an en moyenne lissée

export async function fetchDVF(lat: number, lon: number): Promise<TransactionDVF[]> {
  try {
    console.log(`[DVF] Fetching for ${lat}, ${lon} using new API`);

    // Appel à la nouvelle API
    // Note: L'API attend lat/lon en WGS84 (ce qu'on a en entrée)
    const response = await api.get('/transactions/search', {
      params: {
        lat: lat,
        lon: lon,
        radius: 500, // Rayon par défaut
        limit: 5000  // Limite par défaut
      }
    });

    const data = response.data;

    if (!Array.isArray(data)) {
      console.error('[DVF] Invalid data format received');
      return [];
    }

    const transactions: TransactionDVF[] = [];

    // Traitement des données
    data.forEach((m: any) => {
      // Filtres de base
      if (!m.valeur_fonciere || !m.date_mutation) return;

      // Conversion des coordonnées Lambert-93 vers WGS84
      let coords = { lat: 0, lon: 0 };
      if (m.latitude && m.longitude) {
        try {
          // proj4 prend [x, y] donc [longitude, latitude] pour Lambert
          // et retourne [lon, lat] pour WGS84
          const converted = proj4(LAMBERT_93, WGS84, [m.longitude, m.latitude]);
          coords = { lat: converted[1], lon: converted[0] };
        } catch (e) {
          console.warn(`[DVF] Erreur conversion coordonnées pour mutation ${m.id_mutation}`, e);
        }
      }

      // Détermination du type principal
      let mainType = 'Autre';
      if (m.nombre_maisons > 0) mainType = 'Maison';
      else if (m.nombre_appartements > 0) mainType = 'Appartement';
      else if (m.nombre_locaux_activite > 0) mainType = 'Local';
      else if (m.nombre_dependances > 0) mainType = 'Dépendance';
      else if (m.surface_terrain > 0) mainType = 'Terrain';

      // Calcul Prix/m²
      let prix_m2 = 0;
      if (m.surface_bati > 0) {
        prix_m2 = Math.round(m.valeur_fonciere / m.surface_bati);
      }

      // Correction Inflation
      const dateVente = new Date(m.date_mutation);
      const now = new Date();
      const yearsDiff = (now.getTime() - dateVente.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const adjustedValue = Math.round(m.valeur_fonciere * Math.pow(1 + INFLATION_RATE, yearsDiff));

      transactions.push({
        id_mutation: m.id_mutation.toString(),
        date_mutation: m.date_mutation,
        valeur_fonciere: m.valeur_fonciere,
        valeur_fonciere_corrigee: adjustedValue,
        type_local: mainType,
        surface_reelle_bati: m.surface_bati,
        surface_terrain: m.surface_terrain,
        prix_m2: prix_m2,
        adresse: 'Adresse non fournie par API', // L'API ne retourne pas encore l'adresse
        numero_plan: undefined, // Pas de plan dans la nouvelle API pour l'instant
        coords: coords
      });
    });

    // 3. POST-TRAITEMENT AVANCÉ (Similaire à l'ancien, adapté aux nouvelles données)

    // A. Calcul Distance & Sniper
    const transactionsWithDist = transactions.map((t) => {
      // Si pas de coords valides, distance infinie
      if (t.coords.lat === 0 && t.coords.lon === 0) {
        return { ...t, distance: 9999, is_target: false };
      }

      const dist = getDistanceFromLatLonInM(lat, lon, t.coords.lat, t.coords.lon);
      return {
        ...t,
        distance: Math.round(dist),
        is_target: dist < 15
      };
    });

    // B. Flip Radar
    // Note: Sans adresse précise ni numero_plan, le regroupement est moins fiable.
    // On va utiliser une clé basée sur les coordonnées approximatives (arrondies) pour tenter de grouper
    const historyMap = new Map<string, TransactionDVF[]>();
    transactionsWithDist.forEach(t => {
      if (t.coords.lat === 0) return;
      // Clé de regroupement : lat_lon (arrondi à 4 décimales ~11m)
      const key = `${t.coords.lat.toFixed(4)}_${t.coords.lon.toFixed(4)}`;
      if (!historyMap.has(key)) historyMap.set(key, []);
      historyMap.get(key)?.push(t);
    });

    historyMap.forEach((sales) => {
      if (sales.length > 1) {
        sales.sort((a, b) => new Date(b.date_mutation).getTime() - new Date(a.date_mutation).getTime());
        for (let i = 0; i < sales.length - 1; i++) {
          const recent = sales[i];
          const old = sales[i + 1];
          const monthsDiff = (new Date(recent.date_mutation).getTime() - new Date(old.date_mutation).getTime()) / (1000 * 60 * 60 * 24 * 30);

          // Détection Flip : Revente entre 1 et 36 mois avec plus-value
          if (monthsDiff < 36 && monthsDiff > 1 && recent.valeur_fonciere > old.valeur_fonciere) {
            recent.is_flip = true;
            recent.flip_details = {
              previous_date: old.date_mutation,
              previous_price: old.valeur_fonciere,
              plus_value: recent.valeur_fonciere - old.valeur_fonciere,
              percent: ((recent.valeur_fonciere - old.valeur_fonciere) / old.valeur_fonciere) * 100
            };
          }
        }
      }
    });

    // Tri final
    const sortedTransactions = transactionsWithDist.sort((a, b) => {
      if (a.is_target && !b.is_target) return -1;
      if (!a.is_target && b.is_target) return 1;
      return new Date(b.date_mutation).getTime() - new Date(a.date_mutation).getTime();
    });

    // 4. [NEW] Enrichissement d'adresse via BAN (Reverse Geocoding)
    // On limite aux 20 premiers pour ne pas exploser le rate limit de l'API BAN
    const transactionsToGeocode = sortedTransactions.slice(0, 20);

    // On lance les requêtes en parallèle
    await Promise.all(transactionsToGeocode.map(async (t) => {
      if (t.coords.lat && t.coords.lon) {
        const address = await reverseGeocode(t.coords.lat, t.coords.lon);
        if (address) {
          t.adresse = address;
        }
      }
    }));

    return sortedTransactions;

  } catch (error) {
    console.error("Erreur DVF:", error);
    return [];
  }
}

export interface BackendMarketStats {
  prix_moyen_m2: number;
  prix_median_m2: number;
  nombre_transactions: number;
  prix_min_m2: number;
  prix_max_m2: number;
}

export async function fetchMarketStats(lat: number, lon: number, radius: number = 500): Promise<BackendMarketStats | null> {
  try {
    const response = await api.get('/stats/market', {
      params: { lat, lon, radius }
    });
    return response.data;
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
  // On estime la moyenne annuelle sur la plage totale des données (souvent 5 ans)
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

  // 4. Tendance Annuelle
  const recentSales = filtered.filter(t => new Date(t.date_mutation).getFullYear() >= 2022);
  const oldSales = filtered.filter(t => new Date(t.date_mutation).getFullYear() < 2022);

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

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}