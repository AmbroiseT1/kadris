// Fichier : lib/quartier.ts

import { api } from './api';

// --- 1. DÉFINITION DES TYPES ---

export interface AmenityItem {
  name: string;
  type: string;
  distance: number;
  lat: number;
  lon: number;
}

export interface CategoryData {
  count: number;
  score_norm: number;
  items: AmenityItem[];
}

export interface NuisanceItem {
  present: boolean;
  distance: number;
  name: string;
  lat?: number;
  lon?: number;
  type?: string;
}

export interface QuartierData {
  categories: {
    education: CategoryData;
    sante: CategoryData;
    alimentation: CategoryData;
    restauration: CategoryData;
    transport: CategoryData;
    loisirs: CategoryData;
    securite: CategoryData;
    administration: CategoryData;
  };
  nuisances: {
    autoroute: NuisanceItem;
    ferre: NuisanceItem;
    aerien: NuisanceItem;
    industriel: NuisanceItem;
    score_calme: number;
  };
  scores: {
    famille: number;
    investisseur: number;
    qualite_vie: number;
    fiabilite: number;
  };
}

// --- 2. UTILITAIRES & MATRICES DE RISQUES ---

// Poids du risque routier
const ROAD_RISK_MAP: Record<string, number> = {
  'motorway': 35, 'trunk': 35, 'primary': 20, 'secondary': 10, 'tertiary': 5,
};

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function normalize(count: number, seuil: number): number {
  if (count >= seuil) return 1;
  return count / seuil;
}

const WEIGHTS = {
  famille: { education: 5, sante: 3, alimentation: 3, restauration: 1, transport: 2, loisirs: 4, securite: 3, administration: 1 },
  investisseur: { education: 2, sante: 1, alimentation: 2, restauration: 3, transport: 5, loisirs: 3, securite: 2, administration: 1 },
  qualite_vie: { education: 2, sante: 4, alimentation: 5, restauration: 5, transport: 3, loisirs: 5, securite: 3, administration: 2 }
};

// --- 3. CONNECTEUR API ---

export async function fetchQuartier(lat: number, lon: number): Promise<QuartierData | null> {
  try {
    // Requête Overpass (OpenStreetMap) via le proxy backend /proxy/quartier :
    // cache 7 jours côté serveur et pas d'appel direct du navigateur vers overpass-api.de.
    const { data } = await api.get('/proxy/quartier', { params: { lat, lon }, timeout: 40000 });
    const elements = data.elements || [];

    const getDist = (e: any) => {
      const elLat = e.lat || e.center?.lat;
      const elLon = e.lon || e.center?.lon;
      if (!elLat || !elLon) return 9999;
      return getDistanceFromLatLonInM(lat, lon, elLat, elLon);
    };

    const processCat = (filterFn: (e: any) => boolean, seuilMax: number): CategoryData => {
      const filtered = elements.filter(filterFn);
      const items = filtered.map((e: any) => ({
        name: e.tags.name || "Non nommé",
        type: e.tags.amenity || e.tags.shop || e.tags.leisure || e.tags.highway || "Divers",
        distance: getDist(e),
        lat: e.lat || e.center?.lat,
        lon: e.lon || e.center?.lon
      })).sort((a: AmenityItem, b: AmenityItem) => a.distance - b.distance);

      return {
        count: items.length,
        score_norm: normalize(items.length, seuilMax),
        items: items
      } as CategoryData;
    };

    // --- LOGIQUE NUISANCES HIERARCHISÉE SÉCURISÉE ---

    // Type intermédiaire pour le tri
    interface RoadElement {
      tags: Record<string, string>;
      dist: number;
      risk_score: number;
      lat: number;
      lon: number;
      type: string;
    }

    const processNuisance = (filterFn: (e: any) => boolean, type: 'road' | 'rail' | 'air' | 'industry'): NuisanceItem => {
      const filtered = elements.filter(filterFn);
      if (filtered.length === 0) return { present: false, distance: 0, name: "" };

      // Pour la route, on prend la plus risquée ET la plus proche
      if (type === 'road') {
        const roads: RoadElement[] = filtered.map((e: any) => ({
          tags: e.tags,
          dist: getDist(e),
          risk_score: ROAD_RISK_MAP[e.tags.highway] || 0,
          lat: e.lat || e.center?.lat,
          lon: e.lon || e.center?.lon,
          type: e.tags.highway
        }));

        // Trier par risque décroissant, puis par distance croissante
        roads.sort((a, b) => {
          if (b.risk_score !== a.risk_score) return b.risk_score - a.risk_score;
          return a.dist - b.dist;
        });

        const worst = roads[0];
        return {
          present: true,
          distance: worst.dist,
          name: worst.tags.name || "Voie importante",
          lat: worst.lat,
          lon: worst.lon,
          type: worst.type
        };
      }

      // Pour les autres, le plus proche suffit
      const nearest = filtered.reduce((prev: any, curr: any) => {
        return getDist(curr) < getDist(prev) ? curr : prev;
      });

      return {
        present: true,
        distance: getDist(nearest),
        name: nearest.tags.name || (type === 'rail' ? "Voie ferrée" : type === 'air' ? "Aérodrome" : "Zone industrielle"),
        lat: nearest.lat || nearest.center?.lat,
        lon: nearest.lon || nearest.center?.lon,
        type: nearest.tags.aeroway || nearest.tags.landuse || nearest.tags.railway
      };
    };

    // --- CATÉGORIES ---
    const education = processCat((e: any) => e.tags.amenity && /school|kindergarten|college|university/.test(e.tags.amenity), 5);
    const sante = processCat((e: any) => e.tags.amenity && /doctors|pharmacy|hospital|dentist/.test(e.tags.amenity), 3);
    const alimentation = processCat((e: any) => e.tags.shop && /bakery|butcher|supermarket|convenience|greengrocer|seafood|cheese|pastry/.test(e.tags.shop), 5);
    const restauration = processCat((e: any) => e.tags.amenity && /restaurant|cafe|fast_food|bar|pub/.test(e.tags.amenity), 10);
    const transport = processCat((e: any) => (e.tags.highway === 'bus_stop') || (e.tags.railway && /station|tram_stop/.test(e.tags.railway)), 5);
    const loisirs = processCat((e: any) => (e.tags.leisure && /park|garden|sports_centre/.test(e.tags.leisure)) || (e.tags.amenity && /library|cinema|theatre/.test(e.tags.amenity)), 4);
    const securite = processCat((e: any) => e.tags.amenity && /police|fire_station/.test(e.tags.amenity), 1);
    const administration = processCat((e: any) => e.tags.amenity && /post_office|town_hall/.test(e.tags.amenity), 2);

    // --- NUISANCES ---
    const autoroute = processNuisance((e: any) => e.tags.highway && /motorway|trunk|primary|secondary|tertiary/.test(e.tags.highway), 'road');
    const ferre = processNuisance((e: any) => e.tags.railway === 'rail', 'rail');
    const aerien = processNuisance((e: any) => e.tags.aeroway && /aerodrome|runway/.test(e.tags.aeroway), 'air');
    const industriel = processNuisance((e: any) => e.tags.landuse === 'industrial', 'industry');

    // --- CALCUL SCORE ---
    const calculateScore = (weights: any) => {
      let total =
        education.score_norm * weights.education +
        sante.score_norm * weights.sante +
        alimentation.score_norm * weights.alimentation +
        restauration.score_norm * weights.restauration +
        transport.score_norm * weights.transport +
        loisirs.score_norm * weights.loisirs +
        securite.score_norm * weights.securite +
        administration.score_norm * weights.administration;

      // Pénalités nuisances
      if (autoroute.present && autoroute.distance < 150) total *= 0.8;
      if (ferre.present && ferre.distance < 150) total *= 0.9;
      if (aerien.present && aerien.distance < 2000) total *= 0.9;
      if (industriel.present && industriel.distance < 300) total *= 0.9;

      const maxWeight = Object.values(weights).reduce((a: any, b: any) => a + b, 0) as number;
      return Math.round((total / maxWeight) * 10);
    };

    // Score Calme (100 - pénalités)
    let scoreCalme = 100;
    if (autoroute.present) scoreCalme -= Math.max(0, 40 - (autoroute.distance / 10));
    if (ferre.present) scoreCalme -= Math.max(0, 30 - (ferre.distance / 10));
    if (aerien.present) scoreCalme -= Math.max(0, 20 - (aerien.distance / 200));
    if (industriel.present) scoreCalme -= Math.max(0, 20 - (industriel.distance / 20));
    scoreCalme = Math.max(0, Math.round(scoreCalme));

    return {
      categories: { education, sante, alimentation, restauration, transport, loisirs, securite, administration },
      nuisances: { autoroute, ferre, aerien, industriel, score_calme: scoreCalme },
      scores: {
        famille: calculateScore(WEIGHTS.famille),
        investisseur: calculateScore(WEIGHTS.investisseur),
        qualite_vie: calculateScore(WEIGHTS.qualite_vie),
        fiabilite: 8 // Score statique pour l'instant
      }
    };

  } catch (error) {
    console.error("Erreur fetchQuartier:", error);
    return null;
  }
}