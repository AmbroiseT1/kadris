// Fichier : lib/analysis.ts

import { TransactionDVF } from './dvf';
import { RiskData } from './georisques';
import { UrbanismeData } from './urbanisme';
import { QuartierData } from './quartier';

export interface BuildingAnalysisInput {
  annee_construction?: string;
  dpe_lettre?: string;
  risques_detailles?: RiskData;
  urbanisme?: UrbanismeData;
  quartier?: QuartierData;
}

export interface AnalysisResult {
  score: number;
  /** Scores de profil sur 100, issus du module quartier. null = quartier non évalué. */
  scores: {
    famille: number | null;
    investisseur: number | null;
    qualite_vie: number | null;
  };
  /** false si une source de risques n'a pas répondu : le score n'intègre pas ces rubriques. */
  risques_evalues: boolean;
  alerts: { level: 'high' | 'medium' | 'low'; title: string; message: string }[];
  negociation_points: string[];
  market_insight: string;
}

/** Les scores de quartier sont calculés sur 10 dans quartier.ts : on les ramène sur 100. */
export function quartierScoresOn100(q?: QuartierData | null): AnalysisResult['scores'] {
  if (!q?.scores) return { famille: null, investisseur: null, qualite_vie: null };
  const to100 = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10)));
  return {
    famille: to100(q.scores.famille),
    investisseur: to100(q.scores.investisseur),
    qualite_vie: to100(q.scores.qualite_vie),
  };
}

// --- LE MOTEUR D'INTELLIGENCE ---
export function analyzeBuilding(bat: BuildingAnalysisInput, dvf: TransactionDVF[]): AnalysisResult {
  const alerts: AnalysisResult['alerts'] = [];
  const nego: string[] = [];
  let score = 100;
  const risks = bat.risques_detailles;

  // 1. ANALYSE STRUCTURELLE
  const annee = parseInt(bat.annee_construction || "0");
  const isOld = annee > 1000 && annee < 1974;
  const clayRisk = risks?.argiles === 'Fort';

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

  // 4. ENVIRONNEMENT — null = non disponible : pas de déduction, mais signalé
  const risquesEvalues = !!risks && risks.status === 'ok';
  if (!risks || risks.status !== 'ok') {
    alerts.push({
      level: 'medium',
      title: risks?.status === 'partial' ? 'Risques partiellement évalués' : 'Risques non évalués',
      message: "Géorisques n'a pas répondu pour tout ou partie des rubriques. Consultez l'ERP officiel avant toute décision.",
    });
  }
  if (risks?.inondation) score -= 15;
  if ((risks?.cavites?.count || 0) > 0) score -= 15;
  if ((risks?.installations_count ?? risks?.installations?.length ?? 0) > 0) score -= 10;
  if ((risks?.catnat?.count || 0) > 0) score -= Math.min((risks?.catnat?.count || 0) * 2, 10);

  // 5. ANALYSE URBANISME
  if (bat.urbanisme?.zonage && !bat.urbanisme.zonage.is_constructible) score -= 15;
  if (bat.urbanisme?.servitudes?.find(s => s.code === 'AC1')) nego.push("Surcoût travaux (ABF)");

  let market = "Marché stable.";
  const priced = dvf.filter(d => d.prix_m2 > 0);
  if (priced.length > 5) {
    const avg = priced.reduce((a, b) => a + b.prix_m2, 0) / priced.length;
    market = `Prix moyen du quartier : ${Math.round(avg)} €/m².`;
  }

  return {
    score: Math.max(0, score),
    alerts,
    negociation_points: nego,
    market_insight: market,
    scores: quartierScoresOn100(bat.quartier),
    risques_evalues: risquesEvalues,
  };
}
