"use client";
import React from 'react';
import { 
  Building, BrickWall, Shield, Home, CheckCircle, Ruler, MapPin, ArrowLeft, Mountain, FileText, Loader2, 
  AlertTriangle, TrendingUp, Scroll, Pickaxe, DollarSign, Activity, Leaf, School, ShoppingBag, Bus, Factory, Volume2 
} from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { MapLayersViz } from '@/components/ui/Diagrams';

// --- SOUS-COMPOSANTS UI ---

const DataRow = ({ label, value, icon: Icon, sub }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-kadris-slate/5 last:border-0">
        <div className="flex items-center gap-2 text-kadris-slate/60 text-sm">
            {Icon && <Icon size={14} className="text-kadris-terracotta" />}
            {label}
        </div>
        <div className="text-right">
            <div className="font-bold text-kadris-slate text-sm">{value || "--"}</div>
            {sub && <div className="text-[10px] text-kadris-slate/40">{sub}</div>}
        </div>
    </div>
);

const StatusBadge = ({ status, label, color }: any) => (
    <div className={`flex items-center justify-between p-2 rounded-lg ${color} mb-1`}>
        <span className="text-xs font-bold uppercase">{label}</span>
        <span className="text-sm font-black">{status}</span>
    </div>
);

const ScoreCircle = ({ score, label, color }: any) => (
    <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full border-4 ${color} flex items-center justify-center font-bold text-kadris-slate mb-1`}>
            {score}
        </div>
        <span className="text-[10px] text-center text-kadris-slate/60 uppercase font-bold">{label}</span>
    </div>
);

// --- COMPOSANT PRINCIPAL ---

export const TabSynthese = ({ data, loading }: { data: BuildingData | null, loading: boolean }) => {
  if (loading) return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-2xl border border-kadris-slate/5 animate-pulse">
        <Loader2 className="animate-spin text-kadris-terracotta mb-4" size={48} />
        <p className="text-kadris-slate/50 font-medium">Agrégation de 7 sources de données...</p>
      </div>
  );

  if (!data) return <div className="p-8 text-center bg-white rounded-2xl border border-kadris-slate/5">Données indisponibles.</div>;

  // --- PRÉPARATION DES DATAS ---
  const r = data.risques_detailles;
  const u = data.urbanisme;
  const q = data.quartier;
  const dpeLet = data.dpe_lettre || '?';
  
  // Calcul Prix Moyen DVF (sur les ventes chargées)
  // Note: data.transactions n'est pas dans l'interface BuildingData de base, 
  // il faudrait l'ajouter si tu veux l'afficher ici, ou le passer en prop.
  // Pour l'instant on met un placeholder intelligent.
  
  const isDpeGood = ['A', 'B', 'C'].includes(dpeLet);
  const isDpeBad = ['F', 'G'].includes(dpeLet);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 1. EN-TÊTE : VISUEL + IDENTITÉ + DPE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[320px]">
            
            {/* CARTE 3D */}
            <div className="lg:col-span-1 bg-kadris-slate/5 rounded-2xl overflow-hidden relative border border-kadris-slate/10">
                <div className="absolute inset-0 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                     <MapLayersViz />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-white/50">
                        <div className="text-xs text-kadris-slate/50 uppercase font-bold mb-1">Adresse Normalisée (BAN)</div>
                        <div className="font-bold text-kadris-slate text-sm line-clamp-2">{data.adresse_ban}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs font-mono text-kadris-sage bg-kadris-sage/10 px-2 py-1 rounded w-fit">
                            <MapPin size={10}/> {data.coords?.lat.toFixed(5)}, {data.coords?.lon.toFixed(5)}
                        </div>
                    </div>
                </div>
            </div>

            {/* FICHE TECHNIQUE (BDNB) */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm overflow-y-auto">
                <h3 className="font-serif text-lg font-bold text-kadris-slate mb-4 flex items-center gap-2">
                    <Building size={18} className="text-kadris-terracotta"/> Identité du Bâti
                </h3>
                <div className="space-y-1">
                    <DataRow icon={Building} label="Année Construction" value={data.annee_construction} />
                    <DataRow icon={BrickWall} label="Matériaux Murs" value={data.materiaux_murs} />
                    <DataRow icon={Shield} label="Matériaux Toiture" value={data.materiaux_toiture} />
                    <DataRow icon={Home} label="Usage Principal" value={data.usage} />
                    <DataRow icon={Building} label="Niveaux" value={data.nb_niveaux} />
                    <DataRow icon={ArrowLeft} label="Hauteur" value={data.hauteur ? `${data.hauteur} m` : '--'} />
                    <DataRow icon={Ruler} label="Surface Sol (Emprise)" value={data.surface_sol ? `${data.surface_sol} m²` : '--'} />
                    <DataRow icon={CheckCircle} label="Fiabilité Donnée" value={data.fiabilite} />
                </div>
            </div>

            {/* PERFORMANCE ÉNERGÉTIQUE (DPE) */}
            <div className={`p-6 rounded-2xl border shadow-sm text-center flex flex-col justify-center items-center ${isDpeBad ? 'bg-red-50 border-red-100' : isDpeGood ? 'bg-green-50 border-green-100' : 'bg-white border-kadris-slate/5'}`}>
                <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 opacity-70">
                    <Leaf size={18}/> Performance
                </h3>
                <div className={`text-8xl font-black mb-2 ${isDpeBad ? 'text-red-500' : isDpeGood ? 'text-green-600' : 'text-orange-500'}`}>
                    {dpeLet}
                </div>
                <div className="text-sm font-medium text-kadris-slate/60">
                    {isDpeBad ? "Rénovation indispensable" : isDpeGood ? "Bâtiment Vertueux" : "Standard (Isolation moyenne)"}
                </div>
            </div>
        </div>

        {/* 2. GRILLE D'ANALYSE (4 BLOCS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* BLOC A : URBANISME (GPU) */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm">
                <h4 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Scroll size={16} className="text-blue-600"/> Urbanisme
                </h4>
                {u ? (
                    <div className="space-y-2">
                        <StatusBadge 
                            label="Zonage PLU" 
                            status={u.zonage?.code || "?"} 
                            color={u.zonage?.is_constructible ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"} 
                        />
                        <DataRow label="Type Zone" value={u.zonage?.type} />
                        <DataRow label="Constructible" value={u.zonage?.is_constructible ? "OUI" : "NON / RESTREINT"} />
                        <DataRow label="Servitudes (SUP)" value={`${u.servitudes.length} détectée(s)`} />
                        <DataRow label="Prescriptions" value={`${u.prescriptions.length} architecturale(s)`} />
                    </div>
                ) : <p className="text-xs text-gray-400">Données GPU non disponibles.</p>}
            </div>

            {/* BLOC B : RISQUES & SOLS (Géorisques) */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm">
                <h4 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <AlertTriangle size={16} className="text-orange-600"/> Vigilance
                </h4>
                {r ? (
                    <div className="space-y-2">
                         <StatusBadge 
                            label="Argiles (Sol)" 
                            status={r.argiles} 
                            color={r.argiles === 'Fort' ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} 
                        />
                        <DataRow label="Inondation (PPRI)" value={r.inondation ? "OUI (Zone à risque)" : "NON"} icon={r.inondation ? AlertTriangle : CheckCircle} />
                        <DataRow label="Cavités Souterraines" value={r.cavites?.count > 0 ? `${r.cavites.count} (Risque)` : "Aucune"} icon={Pickaxe} />
                        <DataRow label="Radon" value={r.radon} icon={Activity} />
                        <DataRow label="Catastrophes (Hist)" value={`${r.catnat.count} Arrêtés`} />
                    </div>
                ) : <p className="text-xs text-gray-400">Données Géorisques en cours.</p>}
            </div>

            {/* BLOC C : ENVIRONNEMENT (OSM) */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm">
                <h4 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Volume2 size={16} className="text-purple-600"/> Nuisances
                </h4>
                {q && q.nuisances ? (
                    <div className="space-y-2">
                         <StatusBadge 
                            label="Score Calme" 
                            status={`${q.nuisances.score_calme}/100`} 
                            color={q.nuisances.score_calme > 70 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"} 
                        />
                        <DataRow label="Autoroute (<300m)" value={q.nuisances.autoroute.present ? "OUI" : "NON"} />
                        <DataRow label="Voie Ferrée (<300m)" value={q.nuisances.ferre.present ? "OUI" : "NON"} />
                        <DataRow label="Usine / Seveso" value={q.nuisances.industriel.present ? "OUI" : "NON"} icon={Factory} />
                        <DataRow label="Aéroport / Piste" value={q.nuisances.aerien.present ? "OUI" : "NON"} />
                    </div>
                ) : <p className="text-xs text-gray-400">Calcul environnement en cours.</p>}
            </div>

            {/* BLOC D : QUALITÉ DE VIE (OSM) */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm">
                <h4 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <ShoppingBag size={16} className="text-blue-600"/> Vie de Quartier
                </h4>
                {q && q.scores ? (
                    <div>
                        <div className="flex justify-around mb-6">
                            <ScoreCircle score={q.scores.famille} label="Famille" color="border-blue-500 text-blue-600" />
                            <ScoreCircle score={q.scores.investisseur} label="Invest." color="border-purple-500 text-purple-600" />
                            <ScoreCircle score={q.scores.qualite_vie} label="Vie" color="border-green-500 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <DataRow icon={School} label="Éducation" value={`${q.categories.education.count} Établ.`} />
                            <DataRow icon={ShoppingBag} label="Commerces" value={`${q.categories.alimentation.count} Magasins`} />
                            <DataRow icon={Bus} label="Transports" value={`${q.categories.transport.count} Arrêts`} />
                        </div>
                    </div>
                ) : <p className="text-xs text-gray-400">Analyse quartier en cours.</p>}
            </div>

        </div>
    </div>
  );
};