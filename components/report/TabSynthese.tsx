"use client";
import React from 'react';
import { MapLayersViz } from '@/components/ui/Diagrams';
import { Building, BrickWall, Shield, Home, CheckCircle, Ruler, MapPin, ArrowLeft, Mountain, FileText, Loader2 } from 'lucide-react';
import { BuildingData } from '@/app/lib/types'; // Import centralisé

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

export const TabSynthese = ({ data, loading }: { data: BuildingData | null, loading: boolean }) => {
  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-kadris-terracotta"/></div>;
  if (!data) return <div className="p-8 text-center">Aucune donnée.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-white rounded-2xl p-1 shadow-sm border border-kadris-slate/5 overflow-hidden relative">
          <div className="bg-kadris-slate/5 h-64 w-full rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                 <MapLayersViz />
              </div>
              {data.adresse_ban && (
                <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded-md text-xs font-bold text-kadris-slate shadow-sm backdrop-blur-sm flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-600"/>
                  {data.adresse_ban}
                </div>
              )}
          </div>
        </section>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoCard label="Année Constr." value={data.annee_construction} icon={Building} />
            <InfoCard label="Matériaux Murs" value={data.materiaux_murs} icon={BrickWall} />
            <InfoCard label="Toiture" value={data.materiaux_toiture} icon={Shield} />
            <InfoCard label="Usage Principal" value={data.usage} icon={Home} />
            <InfoCard label="Logements" value={data.nb_logements} icon={Home} sub="Lot(s)" />
            <InfoCard label="Fiabilité Source" value={data.fiabilite} icon={CheckCircle} color="text-green-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="Emprise Sol" value={`${data.surface_sol} m²`} icon={MapPin} />
            <InfoCard label="Hauteur Moy." value={`${data.hauteur} m`} icon={ArrowLeft} className="rotate-90" />
            <InfoCard label="Niveaux" value={data.nb_niveaux} icon={Building} />
            <InfoCard label="Altitude Sol" value={`${data.altitude} m`} icon={Mountain} sub="NGF" />
        </div>
      </div>
      <div className="space-y-6">
         <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm text-center">
            <h3 className="font-bold text-kadris-slate mb-4 flex items-center justify-center gap-2">
               <FileText size={18} className="text-kadris-terracotta"/> Performance Énergétique
            </h3>
            <div className={`text-5xl font-black mb-2 ${data.dpe_lettre === 'Non noté' ? 'text-gray-300' : 'text-kadris-terracotta'}`}>
                {data.dpe_lettre}
            </div>
            <p className="text-xs text-kadris-slate/50">
                {data.dpe_lettre === 'Non noté' ? "Non noté (Base ADEME)" : "Classement DPE estimé"}
            </p>
         </div>
      </div>
    </div>
  );
};