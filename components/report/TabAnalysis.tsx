"use client";
import React from 'react';
import { BrainCircuit, AlertOctagon, CheckCircle, BadgeEuro, ArrowLeft } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TransactionDVF } from '@/lib/dvf';
import { analyzeBuilding } from '@/app/lib/analysis';

export const TabAnalysis = ({ data, dvf }: { data: BuildingData | null, dvf: TransactionDVF[] }) => {
    if (!data) return null;
    const analysis = analyzeBuilding(data, dvf);
    const scoreColor = analysis.score > 60 ? 'text-green-600 border-green-200 bg-green-50' : 
                       analysis.score > 30 ? 'text-orange-600 border-orange-200 bg-orange-50' : 
                       'text-red-600 border-red-200 bg-red-50';

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-kadris-slate text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                <div>
                    <h2 className="font-serif text-3xl font-bold mb-2 flex items-center gap-3">
                        <BrainCircuit size={32} className="text-kadris-terracotta"/> Analyse Kadris
                    </h2>
                    <p className="text-white/70 max-w-lg">Diagnostic croisé multi-sources (BDNB + Géorisques + DVF).</p>
                </div>
                <div className={`flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 bg-white ${scoreColor.replace('bg-', 'text-')}`}>
                    <span className="text-4xl font-black text-kadris-slate">{analysis.score}</span>
                    <span className="text-xs uppercase font-bold tracking-wider text-kadris-slate/50">/ 100</span>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                    <h3 className="font-bold text-kadris-slate mb-6 flex items-center gap-2"><AlertOctagon className="text-red-500"/> Points de Vigilance</h3>
                    {analysis.alerts.length > 0 ? (
                        <div className="space-y-4">{analysis.alerts.map((alert, i) => (
                                <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <div className="font-bold text-red-800 text-sm mb-1">{alert.title}</div>
                                    <p className="text-red-700 text-xs leading-relaxed">{alert.message}</p>
                                </div>
                            ))}</div>
                    ) : <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2"><CheckCircle size={16}/> Aucun point de vigilance majeur.</div>}
                </div>
                <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                    <h3 className="font-bold text-kadris-slate mb-6 flex items-center gap-2"><BadgeEuro className="text-kadris-sage"/> Leviers de Négociation</h3>
                    {analysis.negociation_points.length > 0 ? (
                        <ul className="space-y-3">{analysis.negociation_points.map((point, i) => (<li key={i} className="flex items-start gap-3 text-sm text-kadris-slate/80"><ArrowLeft className="text-kadris-sage flex-shrink-0 mt-1 rotate-180" size={16} />{point}</li>))}</ul>
                    ) : <p className="text-sm text-kadris-slate/50 italic">Peu de défauts majeurs exploitables.</p>}
                </div>
            </div>
        </div>
    );
};