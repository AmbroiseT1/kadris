// lib/dvf.ts

export interface TransactionDVF {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: number;
  type_local: string; 
  surface_reelle_bati: number;
  prix_m2: number;
  distance?: number; // Nouvelle info : distance par rapport au bien
  is_target?: boolean; // Est-ce que c'est LE bien qu'on regarde ?
}

export async function fetchDVF(lat: number, lon: number): Promise<TransactionDVF[]> {
  try {
    // On cherche large (200m)
    const url = `https://api.cquest.org/dvf?lat=${lat}&lon=${lon}&dist=200`;
    
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    
    if (!data.features) return [];

    const transactions = data.features.map((f: any) => {
      const p = f.properties;
      // On ignore les ventes sans prix ou sans surface (terrains nus, dépendances seules)
      if (!p.valeur_fonciere || !p.surface_reelle_bati) return null;
      
      // Calcul grossier de la distance (suffisant pour le tri)
      // L'API ne renvoie pas la distance, on pourrait la calculer mais l'API cquest trie souvent par proximité
      // Ici on va supposer que si c'est la même parcelle ou très proche, c'est le bien.
      
      // Hack pour le PoC : On considère que c'est "Le Bien" si c'est une maison/appart 
      // et que c'est vendu sur la même section cadastrale ou très proche.
      // Pour l'instant, on ne peut pas être sûr à 100% sans calcul de distance précis côté client.
      
      return {
        id_mutation: p.id_mutation,
        date_mutation: p.date_mutation,
        valeur_fonciere: p.valeur_fonciere,
        type_local: p.type_local,
        surface_reelle_bati: p.surface_reelle_bati,
        prix_m2: Math.round(p.valeur_fonciere / p.surface_reelle_bati),
        // On stocke les coordonnées de la transaction pour calculer la distance précise si besoin
        coords: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
      };
    }).filter((t: any) => t !== null);

    // Post-traitement : Calculer la distance réelle pour identifier "Le Bien"
    const transactionsWithDist = transactions.map((t: any) => {
        const dist = getDistanceFromLatLonInM(lat, lon, t.coords.lat, t.coords.lon);
        return {
            ...t,
            distance: Math.round(dist),
            is_target: dist < 15 // Si à moins de 15m, on considère que c'est l'historique du bien !
        };
    });

    // Tri : D'abord le bien cible (target), puis par date décroissante
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

// Fonction utilitaire pour calculer la distance en mètres (Formule de Haversine simplifiée)
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Rayon terre en mètres
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}