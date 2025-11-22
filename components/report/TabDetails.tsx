"use client";
import React from 'react';
import { Database, FileJson } from 'lucide-react';

export const TabDetails = ({ data }: { data: any }) => {
  if (!data) return <div className="p-8 text-center">Aucune donnée brute.</div>;

  // 1. On transforme l'objet en liste [Clé, Valeur]
  // 2. On filtre les valeurs nulles ou inutiles
  const entries = Object.entries(data).filter(([key, value]) => {
      return value !== null && 
             value !== "" && 
             key !== "risques_detailles" && // On masque les objets complexes qu'on a déjà traités
             key !== "urbanisme" && 
             key !== "quartier" &&
             key !== "coords";
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="bg-white p-8 rounded-2xl border border-kadris-slate/5 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-kadris-slate/10">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Database size={24} />
                </div>
                <div>
                    <h2 className="font-serif text-2xl font-bold text-kadris-slate">Fiche Technique Complète</h2>
                    <p className="text-kadris-slate/60 text-sm">
                        Inventaire exhaustif des {entries.length} points de données disponibles pour ce bâtiment.
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-kadris-slate/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-kadris-slate text-white uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-3 w-1/3">Donnée (Clé API)</th>
                            <th className="px-6 py-3">Valeur Enregistrée</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-kadris-slate/10 bg-white">
                        {entries.map(([key, value], i) => (
                            <tr key={key} className={`hover:bg-kadris-cream/30 transition-colors ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                                <td className="px-6 py-3 font-mono text-kadris-slate/70 text-xs select-all cursor-text">
                                    {key}
                                </td>
                                <td className="px-6 py-3 font-medium text-kadris-slate break-all">
                                    {/* Si c'est un objet (ex: géométrie), on l'affiche en JSON string, sinon texte */}
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-xs text-gray-500">
                    <FileJson size={14}/> Source : Base de Données Nationale des Bâtiments (Open Data)
                </div>
            </div>
        </div>
    </div>
  );
};