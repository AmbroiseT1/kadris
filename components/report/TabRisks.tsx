"use client";
import React from 'react';
import { Mountain, Pickaxe, AlertTriangle, Shield, Droplets, CheckCircle, Flame, Factory, Skull } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';

export const TabRisks = ({ data }: { data: BuildingData | null }) => {
    if (!data?.risques_detailles) return <div className="p-8 text-center text-kadris-slate/50">Analyse environnementale en cours...</div>;
    
    const r = data.risques_detailles;
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
         
         {/* COLONNE 1 : RISQUES NATURELS & SOL */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Mountain size={18} className="text-kadris-terracotta"/> Géologie & Nature
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-kadris-cream/30 rounded-lg">
                     <span className="text-kadris-slate font-medium">Retrait-Gonflement Argiles</span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                         r.argiles === 'Fort' ? 'bg-red-100 text-red-800' : 
                         r.argiles === 'Moyen' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                     }`}>
                        {r.argiles.toUpperCase()}
                     </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-kadris-cream/30 rounded-lg">
                     <div className="flex items-center gap-2">
                         <Pickaxe size={16} className="text-kadris-slate/50"/>
                         <span className="text-kadris-slate font-medium">Cavités Souterraines</span>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.cavites?.count > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {r.cavites?.count > 0 ? `${r.cavites.count} DÉTECTÉE(S)` : "AUCUNE"}
                     </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-kadris-cream/30 rounded-lg">
                     <span className="text-kadris-slate font-medium">Mouvement Terrain</span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.mouvement_terrain ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {r.mouvement_terrain ? "OUI" : "NON"}
                     </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-kadris-cream/30 rounded-lg">
                     <span className="text-kadris-slate font-medium">Sismicité</span>
                     <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-bold">
                        ZONE {r.seisme}
                     </span>
                  </div>
                   <div className="flex justify-between items-center p-3 bg-kadris-cream/30 rounded-lg">
                     <span className="text-kadris-slate font-medium">Potentiel Radon</span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.radon === 'Elevé' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {r.radon.toUpperCase()}
                     </span>
                  </div>
               </div>
            </div>
  
            {/* Historique CatNat */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-kadris-slate flex items-center gap-2 uppercase tracking-wider text-sm">
                      <AlertTriangle size={18} className="text-orange-500"/> Sinistralité (CatNat)
                   </h3>
                   <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">{r.catnat.count} Arrêtés</span>
               </div>
               
               {r.catnat.count > 0 ? (
                   <div className="space-y-2">
                      {r.catnat.types.map((type, i) => (
                          <div key={i} className="text-sm text-kadris-slate/70 flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              {type}
                          </div>
                      ))}
                      {r.catnat.last_date && (
                          <div className="mt-4 pt-4 border-t border-kadris-slate/10 text-xs text-kadris-slate/50 italic">
                              Dernier événement : {new Date(r.catnat.last_date as string).toLocaleDateString()}
                          </div>
                      )}
                   </div>
               ) : (
                   <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">Aucun arrêté de catastrophe naturelle recensé.</p>
               )}
            </div>
         </div>
  
         {/* COLONNE 2 : RISQUES INDUSTRIELS & ENVIRONNEMENT */}
         <div className="space-y-6">
            
            {/* Inondation & Canalisations */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Shield size={18} className="text-blue-500"/> Risques Majeurs
               </h3>
               
               <div className="space-y-3">
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${r.inondation ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <div className={`mt-1 ${r.inondation ? 'text-red-600' : 'text-green-600'}`}>
                          {r.inondation ? <Droplets size={20} /> : <CheckCircle size={20} />}
                      </div>
                      <div>
                          <div className={`font-bold ${r.inondation ? 'text-red-800' : 'text-green-800'}`}>
                              {r.inondation ? "Zone Inondable" : "Hors Zone Inondable"}
                          </div>
                          <p className={`text-xs mt-1 ${r.inondation ? 'text-red-600' : 'text-green-600'}`}>
                              {r.inondation 
                                  ? "Le bien est situé dans le périmètre d'un Plan de Prévention des Risques Inondation (PPRI)." 
                                  : "Le bien n'est pas cartographié en zone inondable majeure."}
                          </p>
                      </div>
                  </div>
  
                  {r.canalisations && (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                          <Flame className="text-orange-600 flex-shrink-0" size={20} />
                          <div>
                             <div className="font-bold text-orange-800">Transport Matières Dangereuses</div>
                             <p className="text-orange-600 text-xs mt-1">Présence de canalisations de transport de matières dangereuses dans la commune.</p>
                          </div>
                      </div>
                  )}
                  {r.feu_foret && (
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                          <Flame className="text-orange-600 flex-shrink-0" size={20} />
                          <div>
                             <div className="font-bold text-orange-800">Feu de Forêt</div>
                             <p className="text-orange-600 text-xs mt-1">Zone exposée au risque feu de forêt.</p>
                          </div>
                      </div>
                  )}
               </div>
            </div>
  
            {/* Carte Industriel (Usines) */}
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-bold text-kadris-slate mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Factory size={18} className="text-gray-600"/> Industrie & Pollution
               </h3>
               
               {/* Pollutions BASOL */}
               {r.pollutions && r.pollutions.length > 0 && (
                  <div className="mb-4">
                      <div className="text-xs font-bold text-kadris-slate/50 mb-2 flex items-center gap-1">
                          <Skull size={12}/> SITES POLLUÉS (BASOL)
                      </div>
                      <ul className="space-y-2">
                         {r.pollutions.map((pol, i) => (
                            <li key={i} className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                               <div className="font-bold text-gray-800">{pol.nom}</div>
                               <div className="text-xs text-gray-500">{pol.etat}</div>
                            </li>
                         ))}
                      </ul>
                  </div>
               )}

               {/* Usines */}
               {r.installations.length > 0 ? (
                   <ul className="space-y-3">
                      {r.installations.map((usine, i) => (
                          <li key={i} className="flex justify-between items-center text-sm pb-2 border-b border-kadris-slate/5 last:border-0">
                              <span className="font-medium text-kadris-slate truncate max-w-[60%]">{usine.nom}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  usine.statut.includes('Seveso') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                  {usine.statut}
                              </span>
                          </li>
                      ))}
                   </ul>
               ) : (
                   <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                       <CheckCircle size={16}/>
                       Pas d'industrie lourde à proximité immédiate (1km).
                   </div>
               )}
            </div>
  
         </div>
      </div>
    );
};