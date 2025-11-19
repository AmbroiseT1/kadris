"use client";
import React from 'react';
import { ShoppingBag, GraduationCap, Bus, Activity, Volume2, CheckCircle, AlertTriangle, TreePine, Shield, Building2, MapPin, ExternalLink, Plane, Factory, Car, Train } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { CategoryData, AmenityItem, NuisanceItem } from '@/app/lib/quartier';

// Jauge de Score
const ProfileScore = ({ label, score, description, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm flex-1 min-w-[200px]">
     <div className="flex justify-between items-start mb-2">
        <h4 className={`font-bold text-lg ${color}`}>{label}</h4>
        <div className={`text-2xl font-black ${color}`}>{score}<span className="text-sm opacity-50">/100</span></div>
     </div>
     <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${score}%` }}></div>
     </div>
     <p className="text-xs text-kadris-slate/60">{description}</p>
  </div>
);

// Ligne Nuisance Cliquable
const NuisanceRow = ({ label, data, icon: Icon }: { label: string, data: NuisanceItem, icon: any }) => {
    const content = (
        <div className={`flex justify-between items-center p-3 rounded-lg border w-full ${data.present ? 'bg-orange-50 border-orange-100 hover:bg-orange-100 cursor-pointer' : 'bg-green-50 border-green-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${data.present ? 'bg-white text-orange-600' : 'bg-white text-green-600'}`}>
                    <Icon size={18}/>
                </div>
                <div>
                    <div className={`text-sm font-bold ${data.present ? 'text-orange-800' : 'text-green-800'} flex items-center gap-2`}>
                        {label}
                        {data.present && <ExternalLink size={12} className="opacity-50"/>}
                    </div>
                    {data.present && (
                        <div className="text-xs text-orange-700 opacity-80">
                            {data.name} à {data.distance}m
                        </div>
                    )}
                </div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${data.present ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                {data.present ? "DÉTECTÉ" : "OK"}
            </div>
        </div>
    );

    // Si présent, on wrap dans un lien
    if (data.present && data.lat && data.lon) {
        return (
            <a href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`} target="_blank" rel="noopener noreferrer">
                {content}
            </a>
        );
    }
    return content;
};

// Section Détail
const DetailSection = ({ title, data, icon: Icon }: { title: string, data: CategoryData | undefined, icon: any }) => {
    if (!data) return null;

    return (
        <div className="bg-white rounded-2xl border border-kadris-slate/5 shadow-sm overflow-hidden">
            <div className="p-4 bg-kadris-cream/30 border-b border-kadris-slate/5 flex justify-between items-center">
                <h4 className="font-bold text-kadris-slate flex items-center gap-2">
                    <Icon size={18} className="text-kadris-terracotta"/> {title}
                </h4>
                <span className="bg-white border border-kadris-slate/10 text-kadris-slate text-xs font-bold px-2 py-1 rounded-full">
                    {data.count} résultats
                </span>
            </div>
            <div className="max-h-[250px] overflow-y-auto">
                {data.count > 0 ? (
                    <ul className="divide-y divide-kadris-slate/5">
                        {data.items.map((item: AmenityItem, i: number) => (
                            <li key={i} className="group hover:bg-kadris-cream/20 transition-colors">
                                <a 
                                   href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="p-3 flex justify-between items-center w-full h-full"
                                >
                                    <div>
                                        <div className="text-sm font-bold text-kadris-slate group-hover:text-kadris-terracotta transition-colors flex items-center gap-2">
                                            {item.name}
                                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity"/>
                                        </div>
                                        <div className="text-xs text-kadris-slate/50 capitalize">
                                            {item.type.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-kadris-sage bg-kadris-sage/10 px-2 py-1 rounded group-hover:bg-kadris-terracotta/10 group-hover:text-kadris-terracotta transition-colors">
                                        <MapPin size={10} />
                                        {item.distance}m
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-6 text-sm text-gray-400 italic text-center">
                        Aucun établissement recensé dans le périmètre.
                    </p>
                )}
            </div>
        </div>
    );
};

export const TabQuartier = ({ data }: { data: BuildingData | null }) => {
    if (!data?.quartier) return <div className="p-8 text-center text-kadris-slate/50">Chargement de l'analyse quartier...</div>;
    
    const q = data.quartier;
    if (!q.categories) return <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">Données incomplètes.</div>;
    
    const c = q.categories;
    const n = q.nuisances;

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
         
         {/* 1. SCORES */}
         <div>
            <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4">Indices de Vie</h3>
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2">
               <ProfileScore label="Famille" score={q.scores.famille} description="Éducation, Parcs, Sécurité." color="text-blue-600" />
               <ProfileScore label="Investisseur" score={q.scores.investisseur} description="Transports, Demande." color="text-purple-600" />
               <ProfileScore label="Qualité de Vie" score={q.scores.qualite_vie} description="Santé, Alimentation, Calme." color="text-green-600" />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. COLONNE GAUCHE : NUISANCES (Mise en avant) */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-kadris-slate flex items-center gap-2 uppercase tracking-wider text-sm">
                        <Volume2 size={18} className="text-orange-500"/> Exposition Sonore
                     </h3>
                     <span className={`text-xs font-bold px-2 py-1 rounded border ${n.score_calme > 70 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                         CALME : {n.score_calme}/100
                     </span>
                  </div>
                  
                  <div className="space-y-3">
                     <NuisanceRow label="Trafic Routier" data={n.autoroute} icon={Car} />
                     <NuisanceRow label="Trafic Ferroviaire" data={n.ferre} icon={Train} />
                     <NuisanceRow label="Trafic Aérien" data={n.aerien} icon={Plane} />
                     <NuisanceRow label="Zone Industrielle" data={n.industriel} icon={Factory} />
                  </div>
                  
                  <div className="mt-4 text-[10px] text-kadris-slate/40 italic text-center">
                     Cliquez sur une alerte pour localiser la source.
                  </div>
               </div>
               
               {/* Sécurité juste en dessous */}
               <DetailSection title="Sécurité" data={c.securite} icon={Shield} />
            </div>

            {/* 3. COLONNES DROITE : COMMODITÉS (2 Colonnes larges) */}
            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <DetailSection title="Éducation" data={c.education} icon={GraduationCap} />
                   <DetailSection title="Santé" data={c.sante} icon={Activity} />
                   <DetailSection title="Commerces" data={c.alimentation} icon={ShoppingBag} />
                   <DetailSection title="Transports" data={c.transport} icon={Bus} />
                   <DetailSection title="Loisirs" data={c.loisirs} icon={TreePine} />
                   <DetailSection title="Administration" data={c.administration} icon={Building2} />
                </div>
            </div>

         </div>
      </div>
    );
};