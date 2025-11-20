// Fichier : lib/types.ts

import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme';
// 👇 On importe les types complets depuis leur source
import { QuartierData } from './quartier'; 
// Si la ligne ci-dessus donne toujours une erreur de circularité, 
// c'est que vous avez une vieille dépendance. Supprimez cette ligne 
// et copiez/collez la définition complète de QuartierData ici (mais c'est moins propre).

export interface BuildingData {
  adresse_ban?: string;
  annee_construction?: string;
  dpe_lettre?: string;
  
  materiaux_murs?: string;
  materiaux_toiture?: string;
  
  hauteur?: number;
  nb_niveaux?: number;
  surface_sol?: number;
  altitude?: number;

  nb_logements?: number;
  usage?: string;

  fiabilite: string;
  coords?: { lat: number; lon: number }; 
  
  risques_detailles?: RiskData;
  urbanisme?: UrbanismeData;
  quartier?: QuartierData; // <- Utilise le type importé
}