"use client";
import React from 'react';
import { MapLayersViz } from '@/components/ui/Diagrams';
import dynamic from 'next/dynamic';
import { Building, Shield, Home, CheckCircle, Ruler, Mountain, FileText, Loader2, AlertTriangle, TrendingUp, type LucideIcon } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TransactionDVF } from '@/app/lib/dvf';
import { SourceBadge } from './SourceBadge';

const IgnMapViewer = dynamic(() => import('@/components/ui/IgnMapViewer'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

// --- SOUS-COMPOSANTS UI ---

interface InfoCardProps {
    label: string;
    value?: React.ReactNode;
    icon: LucideIcon;
    color?: string;
    sub?: React.ReactNode;
    className?: string;
    tooltip?: string;
}

const InfoCard = ({ label, value, icon: Icon, color, sub, className, tooltip }: InfoCardProps) => (
    <div className={`bg-white p-4 rounded-sm border border-bricq-slate/10 flex flex-col justify-between ${className} group relative`} title={tooltip}>
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-bricq-terracotta" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-bricq-slate/40 font-mono">{label}</span>
            </div>
            <div className={`font-bold text-lg text-bricq-slate leading-tight ${color || ''}`}>
                {value || "--"}
            </div>
        </div>
        {sub && <div className="text-xs text-bricq-slate/40 mt-1">{sub}</div>}

        {/* Simple CSS Tooltip */}
        {tooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
        )}
    </div>
);

// --- COMPOSANT PRINCIPAL ---

export const TabSynthese = ({ data, dvf, loading }: { data: BuildingData | null, dvf: TransactionDVF[], loading: boolean }) => {
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-sm border border-bricq-slate/10 animate-pulse">
            <Loader2 className="animate-spin text-bricq-terracotta mb-2" size={24} />
            <p className="text-bricq-slate/50 font-serif text-sm italic">Analyse structurelle en cours...</p>
        </div>
    );

    if (!data) return <div className="p-8 text-center bg-white rounded-sm border border-bricq-slate/10">Aucune donnée disponible.</div>;

    // Données dynamiques
    const risks = data.risques_detailles;
    const sources = data.sources || {};
    // Jamais « aucun risque » par défaut : non chargé = « Non évalué », erreur = « Données indisponibles »
    const risqueArgiles = !risks
        ? 'Non évalué'
        : risks.argiles === 'Nul' ? 'Non exposé'
        : risks.argiles ?? (risks.sections?.argiles === 'empty' ? 'Non renseigné' : 'Données indisponibles');
    const inondationLabel = !risks ? 'Non évalué'
        : risks.inondation === true ? 'Commune exposée'
        : risks.inondation === false ? 'Non recensé' : 'Données indisponibles';
    const catnatLabel = !risks ? 'Non évalué'
        : risks.catnat ? `${risks.catnat.count} arrêté(s)` : 'Données indisponibles';
    const nbVentes = dvf ? dvf.length : 0;
    const dvfIndisponible = sources.dvf?.status === 'error';
    const dpeCritique = ['F', 'G'].includes(data.dpe_lettre || '');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* COLONNE GAUCHE */}
            <div className="lg:col-span-2 space-y-8">

                {/* CARTE VISUELLE */}
                <section className="bg-white rounded-sm p-1 border border-bricq-slate/10 overflow-hidden relative">
                    <div className="bg-bricq-slate/5 h-80 w-full rounded-sm flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 z-0">
                            {data.coords ? (
                                <IgnMapViewer
                                    lat={data.coords.lat}
                                    lon={data.coords.lon}
                                    zoom={18}
                                    showControls={true}
                                    initialLayer="Plan Cadastral"
                                />
                            ) : (
                                <MapLayersViz />
                            )}
                        </div>
                    </div>
                </section>

                {/* INFO BADGES */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-sm border border-bricq-slate/10 flex items-center gap-3">
                        <div className="bg-bricq-slate/5 p-2 rounded-full">
                            <Ruler size={14} className="text-bricq-slate" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-bricq-slate/40 font-mono">Surface Sol</div>
                            <div className="font-bold text-sm text-bricq-slate">{data.surface_sol ? `${data.surface_sol} m²` : '--'}</div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-sm border border-bricq-slate/10 flex items-center gap-3">
                        <div className={`p-2 rounded-full ${risqueArgiles === 'Fort' ? 'bg-red-50' : 'bg-orange-50'}`}>
                            <AlertTriangle size={14} className={risqueArgiles === 'Fort' ? 'text-red-500' : 'text-orange-500'} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-bricq-slate/40 font-mono">Argiles</div>
                            <div className={`font-bold text-sm ${risqueArgiles === 'Fort' ? 'text-red-600' : 'text-orange-600'}`}>{risqueArgiles}</div>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-sm border border-bricq-slate/10 flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-full">
                            <TrendingUp size={14} className="text-green-600" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-bricq-slate/40 font-mono">Ventes (500m)</div>
                            <div className="font-bold text-sm text-bricq-slate">{dvfIndisponible ? 'Indisponible' : nbVentes > 0 ? `${nbVentes} Ventes` : 'Aucune'}</div>
                        </div>
                    </div>

                    {data.adresse_ban && (
                        <div className="bg-white p-3 rounded-sm border border-bricq-slate/10 flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-full">
                                <CheckCircle size={14} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-bricq-slate/40 font-mono">Adresse BAN</div>
                                <div className="font-bold text-sm text-bricq-slate truncate max-w-[120px]" title={data.adresse_ban}>{data.adresse_ban}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* GRILLE IDENTITÉ */}
                <div className="bg-white border border-stone-200 rounded-sm p-5">
                    <h3 className="font-serif text-lg text-bricq-slate border-b border-stone-100 pb-2 mb-4 flex items-center gap-2">
                        <Building size={18} className="text-bricq-terracotta" /> Identité Structurelle
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoCard label="Année Constr." value={data.annee_construction} icon={Building} tooltip="Année de construction estimée du bâtiment principal" />
                        <InfoCard label="Matériaux Murs" value={data.materiaux_murs} icon={Shield} tooltip="Matériau dominant des murs extérieurs" />
                        <InfoCard label="Toiture" value={data.materiaux_toiture} icon={Shield} tooltip="Matériau principal de la couverture" />
                        <InfoCard label="Usage Principal" value={data.usage} icon={Home} tooltip="Usage déclaré (Habitation, Commerce, etc.)" />
                        <InfoCard label="Logements" value={data.nb_logements} icon={Home} sub="Lot(s)" tooltip="Nombre de lots d'habitation recensés" />
                        <InfoCard label="Fiabilité Source" value={data.fiabilite} icon={CheckCircle} color="text-green-600" tooltip="Indice de confiance des données (sur 10)" />
                    </div>
                </div>

            </div>

            {/* COLONNE DROITE */}
            <div className="space-y-6">

                <div className="bg-white border border-stone-200 rounded-sm p-5">
                    <h3 className="font-serif text-lg text-bricq-slate border-b border-stone-100 pb-2 mb-4 flex items-center gap-2">
                        <Ruler size={18} className="text-bricq-terracotta" /> Dimensions Clés
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-bricq-slate/50 uppercase font-bold mb-1 font-mono">Hauteur</span>
                            <div className="font-bold text-lg">{data.hauteur ? `${data.hauteur} m` : '--'}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-bricq-slate/50 uppercase font-bold mb-1 font-mono">Niveaux</span>
                            <div className="font-bold text-lg">{data.nb_niveaux || '--'}</div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-bricq-slate/5 flex items-center justify-between">
                            <span className="text-[10px] text-bricq-slate/50 uppercase font-bold font-mono">Altitude Sol (NGF)</span>
                            <span className="font-bold text-lg flex items-center gap-1"><Mountain size={14} className="text-bricq-sage" /> {data.altitude ? `${data.altitude} m` : '--'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-sm p-5 text-center">
                    <h3 className="font-serif text-lg text-bricq-slate border-b border-stone-100 pb-2 mb-4 flex items-center justify-center gap-2">
                        <FileText size={18} className="text-bricq-terracotta" /> Verdict Technique
                    </h3>
                    <div className={`text-5xl font-black mb-2 ${dpeCritique ? 'text-red-500' : 'text-bricq-terracotta'}`}>
                        {data.dpe_lettre}
                    </div>
                    <p className="text-xs text-bricq-slate/50 mb-4 font-mono">
                        {data.dpe_lettre === 'Non noté' ? "Non noté (Base ADEME)" : "Classement DPE estimé (BDNB)"}
                    </p>
                    {data.dpe_reel?.match_label && (
                        <p className={`text-[11px] mb-3 ${data.dpe_reel.match === 'proximite' ? 'text-orange-700' : 'text-bricq-slate/60'}`}>
                            DPE ADEME {data.dpe_reel.classe_bilan_dpe} — {data.dpe_reel.match_label}
                        </p>
                    )}
                    <div className={`p-3 rounded-sm text-sm font-medium border ${dpeCritique || risqueArgiles === 'Fort' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                        {dpeCritique ? '⚠️ Rénovation à prévoir' : risks?.status === 'ok' ? 'Indicateurs sains' : 'Indicateurs partiels (risques non évalués)'}
                    </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-sm p-5">
                    <h3 className="font-serif text-lg text-bricq-slate border-b border-stone-100 pb-2 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-500" /> Synthèse Vigilance
                    </h3>
                    <ul className="space-y-3">
                        {[
                            { label: 'Retrait Argiles', value: risqueArgiles, alert: risqueArgiles === 'Fort' || risqueArgiles === 'Moyen' },
                            { label: 'Inondation (commune)', value: inondationLabel, alert: risks?.inondation === true },
                            { label: 'Arrêtés CatNat', value: catnatLabel, alert: (risks?.catnat?.count || 0) > 0 },
                        ].map(row => {
                            const unknown = row.value === 'Données indisponibles' || row.value === 'Non évalué' || row.value === 'Non renseigné';
                            return (
                                <li key={row.label} className="flex justify-between items-center text-sm gap-2">
                                    <span className="text-bricq-slate/70">{row.label}</span>
                                    <span className={`px-2 py-1 rounded-sm text-xs font-bold border ${unknown ? 'bg-slate-50 text-slate-500 border-slate-200' : row.alert ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                        {row.value.toUpperCase()}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    <SourceBadge source={sources.risques} className="mt-4" />
                </div>
                <SourceBadge source={sources.bdnb} />
                <SourceBadge source={sources.dpe} />
            </div>
        </div>
    );
};
