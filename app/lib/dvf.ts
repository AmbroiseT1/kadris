// lib/dvf.ts

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
    const latFixed = lat.toFixed(6);
    const lonFixed = lon.toFixed(6);

    console.log(`[DVF] Fetching for ${latFixed}, ${lonFixed}`);

    const url = `https://api.cquest.org/dvf?lat=${latFixed}&lon=${lonFixed}&dist=300`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[DVF] API Error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data.features) return [];

    // 1. GROUPEMENT PAR MUTATION (Pour gérer les ventes en lots)
    const mutationsMap = new Map<string, any>();

    data.features.forEach((f: any) => {
      const p = f.properties;

      // Création d'un ID stable pour le regroupement si id_mutation est absent
      // On utilise Date + Montant + Disposition (c'est la clé unique d'une vente DVF)
      const idMutation = p.id_mutation || `${p.date_mutation}_${p.valeur_fonciere}_${p.numero_disposition}`;

      if (!mutationsMap.has(idMutation)) {
        mutationsMap.set(idMutation, {
          id_mutation: idMutation,
          date_mutation: p.date_mutation,
          valeur_fonciere: p.valeur_fonciere,
          adresse: `${p.numero_voie || ''} ${p.type_voie || ''} ${p.voie || ''}, ${p.code_postal || ''} ${p.commune || ''}`.replace(/\s+/g, ' ').trim(),
          // On garde le premier numero_plan trouvé comme référence, mais on stockera tous les plans pour le calcul terrain
          numero_plan: p.numero_plan,
          coords: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
          lots: []
        });
      }

      const mutation = mutationsMap.get(idMutation);

      // Gestion de la typo potentielle dans l'API (surface_relle_bati vs surface_reelle_bati)
      const surface = p.surface_reelle_bati || p.surface_relle_bati || 0;

      mutation.lots.push({
        type_local: p.type_local,
        surface_bati: surface,
        surface_terrain: p.surface_terrain || 0,
        numero_plan: p.numero_plan // Important pour dédoublonner le terrain
      });
    });

    // 2. TRANSFORMATION EN TRANSACTIONS UNIQUES
    const transactions: TransactionDVF[] = [];

    mutationsMap.forEach((m) => {
      // Filtres Qualité
      if (!m.valeur_fonciere) return;

      // Calcul des surfaces totales de la mutation
      const totalSurfaceBati = m.lots.reduce((acc: number, lot: any) => acc + lot.surface_bati, 0);

      // Calcul intelligent de la surface terrain : Somme des surfaces des parcelles UNIQUES
      // (Evite de compter 3x le terrain si 3 lots sont sur la même parcelle, mais additionne si plusieurs parcelles)
      const uniqueParcels = new Set<string>();
      let totalSurfaceTerrain = 0;

      m.lots.forEach((lot: any) => {
        if (lot.surface_terrain > 0) {
          // Si on a un numero_plan, on l'utilise pour l'unicité
          if (lot.numero_plan && !uniqueParcels.has(lot.numero_plan)) {
            uniqueParcels.add(lot.numero_plan);
            totalSurfaceTerrain += lot.surface_terrain;
          }
          // Fallback si pas de numero_plan (rare), on prend le max pour ne pas exploser le compteur
          else if (!lot.numero_plan) {
            totalSurfaceTerrain = Math.max(totalSurfaceTerrain, lot.surface_terrain);
          }
        }
      });

      // Détermination du type principal
      const types = m.lots.map((l: any) => l.type_local);
      // Hiérarchie : Maison > Appartement > Local > Dépendance
      const mainType = types.includes('Maison') ? 'Maison' :
        types.includes('Appartement') ? 'Appartement' :
          types.includes('Local industriel. commercial ou assimilé') ? 'Local' :
            types[0];

      // Filtres souples
      // On accepte les surfaces bâties nulles UNIQUEMENT si c'est un Terrain ou une Dépendance vendue seule (ex: garage)
      // Mais pour l'analyse immo résidentielle, on veut souvent filtrer les petits trucs.
      // Ici on garde tout ce qui a de la valeur, on filtrera à l'affichage si besoin.

      // Exclusion explicite des 'Dépendance' seules si on veut focuser sur l'habitat, 
      // mais l'utilisateur veut "bien structuré", donc on garde et on laisse le front filtrer ou trier.
      // SAUF si c'est vraiment insignifiant (ex: 1€ symbolique ou erreur)

      // Calcul Prix/m²
      // Si c'est un terrain nu (Bati = 0), le prix au m² est basé sur le terrain
      let prix_m2 = 0;
      if (totalSurfaceBati > 0) {
        prix_m2 = Math.round(m.valeur_fonciere / totalSurfaceBati);
      } else if (totalSurfaceTerrain > 0) {
        // Prix au m² terrain pour les terrains nus
        prix_m2 = Math.round(m.valeur_fonciere / totalSurfaceTerrain);
      }

      // Correction Inflation
      const dateVente = new Date(m.date_mutation);
      const now = new Date();
      const yearsDiff = (now.getTime() - dateVente.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const adjustedValue = Math.round(m.valeur_fonciere * Math.pow(1 + INFLATION_RATE, yearsDiff));

      transactions.push({
        id_mutation: m.id_mutation,
        date_mutation: m.date_mutation,
        valeur_fonciere: m.valeur_fonciere,
        valeur_fonciere_corrigee: adjustedValue,
        type_local: mainType,
        surface_reelle_bati: totalSurfaceBati,
        surface_terrain: totalSurfaceTerrain,
        prix_m2: prix_m2,
        adresse: m.adresse,
        numero_plan: m.numero_plan,
        coords: m.coords
      } as any);
    });

    // 3. POST-TRAITEMENT AVANCÉ

    // A. Calcul Distance & Sniper
    const transactionsWithDist = transactions.map((t: any) => {
      const dist = getDistanceFromLatLonInM(lat, lon, t.coords.lat, t.coords.lon);
      return {
        ...t,
        distance: Math.round(dist),
        is_target: dist < 15
      };
    });

    // B. Flip Radar
    const historyMap = new Map<string, TransactionDVF[]>();
    transactionsWithDist.forEach(t => {
      const key = t.numero_plan || t.adresse;
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
    return transactionsWithDist.sort((a: any, b: any) => {
      if (a.is_target && !b.is_target) return -1;
      if (!a.is_target && b.is_target) return 1;
      return new Date(b.date_mutation).getTime() - new Date(a.date_mutation).getTime();
    });

  } catch (error) {
    console.error("Erreur DVF:", error);
    return [];
  }
}

export function calculateMarketStats(transactions: TransactionDVF[], typeFilter?: string): MarketStats {
  const filtered = typeFilter
    ? transactions.filter(t => t.type_local === typeFilter)
    : transactions;

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