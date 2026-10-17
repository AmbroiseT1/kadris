"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Home, Trees, TrendingUp } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TransactionDVF } from '@/app/lib/dvf';

interface TabAnalyseProps {
    data: BuildingData | null;
    dvf: TransactionDVF[];
}

// Helper to calculate color based on score
const getScoreColor = (score: number) => {
    if (score >= 80) return "text-ok";
    if (score >= 50) return "text-vigil";
    return "text-alerte";
};

const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-ok-soft text-ok";
    if (score >= 50) return "bg-vigil-soft text-vigil";
    return "bg-alerte-soft text-alerte";
};

export const TabAnalyse = ({ data, dvf }: TabAnalyseProps) => {
    if (!data) return <div>Données insuffisantes pour l’analyse.</div>;

    // --- SCORING LOGIC ---

    // 1. BATI SCORE
    let batiScore = 50; // Base
    // DPE
    const dpe = data.dpe_lettre || 'E'; // Default to E if unknown
    if (['A', 'B'].includes(dpe)) batiScore += 40;
    else if (['C'].includes(dpe)) batiScore += 30;
    else if (['D'].includes(dpe)) batiScore += 10;
    else if (['F', 'G'].includes(dpe)) batiScore -= 20;
    // Age
    const year = parseInt(data.annee_construction || '1950');
    if (year > 2010) batiScore += 10;
    else if (year > 1980) batiScore += 5;
    // Cap
    batiScore = Math.min(100, Math.max(0, batiScore));


    // 2. ENVIRONNEMENT SCORE — uniquement si Géorisques a répondu ; sinon « non évalué »
    const risks = data.risques_detailles;
    const risksEvaluated = !!risks && risks.status !== undefined && risks.status !== 'unavailable';
    let envScore = 80;
    let riskCount = 0;
    if (risks?.argiles === 'Fort') { envScore -= 20; riskCount++; }
    else if (risks?.argiles === 'Moyen') { envScore -= 10; riskCount++; }
    if (risks?.radon?.classe === '3') { envScore -= 10; riskCount++; }
    if (risks?.inondation === true) { envScore -= 20; riskCount++; }
    if ((risks?.cavites?.count || 0) > 0) { envScore -= 15; riskCount++; }
    if ((risks?.installations_count ?? risks?.installations?.length ?? 0) > 0) { envScore -= 5; riskCount++; }
    envScore = Math.min(100, Math.max(0, envScore));
    const argilesLabel = !risks ? 'Non évalué' : risks.argiles === 'Nul' ? 'Non exposé' : risks.argiles ?? 'Données indisponibles';


    // 3. MARCHE SCORE
    let marketScore = 50; // Base
    const txCount = dvf ? dvf.length : 0;
    if (txCount > 20) marketScore = 95;
    else if (txCount > 10) marketScore = 80;
    else if (txCount > 5) marketScore = 60;
    else marketScore = 40;


    // GLOBAL SCORE
    const parts = risksEvaluated ? [batiScore, envScore, marketScore] : [batiScore, marketScore];
    const globalScore = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER / GLOBAL SCORE */}
            <div className="bg-gradient-to-br from-encre to-encre rounded-sm p-6 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={120} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-vigil" size={20} />
                            <h2 className="font-serif text-2xl font-bold">Analyse bricq 360°</h2>
                        </div>
                        <p className="text-texte-2 max-w-md text-sm">
                            Synthèse intelligente basée sur les caractéristiques techniques, l’environnement et la dynamique de marché de votre bien.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-widest text-texte-2 font-bold">Score Global</div>
                            <div className="text-5xl font-black tracking-tighter">{globalScore}<span className="text-2xl text-texte-2">/100</span></div>
                        </div>
                        <div className={`h-20 w-2 rounded-full ${globalScore >= 70 ? 'bg-ok' : globalScore >= 50 ? 'bg-vigil' : 'bg-alerte'}`}></div>
                    </div>
                </div>
            </div>

            {/* DETAILED CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* BATI CARD */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-5 rounded-sm border border-trait shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-encre-soft p-2 rounded-full">
                                <Home size={20} className="text-encre" />
                            </div>
                            <span className={`font-black text-2xl ${getScoreColor(batiScore)}`}>{batiScore}</span>
                        </div>
                        <h3 className="font-bold text-texte mb-1">Qualité du Bâti</h3>
                        <p className="text-xs text-texte-2 mb-4">Basé sur le DPE, l’année de construction et les matériaux.</p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Performance Énergétique</span>
                                <span className="font-bold">{data.dpe_lettre || 'Non noté'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Construction</span>
                                <span className="font-bold">{data.annee_construction || '--'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-trait">
                        <div className={`text-xs px-2 py-1 rounded inline-block font-medium ${getScoreBg(batiScore)}`}>
                            {batiScore >= 80 ? "Excellent état" : batiScore >= 50 ? "Standard" : "Rénovation conseillée"}
                        </div>
                    </div>
                </motion.div>

                {/* ENVIRONNEMENT CARD */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-5 rounded-sm border border-trait shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-ok-soft p-2 rounded-full">
                                <Trees size={20} className="text-ok" />
                            </div>
                            <span className={`font-black text-2xl ${risksEvaluated ? getScoreColor(envScore) : 'text-texte-2'}`}>{risksEvaluated ? envScore : '—'}</span>
                        </div>
                        <h3 className="font-bold text-texte mb-1">Environnement</h3>
                        <p className="text-xs text-texte-2 mb-4">Analyse des risques naturels et de la situation géographique.</p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Risques Majeurs</span>
                                <span className="font-bold">{risksEvaluated ? `${riskCount} détecté(s)${risks?.status === 'partial' ? ' (partiel)' : ''}` : 'Non évalué'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Argiles</span>
                                <span className="font-bold">{argilesLabel}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-trait">
                        <div className={`text-xs px-2 py-1 rounded inline-block font-medium ${risksEvaluated ? getScoreBg(envScore) : 'bg-papier text-texte-2'}`}>
                            {!risksEvaluated ? "Données indisponibles" : envScore >= 80 ? "Zone Sereine" : envScore >= 50 ? "Vigilance requise" : "Zone à risques"}
                        </div>
                    </div>
                </motion.div>

                {/* MARCHE CARD */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-5 rounded-sm border border-trait shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-encre-soft p-2 rounded-full">
                                <TrendingUp size={20} className="text-encre" />
                            </div>
                            <span className={`font-black text-2xl ${getScoreColor(marketScore)}`}>{marketScore}</span>
                        </div>
                        <h3 className="font-bold text-texte mb-1">Attractivité Marché</h3>
                        <p className="text-xs text-texte-2 mb-4">Basé sur le volume de transactions à proximité (500m).</p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Volume Ventes</span>
                                <span className="font-bold">{txCount} ventes (5 ans)</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-texte-2">Dynamisme</span>
                                <span className="font-bold">{marketScore >= 80 ? "Très Élevé" : "Moyen"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-trait">
                        <div className={`text-xs px-2 py-1 rounded inline-block font-medium ${getScoreBg(marketScore)}`}>
                            {marketScore >= 80 ? "Marché Liquide" : marketScore >= 50 ? "Marché Actif" : "Marché Calme"}
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* AI INSIGHT */}
            <div className="bg-papier border border-trait rounded-sm p-5 flex gap-4 items-start">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <Sparkles size={18} className="text-brique" />
                </div>
                <div>
                    <h4 className="font-bold text-texte text-sm mb-1">L’avis de l’Expert</h4>
                    <p className="text-sm text-texte-2 leading-relaxed">
                        {globalScore >= 70
                            ? "Ce bien présente d'excellents fondamentaux. La qualité du bâti combinée à un environnement favorable en fait un actif patrimonial solide. Le marché local est dynamique, suggérant une bonne liquidité à la revente."
                            : globalScore >= 50
                                ? "Un bien équilibré qui demande cependant une attention particulière sur certains points (voir détails ci-dessus). Des travaux de rénovation énergétique pourraient significativement augmenter sa valorisation."
                                : "Ce bien nécessite une vigilance accrue. Les indicateurs environnementaux ou structurels suggèrent des contraintes importantes qui doivent être prises en compte dans votre stratégie de gestion ou de travaux."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};
