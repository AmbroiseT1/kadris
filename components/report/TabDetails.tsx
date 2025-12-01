"use client";
import React, { useState } from 'react';
import { Database, ChevronDown, ChevronRight, FileJson, Layers, Activity } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { TabBatiment } from './TabBatiment';

// Petit composant pour afficher du JSON proprement
const JsonViewer = ({ data, title, icon: Icon }: { data: any, title: string, icon: any }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    return (
        <div className="border border-bricq-slate/10 rounded-xl overflow-hidden bg-white mb-4 shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-bricq-cream/30 hover:bg-bricq-cream/60 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-bricq-slate/5 text-bricq-slate">
                        <Icon size={18} />
                    </div>
                    <span className="font-bold text-bricq-slate text-sm uppercase tracking-wide">{title}</span>
                </div>
                {isOpen ? <ChevronDown size={18} className="text-bricq-slate/50" /> : <ChevronRight size={18} className="text-bricq-slate/50" />}
            </button>

            {isOpen && (
                <div className="p-4 bg-slate-50 border-t border-bricq-slate/10 overflow-x-auto">
                    <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export const TabDetails = ({ data }: { data: BuildingData | null }) => {
    if (!data) return <div className="p-8 text-center text-bricq-slate/50">Chargement des données brutes...</div>;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-8">

            {/* Nouveau composant de détails techniques */}
            <TabBatiment data={data.raw_bdnb} />

            <div className="bg-white p-8 rounded-2xl border border-bricq-slate/5 shadow-sm">
                <div className="mb-8">
                    <h2 className="font-serif text-2xl font-bold text-bricq-slate mb-2 flex items-center gap-2">
                        <Database className="text-bricq-terracotta" /> Données Brutes & API
                    </h2>
                    <p className="text-bricq-slate/60">
                        Accès complet aux données non traitées pour les experts (BDNB, Géorisques, IGN).
                    </p>
                </div>

                <div className="space-y-2">
                    {/* 1. BDNB */}
                    <JsonViewer
                        title="Base de Données Nationale des Bâtiments (BDNB)"
                        data={data.raw_bdnb}
                        icon={Layers}
                    />

                    {/* 2. Géorisques */}
                    <JsonViewer
                        title="Géorisques (Réponses API Complètes)"
                        data={data.risques_detailles?._raw}
                        icon={Activity}
                    />

                    {/* 3. Urbanisme */}
                    <JsonViewer
                        title="Urbanisme (IGN GPU - Réponses API)"
                        data={data.urbanisme?._raw}
                        icon={FileJson}
                    />
                </div>
            </div>
        </div>
    );
};
