// Fichier : lib/quartier.ts (FIXED: Type Explicite pour les fonctions internes)

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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c);
}

function normalize(count: number, seuil: number): number {
  if (count >= seuil) return 1;
  return count / seuil;
}

const WEIGHTS = {
  famille: { education: 5, sante: 3, alimentation: 3, transport: 2, loisirs: 4, securite: 3, administration: 1 },
  investisseur: { education: 2, sante: 1, alimentation: 2, transport: 5, loisirs: 3, securite: 2, administration: 1 },
  qualite_vie: { education: 2, sante: 4, alimentation: 5, transport: 3, loisirs: 5, securite: 3, administration: 2 }
};

// --- 3. CONNECTEUR API ---

export async function fetchQuartier(lat: number, lon: number): Promise<QuartierData | null> {
  try {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"school|kindergarten|college|university"](around:1000, ${lat}, ${lon});
        way["amenity"~"school|kindergarten|college|university"](around:1000, ${lat}, ${lon});
        node["amenity"~"doctors|pharmacy|hospital|dentist"](around:1000, ${lat}, ${lon});
        node["shop"~"bakery|butcher|supermarket|convenience"](around:800, ${lat}, ${lon});
        node["highway"="bus_stop"](around:800, ${lat}, ${lon});
        node["railway"~"station|tram_stop"](around:1000, ${lat}, ${lon});
        node["leisure"~"park|garden|sports_centre"](around:1000, ${lat}, ${lon});
        way["leisure"~"park|garden|sports_centre"](around:1000, ${lat}, ${lon});
        node["amenity"~"library|cinema|theatre"](around:1000, ${lat}, ${lon});
        node["amenity"~"police|fire_station"](around:1500, ${lat}, ${lon});
        node["amenity"~"post_office|town_hall"](around:1000, ${lat}, ${lon});
        
        way["highway"~"motorway|trunk|primary|secondary|tertiary"](around:300, ${lat}, ${lon});
        way["railway"="rail"](around:300, ${lat}, ${lon});
        way["aeroway"~"aerodrome|runway"](around:3000, ${lat}, ${lon});
        node["aeroway"~"aerodrome"](around:3000, ${lat}, ${lon});
        way["landuse"="industrial"](around:500, ${lat}, ${lon});
      );
      out center; 
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
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
          })).sort((a: AmenityItem, b: AmenityItem) => a.distance - b.distance); // <-- FIX: a and b sont typés

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

    const roadElements: RoadElement[] = elements
        .filter((e: any) => ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'].includes(e.tags.highway))
        .map((e: any) => ({
            ...e,
            dist: getDist(e),
            risk_score: (ROAD_RISK_MAP[e.tags.highway] || 5) * (1000 / (getDist(e) || 1000)),
            type: e.tags.highway,
            lat: e.lat || e.center?.lat,
            lon: e.lon || e.center?.lon,
        }));

    // FIX: Le tri est maintenant typé et exécuté sur un tableau RoadElement[]
    const sortedRoads = roadElements.sort((a, b) => b.risk_score - a.risk_score); 
    const worstRoad = sortedRoads[0]; 

    
    const findNuisance = (filterFn: (e: any) => boolean, type: string): NuisanceItem => {
        const items = elements.filter(filterFn).map((e: any) => ({
            name: e.tags.name || type,
            dist: getDist(e),
            lat: e.lat || e.center?.lat,
            lon: e.lon || e.center?.lon,
            type: e.tags.aeroway || e.tags.railway || e.tags.landuse
        })).sort((a: any, b: any) => a.dist - b.dist);
        
        return items.length > 0 
            ? { present: true, distance: items[0].dist, name: items[0].name, lat: items[0].lat, lon: items[0].lon, type: items[0].type } 
            : { present: false, distance: 0, name: "" } as NuisanceItem;
    };

    const nuisances = {
        autoroute: worstRoad ? 
            { 
                present: true, 
                distance: worstRoad.dist, 
                name: worstRoad.tags.name || worstRoad.tags.highway,
                lat: worstRoad.lat,
                lon: worstRoad.lon,
                type: worstRoad.tags.highway
            } : 
            { present: false, distance: 0, name: "", type: "" } as NuisanceItem,
        ferre: findNuisance((e: any) => e.tags.railway === 'rail', 'Voie Ferrée'),
        aerien: findNuisance((e: any) => ['aerodrome', 'runway'].includes(e.tags.aeroway), 'Aéroport/Piste'),
        industriel: findNuisance((e: any) => e.tags.landuse === 'industrial', 'Zone Industrielle'),
        score_calme: 100 
    };

    let scoreCalme = 100;
    if (nuisances.autoroute.present) {
        const roadType = nuisances.autoroute.type || 'tertiary';
        const baseMalus = ROAD_RISK_MAP[roadType] || 5;
        const proximityMultiplier = Math.min(5, 300 / (nuisances.autoroute.distance || 300));
        scoreCalme -= Math.round(baseMalus * proximityMultiplier);
    }
    if (nuisances.ferre.present) scoreCalme -= 20 * (300 / (nuisances.ferre.distance || 300));
    if (nuisances.aerien.present) scoreCalme -= 15;
    if (nuisances.industriel.present) scoreCalme -= 10;
    nuisances.score_calme = Math.round(Math.max(0, scoreCalme));

    const cats = {
      education: processCat((e: any) => ['school', 'kindergarten', 'college', 'university'].includes(e.tags.amenity), 3),
      sante: processCat((e: any) => ['doctors', 'pharmacy', 'hospital', 'dentist'].includes(e.tags.amenity), 3),
      alimentation: processCat((e: any) => ['bakery', 'butcher', 'supermarket', 'convenience'].includes(e.tags.shop), 4),
      transport: processCat((e: any) => e.tags.highway === 'bus_stop' || ['station', 'tram_stop'].includes(e.tags.railway), 5),
      loisirs: processCat((e: any) => ['park', 'garden', 'sports_centre'].includes(e.tags.leisure) || ['library', 'cinema', 'theatre'].includes(e.tags.amenity), 4),
      securite: processCat((e: any) => ['police', 'fire_station'].includes(e.tags.amenity), 1),
      administration: processCat((e: any) => ['post_office', 'town_hall'].includes(e.tags.amenity), 2)
    };

    const calcScore = (weights: any) => {
       let numerator = 0, denominator = 0;
       Object.keys(weights).forEach((key) => {
          const catKey = key as keyof typeof cats;
          numerator += weights[key] * cats[catKey].score_norm;
          denominator += weights[key];
       });
       let malus = (100 - nuisances.score_calme) / 200;
       const rawScore = (numerator / denominator) * 100;
       return Math.round(rawScore * (1 - malus));
    };

    return {
      categories: cats,
      nuisances: nuisances,
      scores: {
        famille: calcScore(WEIGHTS.famille),
        investisseur: calcScore(WEIGHTS.investisseur),
        qualite_vie: calcScore(WEIGHTS.qualite_vie),
        fiabilite: 0.95
      }
    } as QuartierData;

  } catch (error) {
    console.error("Erreur Quartier:", error);
    return null;
  }
}