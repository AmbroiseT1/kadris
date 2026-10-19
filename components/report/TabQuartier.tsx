"use client";
import React from 'react';
import { ShoppingBag, GraduationCap, Bus, Activity, Volume2, TreePine, Shield, Building2, MapPin, ExternalLink, Plane, Factory, Car, Train, Utensils, type LucideIcon } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { CategoryData, AmenityItem, NuisanceItem } from '@/app/lib/quartier';
import { SourceBadge, UnavailableBlock } from './SourceBadge';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues
const NeighborhoodMap = dynamic(() => import('@/components/ui/NeighborhoodMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-papier animate-pulse rounded-xl flex items-center justify-center text-texte-2">Chargement de la carte...</div>
});

// Section de Liste Détaillée (Dépliée)
const AmenityDetailList = ({ title, data, icon: Icon }: { title: string, data: CategoryData | undefined, icon: LucideIcon }) => {
    if (!data || data.count === 0) return null; // N'affiche rien si la catégorie est vide

    return (
        <div className="bg-white rounded-xl border border-trait shadow-sm overflow-hidden">
            <div className="p-4 bg-papier border-b border-trait flex justify-between items-center">
                <h4 className="font-bold text-texte flex items-center gap-3">
                    <Icon size={20} className="text-brique" />
                    {title}
                </h4>
                <span className="bg-white border border-trait text-texte text-xs font-bold px-3 py-1 rounded-full">
                    {data.count} résultats
                </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                <ul className="divide-y divide-trait">
                    {data.items.map((item: AmenityItem, i: number) => (
                        <li key={i} className="group hover:bg-papier transition-colors">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 flex justify-between items-center w-full h-full"
                            >
                                <div>
                                    <div className="text-sm font-bold text-texte group-hover:text-brique transition-colors flex items-center gap-2">
                                        {item.name}
                                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-texte-2 capitalize">
                                        {item.type.replace(/_/g, ' ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold text-ok bg-ok-soft px-2 py-1 rounded group-hover:bg-brique-soft group-hover:text-brique transition-colors">
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

// Ligne Nuisance
const NuisanceRow = ({ label, data, icon: Icon }: { label: string, data: NuisanceItem, icon: LucideIcon }) => {
    const content = (
        <div className={`flex justify-between items-center p-3 rounded-lg border w-full ${data.present ? 'bg-vigil-soft border-vigil/30 hover:bg-vigil-soft cursor-pointer' : 'bg-ok-soft border-ok/30'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${data.present ? 'bg-white text-vigil' : 'bg-white text-ok'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <div className={`text-sm font-bold ${data.present ? 'text-vigil' : 'text-ok'} flex items-center gap-2`}>
                        {label}
                    </div>
                    {data.present && (
                        <div className="text-xs text-vigil opacity-80">
                            {data.name} à {data.distance}m
                        </div>
                    )}
                </div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${data.present ? 'bg-vigil-soft text-vigil' : 'bg-ok-soft text-ok'}`}>
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
    const source = data?.sources?.quartier;
    if (!data?.quartier) {
        if (source?.status === 'error') return <UnavailableBlock title="Analyse du quartier" source={source} />;
        return <div className="p-8 text-center text-texte-2">Chargement de l’analyse quartier...</div>;
    }

    const q = data.quartier;
    if (!q.categories) return <div className="p-8 text-center bg-alerte-soft text-alerte rounded-xl">Données incomplètes.</div>;

    const c = q.categories;
    const n = q.nuisances;

    // Collect all POIs for the map
    const allPois = [
        ...c.education.items,
        ...c.sante.items,
        ...c.alimentation.items,
        ...c.restauration.items, // [NEW]
        ...c.transport.items,
        ...c.loisirs.items
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* COLONNE GAUCHE : Carte & Score Calme */}
            <div className="space-y-6">

                {/* CARTE INTERACTIVE */}
                <div className="h-80 w-full rounded-xl border border-trait shadow-sm overflow-hidden relative z-0">
                    {data.coords ? (
                        <NeighborhoodMap center={data.coords} pois={allPois} />
                    ) : (
                        <div className="h-full w-full bg-papier flex items-center justify-center text-texte-2">
                            Coordonnées non disponibles
                        </div>
                    )}
                </div>

                {/* SCORE CALME bricq - Mis en avant */}
                <div className="bg-white rounded-xl border border-trait shadow-md p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Volume2 size={100} className="text-brique" />
                    </div>

                    <h3 className="font-serif text-xl font-bold text-texte mb-4 flex items-center gap-2 relative z-10">
                        <Volume2 className="text-brique" /> Score Calme bricq
                    </h3>

                    <div className="flex items-end gap-4 relative z-10">
                        <div className="text-6xl font-black text-texte leading-none">
                            {n.score_calme}<span className="text-2xl text-texte-2 font-medium">/100</span>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold mb-2 ${n.score_calme > 80 ? 'bg-ok-soft text-ok' :
                            n.score_calme > 50 ? 'bg-vigil-soft text-vigil' :
                                'bg-alerte-soft text-alerte'
                            }`}>
                            {n.score_calme > 80 ? 'EXCELLENT' : n.score_calme > 50 ? 'MOYEN' : 'BRUYANT'}
                        </div>
                    </div>

                    <div className="mt-6 space-y-3 relative z-10">
                        <NuisanceRow label="Autoroute" data={n.autoroute} icon={Car} />
                        <NuisanceRow label="Voie Ferrée" data={n.ferre} icon={Train} />
                        <NuisanceRow label="Couloir Aérien" data={n.aerien} icon={Plane} />
                        <NuisanceRow label="Industrie" data={n.industriel} icon={Factory} />
                    </div>
                </div>

            </div>

            {/* COLONNE DROITE : Commodités */}
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="font-serif text-lg font-bold text-texte sticky top-0 bg-papier z-10 py-2 border-b border-trait">
                    Commodités à proximité
                </h3>

                {/* Alimentation en premier pour mise en avant */}
                <AmenityDetailList title="Supermarchés & Alimentation" data={c.alimentation} icon={ShoppingBag} />
                <AmenityDetailList title="Restaurants & Bars" data={c.restauration} icon={Utensils} /> {/* [NEW] */}

                <div className="grid grid-cols-1 gap-4">
                    <AmenityDetailList title="Éducation" data={c.education} icon={GraduationCap} />
                    <AmenityDetailList title="Santé" data={c.sante} icon={Activity} />
                    <AmenityDetailList title="Transports" data={c.transport} icon={Bus} />
                    <AmenityDetailList title="Loisirs & Nature" data={c.loisirs} icon={TreePine} />
                    <AmenityDetailList title="Sécurité" data={c.securite} icon={Shield} />
                    <AmenityDetailList title="Administration" data={c.administration} icon={Building2} />
                </div>
            </div>
            <SourceBadge source={source} />

        </div>
    );
};
