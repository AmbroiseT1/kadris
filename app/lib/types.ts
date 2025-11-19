// Fichier : lib/types.ts

import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme';
import { QuartierData } from './quartier'; // <--- Import Ajouté

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
  quartier?: QuartierData; // <--- Champ Ajouté
}