// Fichier : lib/types.ts

import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme';
import { QuartierData } from './quartier';
import { DPEData } from './dpe';
import { WaterData } from './eau';
import { ConnectivityData } from './arcep';

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
  quartier?: QuartierData;
  eau_potable?: WaterData;
  dpe_reel?: DPEData;
  connectivite?: ConnectivityData;

  raw_bdnb?: any; // Données brutes BDNB
}