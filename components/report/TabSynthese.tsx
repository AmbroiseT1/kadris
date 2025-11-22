"use client";
import React from 'react';
import { MapLayersViz } from '@/components/ui/Diagrams';
import { Building, BrickWall, Shield, Home, CheckCircle, Ruler, MapPin, ArrowLeft, Mountain, FileText, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TransactionDVF } from '@/app/lib/dvf'; // <--- Import du type

// --- SOUS-COMPOSANTS UI ---

const InfoCard = ({ label, value, icon: Icon, color, sub, className }: any) => (
    <div className={`bg-white p-4 rounded-xl border border-kadris-slate/5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${className}`}>
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-kadris-terracotta" />
                <span className="text-xs font-bold uppercase tracking-wider text-kadris-slate/40">{label}</span>
            </div>
            <div className={`font-bold text-lg text-kadris-slate leading-tight ${color || ''}`}>
                {value || "--"}
            </div>
        </div>
        {sub && <div className="text-xs text-kadris-slate/40 mt-1">{sub}</div>}
    </div>
);

// --- COMPOSANT PRINCIPAL ---

// 👇 AJOUT DE LA PROP 'dvf'
export const TabSynthese = ({ data, dvf, loading }: { data: BuildingData | null, dvf: TransactionDVF[], loading: boolean }) => {
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-kadris-slate/5 animate-pulse">
            <Loader2 className="animate-spin text-kadris-terracotta mb-2" size={32} />
            <p className="text-kadris-slate/50">Analyse structurelle en cours...</p>
        </div>
    );

    if (!data) return <div className="p-8 text-center bg-white rounded-2xl border border-kadris-slate/5">Aucune donnée disponible.</div>;

    // Données dynamiques
    const risqueArgiles = data.risques_detailles?.argiles || 'Non évalué';

    // 👇 CORRECTION : On utilise la prop 'dvf' passée proprement
    const nbVentes = dvf ? dvf.length : 0;

    const dpeCritique = ['F', 'G'].includes(data.dpe_lettre || '');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* COLONNE GAUCHE */}
            <div className="lg:col-span-2 space-y-8">

                {/* CARTE VISUELLE */}
                <section className="bg-white rounded-2xl p-1 shadow-sm border border-kadris-slate/5 overflow-hidden relative">
                    <div className="bg-kadris-slate/5 h-80 w-full rounded-xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                            <MapLayersViz />
                        </div>

                        <div className="absolute top-4 left-4 bg-kadris-slate text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700 delay-100">
                            <Ruler size={14} /> {data.surface_sol ? `${data.surface_sol} m² (Sol)` : '--'}
                        </div>

                        <div className="absolute top-4 right-4 bg-white text-kadris-slate px-3 py-1.5 rounded-md text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-700 delay-200">
                            <AlertTriangle size={14} className={risqueArgiles === 'Fort' ? 'text-red-500' : 'text-orange-500'} /> Argiles: {risqueArgiles}
                        </div>

                        <div className="absolute bottom-16 right-4 bg-white text-kadris-slate px-3 py-1.5 rounded-md text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                            <TrendingUp size={14} className="text-kadris-sage" /> {nbVentes > 0 ? `${nbVentes} Ventes (500m)` : 'Pas de vente récente'}
                        </div>

                        {data.adresse_ban && (
                            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-md text-xs font-bold text-kadris-slate shadow-sm backdrop-blur-sm flex items-center gap-2">
                                <CheckCircle size={12} className="text-green-600" />
                                {data.adresse_ban}
                            </div>
                        )}
                    </div>
                </section>

                {/* GRILLE IDENTITÉ */}
                <div>
                    <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4 flex items-center gap-2">
                        <Building size={20} className="text-kadris-terracotta" /> Identité Structurelle
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoCard label="Année Constr." value={data.annee_construction} icon={Building} />
                        <InfoCard label="Matériaux Murs" value={data.materiaux_murs} icon={BrickWall} />
                        <InfoCard label="Toiture" value={data.materiaux_toiture} icon={Shield} />
                        <InfoCard label="Usage Principal" value={data.usage} icon={Home} />
                        <InfoCard label="Logements" value={data.nb_logements} icon={Home} sub="Lot(s)" />
                        <InfoCard label="Fiabilité Source" value={data.fiabilite} icon={CheckCircle} color="text-green-600" />
                    </div>
                </div>

            </div>

            {/* COLONNE DROITE */}
            <div className="space-y-6">

                <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                    <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2">
                        <Ruler size={18} className="text-kadris-terracotta" /> Dimensions Clés
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-kadris-slate/50 uppercase font-bold mb-1">Hauteur</span>
                            <div className="font-bold text-lg">{data.hauteur ? `${data.hauteur} m` : '--'}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-kadris-slate/50 uppercase font-bold mb-1">Niveaux</span>
                            <div className="font-bold text-lg">{data.nb_niveaux || '--'}</div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-kadris-slate/5 flex items-center justify-between">
                            <span className="text-xs text-kadris-slate/50 uppercase font-bold">Altitude Sol (NGF)</span>
                            <span className="font-bold text-lg flex items-center gap-1"><Mountain size={14} className="text-kadris-sage" /> {data.altitude ? `${data.altitude} m` : '--'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm text-center">
                    <h3 className="font-bold text-kadris-slate mb-4 flex items-center justify-center gap-2">
                        <FileText size={18} className="text-kadris-terracotta" /> Verdict Technique
                    </h3>
                    <div className={`text-5xl font-black mb-2 ${dpeCritique ? 'text-red-500' : 'text-kadris-terracotta'}`}>
                        {data.dpe_lettre}
                    </div>
                    <p className="text-xs text-kadris-slate/50 mb-4">
                        {data.dpe_lettre === 'Non noté' ? "Non noté (Base ADEME)" : "Classement DPE estimé"}
                    </p>
                    <div className={`p-3 rounded-lg text-sm font-medium ${dpeCritique || risqueArgiles === 'Fort' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                        {dpeCritique ? '⚠️ Rénovation à prévoir' : 'Indicateurs sains'}
                    </div>
                </div>

                {data.risques_detailles && (
                    <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                        <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-orange-500" /> Synthèse Vigilance
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-kadris-slate/70">Retrait Argiles</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${risqueArgiles === 'Fort' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {risqueArgiles.toUpperCase()}
                                </span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};