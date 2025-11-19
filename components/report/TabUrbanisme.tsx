"use client";
import React from 'react';
// 👇 J'ai ajouté 'Download' dans la liste des imports ici
import { Scroll, Landmark, Building2, FileDown, Download, Info } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';

export const TabUrbanisme = ({ data }: { data: BuildingData | null }) => {
    if (!data?.urbanisme) return <div className="p-8 text-center text-kadris-slate/50">Chargement des règles d'urbanisme...</div>;
    
    const u = data.urbanisme;
    const zone = u.zonage;
    const doc = u.document;

    return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
         
         {/* SECTION PRINCIPALE : ZONAGE & DOCUMENT */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Carte de Gauche : Le Zonage */}
             <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4 flex items-center gap-2">
                   <Scroll size={24} className="text-kadris-terracotta"/> Réglementation (PLU)
                </h3>
                
                {zone ? (
                    <div>
                        <div className="flex items-start gap-4 p-4 bg-kadris-cream/50 rounded-xl border border-kadris-slate/10 mb-4">
                           <div className="bg-kadris-slate text-white font-bold text-3xl px-4 py-3 rounded-lg shadow-sm">
                              {zone.code}
                           </div>
                           <div>
                              <div className="font-bold text-kadris-slate text-lg">{zone.libelle}</div>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${zone.is_constructible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                     {zone.is_constructible ? "Constructible" : "Inconstructible / Restreint"}
                                 </span>
                                 <span className="text-xs text-kadris-slate/50">Type : {zone.type}</span>
                              </div>
                           </div>
                        </div>
                        
                        {/* LE CONSEIL INTELLIGENT */}
                        <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18}/>
                            <p className="text-sm text-blue-900 leading-relaxed">
                                <strong>Analyse Kadris :</strong> {zone.conseil}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded">Zone non identifiée numériquement.</p>
                )}
             </div>

             {/* Carte de Droite : Téléchargement */}
             <div className="bg-kadris-slate text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                 <div>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <FileDown size={20}/> Document Officiel
                    </h4>
                    <p className="text-white/70 text-sm mb-4">
                        {doc?.nom || "Document d'urbanisme local"}
                    </p>
                    <div className="text-xs bg-white/10 inline-block px-2 py-1 rounded mb-4">
                        État : {doc?.etat || "En vigueur"}
                    </div>
                 </div>

                 {doc?.url_reglement ? (
                     <a 
                        href={doc.url_reglement} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-kadris-terracotta hover:bg-[#A04530] text-white font-medium py-3 rounded-lg transition-colors text-sm"
                     >
                        <Download size={16}/> 
                        {doc.url_reglement.endsWith('.pdf') ? "Télécharger le PDF" : "Voir le Dossier"}
                     </a>
                 ) : (
                     <div className="text-center">
                        <button disabled className="w-full bg-white/10 text-white/50 font-medium py-3 rounded-lg text-sm cursor-not-allowed mb-2">
                            PDF non numérisé
                        </button>
                        <a 
                           href="https://www.geoportail-urbanisme.gouv.fr/" 
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-xs text-white/60 hover:text-white underline"
                        >
                           Chercher manuellement
                        </a>
                     </div>
                 )}
             </div>
         </div>

         {/* SECTION SECONDAIRE : CONTRAINTES */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Servitudes */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2">
                  <Landmark size={20} className="text-gray-600"/> Servitudes (SUP)
               </h3>
               {u.servitudes.length > 0 ? (
                  <ul className="space-y-2">
                     {u.servitudes.map((sup, i) => (
                        <li key={i} className="text-sm p-3 bg-gray-50 rounded border border-gray-100 group hover:bg-gray-100 transition-colors">
                           <div className="flex justify-between items-center mb-1">
                               <span className="font-bold text-gray-800">{sup.code}</span>
                               <span className="text-[10px] text-gray-500 bg-white px-1 rounded border border-gray-200">Officiel</span>
                           </div>
                           <div className="text-gray-700 font-medium">{sup.description}</div>
                           <div className="text-xs text-gray-500 mt-1 italic">{sup.libelle}</div>
                        </li>
                     ))}
                  </ul>
               ) : <p className="text-sm text-gray-400 italic">Aucune servitude d'utilité publique majeure détectée sur la parcelle.</p>}
            </div>

            {/* Prescriptions */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-600"/> Prescriptions Locales
               </h3>
               {u.prescriptions.length > 0 ? (
                  <ul className="space-y-2">
                     {u.prescriptions.map((pres, i) => (
                        <li key={i} className="text-sm p-3 bg-blue-50 rounded border border-blue-100 text-blue-900 flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                           <div>
                               <div className="font-medium">{pres.libelle}</div>
                               <div className="text-xs text-blue-400 mt-0.5 uppercase">{pres.type}</div>
                           </div>
                        </li>
                     ))}
                  </ul>
               ) : <p className="text-sm text-gray-400 italic">Aucune prescription spécifique (Espace boisé, emplacement réservé...).</p>}
            </div>
         </div>
      </div>
    );
};