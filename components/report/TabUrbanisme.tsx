"use client";
import React from 'react';
import { Scroll, Landmark, Building2, FileDown, Download, Info, CheckCircle, AlertTriangle, Map, Ban, Car, Ruler, Trees, Droplets, ExternalLink } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { UrbanismeData, PrescriptionItem } from '@/app/lib/urbanisme';

// --- SOUS-COMPOSANT : BOUTON DOCUMENT ---
const DocLinkButton = ({ url, label = "Voir le document" }: { url?: string | null, label?: string }) => {
   if (!url) return null;
   return (
      <a
         href={url}
         target="_blank"
         rel="noopener noreferrer"
         className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 hover:text-blue-800 hover:underline mt-2"
         onClick={(e) => e.stopPropagation()}
      >
         <ExternalLink size={10} /> {label}
      </a>
   );
};

// --- SOUS-COMPOSANT : CARTE DE PRESCRIPTION ---
const PrescriptionCard = ({ item }: { item: PrescriptionItem }) => {
   // Icône dynamique selon le type
   let Icon = Building2;
   let color = "blue";

   if (item.type === "05") { Icon = Ban; color = "red"; } // Réservé
   else if (item.type === "01" || item.type === "07") { Icon = Trees; color = "green"; } // Espace Boisé
   else if (item.type === "44") { Icon = Car; color = "gray"; } // Parking
   else if (item.type === "39") { Icon = Ruler; color = "orange"; } // Hauteur

   return (
      <div className={`p-4 rounded-xl border border-${color}-100 bg-${color}-50/30 group hover:bg-${color}-50 transition-colors`}>
         <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               <div className={`p-1.5 rounded-lg bg-white text-${color}-600 shadow-sm`}>
                  <Icon size={16} />
               </div>
               <span className={`text-sm font-bold text-${color}-800`}>{item.titre}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Code {item.type}</span>
         </div>

         <div className="text-sm text-slate-700 font-medium mb-2 pl-9">
            {item.libelle}
         </div>

         <div className="pl-9">
            <div className="flex gap-2 mb-1">
               <Info size={14} className={`text-${color}-400 flex-shrink-0 mt-0.5`} />
               <p className={`text-xs text-${color}-600 italic`}>
                  {item.description}
               </p>
            </div>
            <DocLinkButton url={item.url_doc} label="Consulter la règle" />
         </div>
      </div>
   );
};

// --- COMPOSANT PRINCIPAL ---

export const TabUrbanisme = ({ data }: { data: BuildingData | null }) => {
   if (!data?.urbanisme) return <div className="p-8 text-center text-kadris-slate/50">Chargement des règles d'urbanisme...</div>;

   const u = data.urbanisme as UrbanismeData;
   const zone = u.zonage;
   const doc = u.document;
   const contraintes = u.contraintes || [];

   return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">

         {/* 1. HEADER : ZONAGE ET DOCUMENT */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Zone PLU */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4 flex items-center gap-2">
                  <Scroll size={24} className="text-kadris-terracotta" /> Zonage Réglementaire
               </h3>

               {zone ? (
                  <div className="space-y-4">
                     <div className="flex items-start gap-4 p-4 bg-kadris-cream/50 rounded-xl border border-kadris-slate/10">
                        <div className={`text-3xl font-black px-4 py-3 rounded-lg shadow-sm bg-white border-2 ${zone.is_constructible ? 'text-blue-600 border-blue-100' : 'text-red-600 border-red-100'}`}>
                           {zone.code}
                        </div>
                        <div className="flex-1">
                           <div className="font-bold text-kadris-slate text-lg leading-tight">{zone.libelle}</div>
                           <div className="flex items-center gap-2 mt-2">
                              {zone.is_constructible ? (
                                 <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Constructible</span>
                              ) : (
                                 <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban size={10} /> Restreint</span>
                              )}
                              <span className="text-xs text-kadris-slate/50 border-l border-kadris-slate/20 pl-2">Type : {zone.type}</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-900 leading-relaxed">
                        <strong className="block mb-1 text-blue-700 flex items-center gap-1"><Info size={14} /> L'avis de l'expert :</strong>
                        {zone.conseil}
                     </div>
                  </div>
               ) : (
                  <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded">Zone non identifiée numériquement. Contactez la mairie.</p>
               )}
            </div>

            {/* Document Officiel */}
            <div className="bg-kadris-slate text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
               <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                     <FileDown size={20} /> Document Officiel
                  </h4>
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                     {doc?.nom || "Document d'urbanisme"}
                  </p>
                  <div className="text-xs bg-white/10 inline-block px-2 py-1 rounded mb-4 border border-white/20">
                     {doc?.etat || "État Inconnu"}
                  </div>
               </div>

               {/* LOGIQUE DE TÉLÉCHARGEMENT : Priorité au lien de zone spécifique */}
               {zone?.url_doc ? (
                  <a
                     href={zone.url_doc}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center justify-center gap-2 w-full bg-kadris-terracotta hover:bg-[#A04530] text-white font-medium py-3 rounded-lg transition-colors text-sm shadow-lg"
                  >
                     <Download size={16} className="group-hover:scale-110 transition-transform" />
                     Télécharger le Règlement ({zone.code})
                  </a>
               ) : zone?.filename_doc ? (
                  <div className="text-center">
                     <div className="text-xs text-white/70 mb-2 font-mono bg-white/10 px-2 py-1 rounded inline-block max-w-full truncate">
                        {zone.filename_doc}
                     </div>
                     <a
                        href="https://www.geoportail-urbanisme.gouv.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors text-sm"
                     >
                        <ExternalLink size={16} />
                        Consulter sur le Géoportail
                     </a>
                  </div>
               ) : doc?.url_reglement ? (
                  <a
                     href={doc.url_reglement}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center justify-center gap-2 w-full bg-kadris-terracotta hover:bg-[#A04530] text-white font-medium py-3 rounded-lg transition-colors text-sm shadow-lg"
                  >
                     <Download size={16} className="group-hover:scale-110 transition-transform" />
                     Consulter le Dossier Complet
                  </a>
               ) : (
                  <div className="text-center">
                     <button disabled className="w-full bg-white/10 text-white/50 font-medium py-3 rounded-lg text-sm cursor-not-allowed mb-2">
                        Numérisation indisponible
                     </button>
                     <a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" className="text-xs text-white/60 hover:text-white underline">
                        Chercher sur le Géoportail
                     </a>
                  </div>
               )}
            </div>
         </div>

         {/* 2. CONTRAINTES & PRESCRIPTIONS (Nouveau Design) */}
         <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-kadris-slate mb-6 flex items-center gap-2">
               <Building2 size={24} className="text-blue-600" /> Règles & Prescriptions Locales
            </h3>

            {contraintes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contraintes.map((item, i) => (
                     <PrescriptionCard key={i} item={item} />
                  ))}
               </div>
            ) : (
               <p className="text-sm text-gray-400 italic text-center py-4">Aucune prescription spécifique (type OAP, Espace Boisé) détectée sur cette parcelle.</p>
            )}
         </div>

         {/* 3. SERVITUDES (SUP) */}
         <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-kadris-slate mb-6 flex items-center gap-2">
               <Landmark size={24} className="text-gray-600" /> Servitudes d'Utilité Publique (SUP)
            </h3>
            {u.servitudes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {u.servitudes.map((sup, i) => (
                     <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-gray-800 text-sm">{sup.libelle}</span>
                           <span className="text-[10px] font-mono bg-white text-gray-500 px-2 py-1 rounded border">{sup.code}</span>
                        </div>
                        <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2 mb-2">
                           {sup.description}
                        </p>
                        <div className="pl-2">
                           <DocLinkButton url={sup.url_doc} label="Voir le texte officiel" />
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-gray-400 italic text-center py-4">Aucune servitude majeure (Monument historique, Pipeline...) détectée.</p>
            )}
         </div>

         {/* 4. RÉSEAUX & SANTÉ PUBLIQUE (NOUVEAU) */}
         {data.eau_potable && (
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-serif text-xl font-bold text-kadris-slate mb-4 flex items-center gap-2">
                  <Droplets size={24} className="text-blue-500" /> Qualité de l'Eau Potable
               </h3>

               <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start mb-6 ${data.eau_potable.conformite ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>

                  {/* Indicateur Visuel */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                     <div className={`p-3 rounded-full ${data.eau_potable.conformite ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        <Droplets size={24} />
                     </div>
                     <div>
                        <div className="text-xs font-bold uppercase text-slate-500">État Sanitaire</div>
                        <div className={`font-black text-lg ${data.eau_potable.conformite ? 'text-blue-900' : 'text-red-900'}`}>
                           {data.eau_potable.conformite ? "EAU CONFORME" : "NON CONFORME"}
                        </div>
                     </div>
                  </div>

                  {/* Détail Conclusion */}
                  <div className="flex-1 pt-1">
                     <p className="text-sm font-medium text-slate-800 mb-2">
                        "{data.eau_potable.conclusion}"
                     </p>
                     <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><CheckCircle size={12} /> Réseau : {data.eau_potable.reseau}</span>
                        <span>Prélèvement du : {new Date(data.eau_potable.date_prelevement).toLocaleDateString('fr-FR')}</span>
                     </div>
                  </div>
               </div>

               {/* GRILLE DES PARAMÈTRES CLÉS */}
               {data.eau_potable.parametres_cles.length > 0 && (
                  <div>
                     <h4 className="font-bold text-sm text-kadris-slate mb-3 uppercase tracking-wider opacity-70">Analyses Physico-Chimiques</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {data.eau_potable.parametres_cles.map((param, idx) => (
                           <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
                              <div className="text-xs text-slate-400 font-bold uppercase mb-1">{param.nom}</div>
                              <div className={`font-black text-lg ${param.code_couleur === 'red' ? 'text-red-600' : param.code_couleur === 'green' ? 'text-green-600' : 'text-slate-700'}`}>
                                 {typeof param.valeur === 'number' ? param.valeur.toLocaleString('fr-FR') : param.valeur}
                                 <span className="text-xs font-normal text-slate-400 ml-1">{param.unite}</span>
                              </div>
                              {param.limite && (
                                 <div className="text-[10px] text-slate-400 mt-1 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                    Norme : {param.limite}
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* 5. CONNECTIVITÉ NUMÉRIQUE (NOUVEAU) */}
         {data.connectivite && (
            <div className="bg-white p-6 rounded-2xl border border-kadris-slate/5 shadow-sm">
               <h3 className="font-serif text-xl font-bold text-kadris-slate mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
                  Connectivité & Réseaux Numériques
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Score Global */}
                  <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-purple-100">
                     <div className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-2">Score Connectivité</div>
                     <div className="text-5xl font-black text-purple-600 mb-2">{data.connectivite.score_connectivite}<span className="text-2xl text-purple-300">/100</span></div>
                     <div className="text-xs text-purple-500 font-medium px-3 py-1 bg-white rounded-full border border-purple-100">
                        {data.connectivite.score_connectivite >= 80 ? "Excellente" : data.connectivite.score_connectivite >= 50 ? "Bonne" : "Moyenne"}
                     </div>
                  </div>

                  {/* Internet Fixe (Fibre) */}
                  <div className="md:col-span-2 space-y-4">
                     {/* Carte Fibre */}
                     <div className={`p-4 rounded-xl border flex items-start gap-4 ${data.connectivite.fixe.fibre ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                        <div className={`p-2 rounded-lg ${data.connectivite.fixe.fibre ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
                        </div>
                        <div>
                           <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                              Internet Fixe : {data.connectivite.fixe.techno_principale}
                              {data.connectivite.fixe.fibre && <CheckCircle size={16} className="text-green-600" />}
                           </div>
                           <div className="text-sm text-slate-600 mt-1">
                              Débit théorique max : <span className="font-bold">{data.connectivite.fixe.max_debit}</span>
                           </div>
                           <div className="flex flex-wrap gap-2 mt-3">
                              {data.connectivite.fixe.operateurs.map((op, i) => (
                                 <span key={i} className="text-[10px] font-bold uppercase bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded">
                                    {op}
                                 </span>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Carte Mobile (5G) */}
                     <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                           </div>
                           <div>
                              <div className="font-bold text-slate-800">Réseau Mobile</div>
                              <div className="text-xs text-slate-500">Couverture : {data.connectivite.mobile.couverture}</div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${data.connectivite.mobile.g5 ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              5G
                           </div>
                           <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${data.connectivite.mobile.g4 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              4G+
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};