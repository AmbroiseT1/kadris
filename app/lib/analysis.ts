// Fichier : app/lib/analysis.ts

import { TransactionDVF } from './dvf';
import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme'; // Import

export interface BuildingAnalysisInput {
  // ... existant
  urbanisme?: UrbanismeData; // <--- AJOUT
}

// On définit ce dont l'IA a besoin pour travailler (un sous-ensemble de tes données)
export interface BuildingAnalysisInput {
  annee_construction?: string;
  dpe_lettre?: string;
  risques_detailles?: RiskData;
}

export interface AnalysisResult {
  score: number;
  alerts: { level: 'high' | 'medium' | 'low'; title: string; message: string }[];
  negociation_points: string[];
  market_insight: string;
}

// --- LE MOTEUR D'INTELLIGENCE ---
export function analyzeBuilding(bat: BuildingAnalysisInput, dvf: TransactionDVF[]): AnalysisResult {
  const alerts: AnalysisResult['alerts'] = [];
  const nego: string[] = [];
  let score = 100; // Base parfaite

  // 1. ANALYSE STRUCTURELLE (Le Crack Score)
  const annee = parseInt(bat.annee_construction || "0");
  const isOld = annee > 1000 && annee < 1974; 
  const clayRisk = bat.risques_detailles?.argiles === 'Fort';

  if (isOld && clayRisk) {
    score -= 25;
    alerts.push({
      level: 'high',
      title: 'Risque Fissuration Élevé',
      message: `Construction ancienne (${annee}) sur sol argileux instable. Risque structurel accru (Sécheresse).`
    });
    nego.push("Risque structurel (Sécheresse)");
  }

  // 2. ANALYSE ÉNERGÉTIQUE (DPE)
  if (['F', 'G'].includes(bat.dpe_lettre || '')) {
    score -= 20;
    alerts.push({
      level: 'high',
      title: 'Passoire Thermique',
      message: `Classé ${bat.dpe_lettre}. Travaux d'isolation obligatoires pour mise en location future.`
    });
    nego.push("Coût rénovation énergétique (DPE F/G)");
  }

  // 3. ANALYSE MARCHÉ (Rotation)
  // On regarde si CE bien a été vendu récemment (is_target = true dans DVF)
  const recentSales = dvf.filter(t => t.is_target).length;
  if (recentSales > 1) {
    score -= 10;
    alerts.push({
        level: 'medium',
        title: 'Rotation Rapide',
        message: "Ce bien a été revendu plusieurs fois récemment. Vérifiez les nuisances."
    });
  }

  // 4. ENVIRONNEMENT & RISQUES
  const r = bat.risques_detailles;
  
  // Inondation
  if (r?.inondation) {
      score -= 15;
      alerts.push({ level: 'medium', title: 'Zone Inondable', message: 'Bien situé en zone inondable (PPRI).' });
      nego.push("Zone Inondable (Assurance)");
  }
  
  // Cavités
  if ((r?.cavites?.count || 0) > 0) {
      score -= 15;
      alerts.push({ level: 'high', title: 'Cavités Souterraines', message: 'Risque d\'effondrement (Carrières/Marnières).' });
  }

  // Usines
  if ((r?.installations?.length || 0) > 0) {
      score -= 10;
      nego.push("Proximité Industrielle (Nuisances)");
  }
  
  // Catastrophes Naturelles
  if ((r?.catnat.count || 0) > 0) {
      // On enlève des points proportionnellement au nombre de sinistres, capé à 10
      const malus = Math.min((r?.catnat.count || 0) * 2, 10);
      score -= malus;
  }

  // 5. ANALYSE PRIX (Bonus/Malus basique)
  let market = "Marché stable.";
  if (dvf.length > 5) {
      const prices = dvf.map(d => d.prix_m2);
      const avg = prices.reduce((a,b) => a+b, 0) / prices.length;
      market = `Prix moyen du quartier : ${Math.round(avg)} €/m².`;
  }
  // 6. ANALYSE URBANISME (Nouveau !)
  const urba = bat.urbanisme;
  if (urba?.zonage) {
      // Si zone Naturelle ou Agricole -> Forte contrainte
      if (!urba.zonage.is_constructible) {
         score -= 15;
         alerts.push({ 
             level: 'high', 
             title: 'Zone Inconstructible', 
             message: `Classé en zone ${urba.zonage.code} (${urba.zonage.libelle}). Extensions et nouvelles constructions très limitées.` 
         });
      }
  }

  // Servitudes lourdes
  if (urba?.servitudes.find(s => s.code === 'AC1')) {
      score -= 5;
      alerts.push({ level: 'medium', title: 'Monument Historique', message: 'Périmètre ABF : Travaux soumis à avis conforme de l\'Architecte des Bâtiments de France.' });
      nego.push("Surcoût travaux (Architecte Bâtiments de France)");
  }

  return {
    score: Math.max(0, score), // On ne descend pas sous 0
    alerts,
    negociation_points: nego,
    market_insight: market
  };
}