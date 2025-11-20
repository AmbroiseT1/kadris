"use client";
import React from 'react';
import { ShoppingBag, GraduationCap, Bus, Activity, Volume2, CheckCircle, AlertTriangle, TreePine, Shield, Building2, MapPin, ExternalLink, Plane, Factory, Car, Train } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { CategoryData, AmenityItem, NuisanceItem } from '@/app/lib/quartier';

// Section de Liste Détaillée (Dépliée)
const AmenityDetailList = ({ title, data, icon: Icon }: { title: string, data: CategoryData | undefined, icon: any }) => {
    if (!data || data.count === 0) return null; // N'affiche rien si la catégorie est vide

    return (
        <div className="bg-white rounded-xl border border-kadris-slate/5 shadow-sm overflow-hidden">
            <div className="p-4 bg-kadris-cream/70 border-b border-kadris-slate/5 flex justify-between items-center">
                <h4 className="font-bold text-kadris-slate flex items-center gap-3">
                    <Icon size={20} className="text-kadris-terracotta"/> 
                    {title}
                </h4>
                <span className="bg-white border border-kadris-slate/10 text-kadris-slate text-xs font-bold px-3 py-1 rounded-full">
                    {data.count} résultats
                </span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
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
            </div>
        </div>
    );
};

// Ligne Nuisance (Inchangée)
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

    if (data.present && data.lat && data.lon) {
        return (
            <a href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`} target="_blank" rel="noopener noreferrer">
                {content}
            </a>
        );
    }
    return content;
};


export const TabQuartier = ({ data }: { data: BuildingData | null }) => {
    if (!data?.quartier) return <div className="p-8 text-center text-kadris-slate/50">Chargement de l'analyse quartier...</div>;
    
    const q = data.quartier;
    if (!q.categories) return <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">Données incomplètes.</div>;
    
    const c = q.categories;
    const n = q.nuisances;

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
         
         {/* 1. NUISANCES (Mise en avant) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Carte Nuisances */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Volume2 size={18} className="text-orange-500"/> Exposition Sonore
               </h3>
               <div className="space-y-3">
                  <NuisanceRow label="Trafic Routier" data={n.autoroute} icon={Car} />
                  <NuisanceRow label="Trafic Ferroviaire" data={n.ferre} icon={Train} />
                  <NuisanceRow label="Trafic Aérien" data={n.aerien} icon={Plane} />
                  <NuisanceRow label="Zone Industrielle" data={n.industriel} icon={Factory} />
               </div>
               <div className="mt-4 pt-4 border-t border-kadris-slate/10 text-xs text-kadris-slate/50 italic text-center">
                  Score Calme Kadris : {n.score_calme}/100
               </div>
            </div>
            
            {/* Sécurité et Administration */}
            <div className="space-y-4">
                <div className="text-sm font-bold text-kadris-slate/60 mb-2">Sécurité & Services Publics (1.5km)</div>
                <AmenityDetailList title="Sécurité" data={c.securite} icon={Shield} />
                <AmenityDetailList title="Administration" data={c.administration} icon={Building2} />
            </div>

         </div>

         {/* 2. DÉTAILS EXHAUSTIFS (Grille Unifiée) */}
         <div>
            <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4">Inventaire Détaillé des POI</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {/* Grille principale des commodités */}
               <AmenityDetailList title="Alimentation" data={c.alimentation} icon={ShoppingBag} />
               <AmenityDetailList title="Santé" data={c.sante} icon={Activity} />
               <AmenityDetailList title="Éducation" data={c.education} icon={GraduationCap} />
               <AmenityDetailList title="Transports" data={c.transport} icon={Bus} />
               <AmenityDetailList title="Loisirs" data={c.loisirs} icon={TreePine} />
            </div>
         </div>
      </div>
    );
};