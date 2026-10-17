"use client";
import React from 'react';
import { BrainCircuit, AlertOctagon, CheckCircle, BadgeEuro, ArrowLeft, Activity, MapPin, TrendingUp, Heart, Lightbulb } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TransactionDVF } from '../../app/lib/dvf';
import { analyzeBuilding } from '../../app/lib/analysis';

export const TabAnalysis = ({ data, dvf }: { data: BuildingData | null, dvf: TransactionDVF[] }) => {
    if (!data) return null;
    
    // Appel de la fonction externe d'analyse
    // Le type AnalysisResult est maintenant garanti et permet l'accès à .scores
    const analysis = analyzeBuilding(data, dvf);

    // Score global : score structurel/risques, moyenné avec les profils quartier quand ils sont disponibles
    const scores = analysis.scores;
    const profils = [scores.famille, scores.investisseur, scores.qualite_vie].filter((v): v is number => v !== null);
    const globalScore = profils.length === 3
        ? Math.round((analysis.score + profils.reduce((a, b) => a + b, 0) / 3) / 2)
        : analysis.score;
    const fmt = (v: number | null) => v === null ? 'Non évalué' : `${v}/100`;
    
    // Couleur score
    const scoreColor = globalScore > 75 ? 'text-green-600 border-green-200 bg-green-50' : 
                       globalScore > 50 ? 'text-orange-600 border-orange-200 bg-orange-50' : 
                       'text-red-600 border-red-200 bg-red-50';

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Score Global (FUSIONNÉ) */}
            <div className="bg-bricq-slate text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                <div>
                    <h2 className="font-serif text-3xl font-bold mb-2 flex items-center gap-3">
                        <BrainCircuit size={32} className="text-bricq-terracotta"/> Verdict bricq
                    </h2>
                    <p className="text-white/70 max-w-lg">
                        L'indice est une moyenne pondérée du risque structurel, de la dynamique de marché et de la qualité de vie du quartier.
                    </p>
                </div>
                {/* L'affichage du score final est mis en avant */}
                <div className={`flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 bg-white ${scoreColor.replace('bg-', 'text-')}`}>
                    <span className="text-5xl font-black text-bricq-slate">{globalScore}</span>
                    <span className="text-xs uppercase font-bold tracking-wider text-bricq-slate/50">/ 100</span>
                </div>
            </div>

            {/* Analyse Fine du Quartier (Intelligence) */}
            <div className="p-6 bg-bricq-cream rounded-2xl border border-bricq-slate/10 shadow-sm flex items-start gap-4">
                <Lightbulb size={20} className="text-bricq-terracotta mt-1 flex-shrink-0"/>
                <div>
                    <h4 className="font-bold text-lg mb-1">Analyse Stratégique du Quartier</h4>
                    <p className="text-bricq-slate/80 text-sm">{analysis.market_insight}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Section 1 : Alerte + DPE */}
                <div className="bg-white p-6 rounded-2xl border border-bricq-slate/5 shadow-sm space-y-4">
                    <h3 className="font-bold text-bricq-slate mb-6 flex items-center gap-2"><AlertOctagon className="text-red-500"/> Points de Vigilance</h3>
                    {analysis.alerts && analysis.alerts.length > 0 ? (
                        <div className="space-y-4">{analysis.alerts.map((alert, i) => (
                                <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <div className="font-bold text-red-800 text-sm mb-1">{alert.title}</div>
                                    <p className="text-red-700 text-xs leading-relaxed">{alert.message}</p>
                                </div>
                            ))}</div>
                    ) : <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2"><CheckCircle size={16}/> Aucun point de vigilance majeur détecté.</div>}
                </div>

                {/* Section 2 : Négociation + Scores Détails */}
                <div className="bg-white p-6 rounded-2xl border border-bricq-slate/5 shadow-sm space-y-6">
                    <h3 className="font-bold text-bricq-slate mb-6 flex items-center gap-2"><BadgeEuro className="text-bricq-sage"/> Leviers de Négociation</h3>
                    {analysis.negociation_points && analysis.negociation_points.length > 0 ? (
                        <ul className="space-y-3">{analysis.negociation_points.map((point, i) => (<li key={i} className="flex items-start gap-3 text-sm text-bricq-slate/80"><ArrowLeft className="text-bricq-sage flex-shrink-0 mt-1 rotate-180" size={16} />{point}</li>))}</ul>
                    ) : <p className="text-sm text-bricq-slate/50 italic">Peu de défauts majeurs exploitables.</p>}
                    
                    <div className="pt-4 border-t border-bricq-slate/10">
                        <h4 className="font-bold text-bricq-slate mb-3">Détail des Profils</h4>
                        <p className="text-sm text-blue-600 font-medium flex justify-between">Score Famille: <span>{fmt(scores.famille)}</span></p>
                        <p className="text-sm text-purple-600 font-medium flex justify-between">Score Investisseur: <span>{fmt(scores.investisseur)}</span></p>
                        <p className="text-sm text-green-600 font-medium flex justify-between">Score Qualité de Vie: <span>{fmt(scores.qualite_vie)}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};
