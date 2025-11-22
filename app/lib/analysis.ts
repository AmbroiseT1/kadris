// Fichier : lib/analysis.ts (FIX FINAL)

import { TransactionDVF } from './dvf';
import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme';

export interface BuildingAnalysisInput {
  annee_construction?: string;
  dpe_lettre?: string;
  risques_detailles?: RiskData;
  urbanisme?: UrbanismeData;
}

// 🚨 FIX: Ajout de 'score' (singulier) pour la valeur finale
export interface AnalysisResult {
  score: number; // <--- CECI RÈGLE LE PROBLÈME TS2561
  scores: {
    famille: number;
    investisseur: number;
    qualite_vie: number;
  };
  alerts: { level: 'high' | 'medium' | 'low'; title: string; message: string }[];
  negociation_points: string[];
  market_insight: string;
}

// --- LE MOTEUR D'INTELLIGENCE ---
export function analyzeBuilding(bat: BuildingAnalysisInput, dvf: TransactionDVF[]): AnalysisResult {
  const alerts: AnalysisResult['alerts'] = [];
  const nego: string[] = [];
  let score = 100;

  // Récupération des scores de Quartier (Mock ou réel si implémenté dans un autre module)
  const quartierScores = {
    famille: 85, // NOTE: Ces scores devraient venir du module quartier, mais sont ici simulés pour la démo.
    investisseur: 75,
    qualite_vie: 80
  };

  // 1. ANALYSE STRUCTURELLE
  const annee = parseInt(bat.annee_construction || "0");
  const isOld = annee > 1000 && annee < 1974;
  const clayRisk = bat.risques_detailles?.argiles === 'Fort';

  if (isOld && clayRisk) {
    score -= 25;
    alerts.push({ level: 'high', title: 'Risque Fissuration Élevé', message: `Construction ancienne (${annee}) sur sol argileux instable. Risque structurel accru (Sécheresse).` });
    nego.push("Risque structurel (Sécheresse)");
  }

  // 2. ANALYSE ÉNERGÉTIQUE
  if (['F', 'G'].includes(bat.dpe_lettre || '')) {
    score -= 20;
    alerts.push({ level: 'high', title: 'Passoire Thermique', message: `Classé ${bat.dpe_lettre}. Travaux d'isolation obligatoires pour mise en location future.` });
    nego.push("Coût rénovation énergétique (DPE F/G)");
  }

  // 3. ANALYSE MARCHÉ (Rotation)
  const recentSales = dvf.filter(t => t.is_target).length;
  if (recentSales > 1) score -= 10;

  // 4. ENVIRONNEMENT (Diminution du score global basé sur les risques)
  if (bat.risques_detailles?.inondation) score -= 15;
  if ((bat.risques_detailles?.cavites?.count || 0) > 0) score -= 15;
  if ((bat.risques_detailles?.installations?.length || 0) > 0) score -= 10;
  if ((bat.risques_detailles?.catnat?.count || 0) > 0) score -= Math.min((bat.risques_detailles?.catnat?.count || 0) * 2, 10);

  // 5. ANALYSE URBANISME
  if (bat.urbanisme?.zonage && !bat.urbanisme.zonage.is_constructible) score -= 15;
  if (bat.urbanisme?.servitudes?.find(s => s.code === 'AC1')) nego.push("Surcoût travaux (ABF)");


  let market = "Marché stable.";
  if (dvf.length > 5) {
    const prices = dvf.map(d => d.prix_m2);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    market = `Prix moyen du quartier : ${Math.round(avg)} €/m².`;
  }

  return {
    score: Math.max(0, score),
    alerts,
    negociation_points: nego,
    market_insight: market,
    scores: quartierScores
  };
}