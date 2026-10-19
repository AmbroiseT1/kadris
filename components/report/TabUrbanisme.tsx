"use client";
import React from 'react';
import { Scroll, Landmark, Building2, FileDown, Download, Info, CheckCircle, Ban, Car, Ruler, Trees, Droplets, ExternalLink } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { UrbanismeData, PrescriptionItem } from '@/app/lib/urbanisme';
import { ConnectivityData } from '@/app/lib/arcep';
import { formatDateFr, SourceInfo } from '@/app/lib/sources';
import { SourceBadge, UnavailableBlock } from './SourceBadge';

// --- SOUS-COMPOSANT : BOUTON DOCUMENT ---
const DocLinkButton = ({ url, label = "Voir le document" }: { url?: string | null, label?: string }) => {
   if (!url) return null;
   return (
      <a
         href={url}
         target="_blank"
         rel="noopener noreferrer"
         className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-encre hover:text-encre hover:underline mt-2"
         onClick={(e) => e.stopPropagation()}
      >
         <ExternalLink size={10} /> {label}
      </a>
   );
};

// --- SOUS-COMPOSANT : CARTE DE PRESCRIPTION ---
const PrescriptionCard = ({ item }: { item: PrescriptionItem }) => {
   let Icon = Building2;
   let iconBg = "bg-encre-soft";
   let iconText = "text-encre";
   let iconBorder = "border-encre/20";
   let titleText = "text-encre";
   let infoText = "text-encre";
   let descText = "text-encre";

   if (item.type === "05") {
      Icon = Ban;
      iconBg = "bg-alerte-soft";
      iconText = "text-alerte";
      iconBorder = "border-alerte/30";
      titleText = "text-alerte";
      infoText = "text-alerte-soft";
      descText = "text-alerte";
   }
   else if (item.type === "01" || item.type === "07") {
      Icon = Trees;
      iconBg = "bg-ok-soft";
      iconText = "text-ok";
      iconBorder = "border-ok/30";
      titleText = "text-ok";
      infoText = "text-ok-soft";
      descText = "text-ok";
   }
   else if (item.type === "44") {
      Icon = Car;
      iconBg = "bg-papier";
      iconText = "text-texte-2";
      iconBorder = "border-trait";
      titleText = "text-texte";
      infoText = "text-texte-2";
      descText = "text-texte-2";
   }
   else if (item.type === "39") {
      Icon = Ruler;
      iconBg = "bg-vigil-soft";
      iconText = "text-vigil";
      iconBorder = "border-vigil/30";
      titleText = "text-vigil";
      infoText = "text-vigil";
      descText = "text-vigil";
   }

   return (
      <div className="p-4 rounded-sm border border-trait bg-white group hover:bg-papier transition-colors">
         <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
               <div className={`p-1.5 rounded-sm ${iconBg} ${iconText} border ${iconBorder}`}>
                  <Icon size={14} />
               </div>
               <span className={`text-sm font-bold ${titleText}`}>{item.titre}</span>
            </div>
            <span className="text-xs font-mono text-texte-2 bg-papier px-1.5 py-0.5 rounded-sm border border-trait">Code {item.type}</span>
         </div>

         <div className="text-sm text-texte font-medium mb-2 pl-9">
            {item.libelle}
         </div>

         <div className="pl-9">
            <div className="flex gap-2 mb-1">
               <Info size={12} className={`${infoText} flex-shrink-0 mt-0.5`} />
               <p className={`text-xs ${descText} italic`}>
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
   if (!data) return <div className="p-8 text-center text-texte-2">Chargement des règles d’urbanisme...</div>;

   const sources = data.sources || {};
   const u: UrbanismeData | undefined = data.urbanisme;
   const zone = u?.zonage;
   const doc = u?.document;
   const contraintes = u?.contraintes || [];

   return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
         {!u ? (
            sources.urbanisme?.status === 'error'
               ? <UnavailableBlock title="Urbanisme (PLU, servitudes)" source={sources.urbanisme} />
               : <div className="p-8 text-center text-texte-2">Chargement des règles d’urbanisme...</div>
         ) : (<>

         {/* 1. HEADER : ZONAGE ET DOCUMENT */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Zone PLU */}
            <div className="lg:col-span-2 bg-white border border-trait rounded-sm p-5">
               <h3 className="font-serif text-lg font-bold text-texte mb-4 border-b border-trait pb-2 flex items-center gap-2">
                  <Scroll size={20} className="text-brique" /> Zonage Réglementaire
               </h3>

               {zone ? (
                  <div className="space-y-4">
                     <div className="flex items-start gap-4 p-4 bg-papier rounded-sm border border-trait">
                        <div className={`text-3xl font-black px-4 py-3 rounded-sm border-2 ${zone.is_constructible ? 'text-encre border-encre/20 bg-encre-soft' : 'text-alerte border-alerte/30 bg-alerte-soft'}`}>
                           {zone.code}
                        </div>
                        <div className="flex-1">
                           <div className="font-bold text-texte text-lg leading-tight">{zone.libelle}</div>
                           <div className="flex items-center gap-2 mt-2">
                              {zone.is_constructible ? (
                                 <span className="text-xs font-bold bg-encre-soft text-encre px-2 py-0.5 rounded-sm flex items-center gap-1 border border-encre/20"><CheckCircle size={10} /> Constructible</span>
                              ) : (
                                 <span className="text-xs font-bold bg-alerte-soft text-alerte px-2 py-0.5 rounded-sm flex items-center gap-1 border border-alerte/30"><Ban size={10} /> Restreint</span>
                              )}
                              <span className="text-xs text-texte-2 border-l border-trait pl-2 font-mono">Type : {zone.type}</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-3 bg-encre-soft rounded-sm border border-encre/20 text-sm text-encre leading-relaxed">
                        <strong className="block mb-1 text-encre flex items-center gap-1 font-serif"><Info size={14} /> L’avis de l’expert :</strong>
                        {zone.conseil}
                     </div>
                  </div>
               ) : (
                  <p className="text-sm text-vigil bg-vigil-soft p-3 rounded-sm border border-vigil/30">Zone non identifiée numériquement. Contactez la mairie.</p>
               )}
            </div>

            {/* Document Officiel */}
            <div className="bg-encre text-white p-6 rounded-sm border border-texte flex flex-col justify-between">
               <div>
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2 font-serif">
                     <FileDown size={18} /> Document Officiel
                  </h4>
                  <p className="text-white/70 text-sm mb-4 line-clamp-2 font-light">
                     {doc?.nom || "Document d'urbanisme"}
                  </p>
                  <div className="text-xs bg-white/10 inline-block px-2 py-1 rounded-sm mb-4 border border-white/20 font-mono">
                     {doc?.etat || "État Inconnu"}
                  </div>
               </div>

               {zone?.url_doc ? (
                  <a
                     href={zone.url_doc}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center justify-center gap-2 w-full bg-brique hover:bg-[#A04530] text-white font-medium py-3 rounded-sm transition-colors text-sm"
                  >
                     <Download size={16} className="group-hover:scale-110 transition-transform" />
                     Télécharger le Règlement ({zone.code})
                  </a>
               ) : zone?.filename_doc ? (
                  <div className="text-center">
                     <div className="text-xs text-white/70 mb-2 font-mono bg-white/10 px-2 py-1 rounded-sm inline-block max-w-full truncate border border-white/20">
                        {zone.filename_doc}
                     </div>
                     <a
                        href="https://www.geoportail-urbanisme.gouv.fr/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-sm transition-colors text-sm"
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
                     className="group flex items-center justify-center gap-2 w-full bg-brique hover:bg-[#A04530] text-white font-medium py-3 rounded-sm transition-colors text-sm"
                  >
                     <Download size={16} className="group-hover:scale-110 transition-transform" />
                     Consulter le Dossier Complet
                  </a>
               ) : (
                  <div className="text-center">
                     <button disabled className="w-full bg-white/10 text-white/50 font-medium py-3 rounded-sm text-sm cursor-not-allowed mb-2 border border-white/10">
                        Numérisation indisponible
                     </button>
                     <a href="https://www.geoportail-urbanisme.gouv.fr/" target="_blank" className="text-xs text-white/60 hover:text-white underline">
                        Chercher sur le Géoportail
                     </a>
                  </div>
               )}
            </div>
         </div>

         {/* 2. CONTRAINTES & PRESCRIPTIONS */}
         <div className="bg-white border border-trait rounded-sm p-5">
            <h3 className="font-serif text-lg font-bold text-texte mb-6 border-b border-trait pb-2 flex items-center gap-2">
               <Building2 size={20} className="text-encre" /> Règles & Prescriptions Locales
            </h3>

            {contraintes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contraintes.map((item, i) => (
                     <PrescriptionCard key={i} item={item} />
                  ))}
               </div>
            ) : (
               <p className="text-sm text-texte-2 italic text-center py-4">{u.indisponibles?.includes('prescriptions') ? 'Prescriptions : données indisponibles (Géoportail de l’Urbanisme).' : 'Aucune prescription spécifique (type OAP, Espace Boisé) détectée sur cette parcelle.'}</p>
            )}
         </div>

         {/* 3. SERVITUDES (SUP) */}
         <div className="bg-white border border-trait rounded-sm p-5">
            <h3 className="font-serif text-lg font-bold text-texte mb-6 border-b border-trait pb-2 flex items-center gap-2">
               <Landmark size={20} className="text-texte-2" /> Servitudes d’Utilité Publique (SUP)
            </h3>
            {u.servitudes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {u.servitudes.map((sup, i) => (
                     <div key={i} className="p-4 bg-papier rounded-sm border border-trait hover:bg-papier transition-colors">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-texte text-sm">{sup.libelle}</span>
                           <span className="text-xs font-mono bg-white text-texte-2 px-2 py-1 rounded-sm border border-trait">{sup.code}</span>
                        </div>
                        <p className="text-xs text-texte-2 italic border-l-2 border-trait-fort pl-2 mb-2">
                           {sup.description}
                        </p>
                        <div className="pl-2">
                           <DocLinkButton url={sup.url_doc} label="Voir le texte officiel" />
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-texte-2 italic text-center py-4">{u.indisponibles?.includes('servitudes') ? 'Servitudes : données indisponibles (Géoportail de l’Urbanisme).' : 'Aucune servitude majeure (Monument historique, Pipeline...) détectée.'}</p>
            )}
            <SourceBadge source={sources.urbanisme} className="mt-4" />
         </div>
         </>)}

         {/* 4. RÉSEAUX & SANTÉ PUBLIQUE */}
         {data.eau_potable ? (
            <div className="bg-white border border-trait rounded-sm p-5">
               <h3 className="font-serif text-lg font-bold text-texte mb-4 border-b border-trait pb-2 flex items-center gap-2">
                  <Droplets size={20} className="text-encre" /> Qualité de l’Eau Potable
               </h3>

               <div className={`p-4 rounded-sm border flex flex-col md:flex-row gap-4 items-start mb-6 ${data.eau_potable.conformite ? 'bg-encre-soft border-encre/20' : 'bg-alerte-soft border-alerte/30'}`}>

                  <div className="flex items-center gap-3 min-w-[200px]">
                     <div className={`p-3 rounded-sm ${data.eau_potable.conformite ? 'bg-encre-soft text-encre' : 'bg-alerte-soft text-alerte'}`}>
                        <Droplets size={24} />
                     </div>
                     <div>
                        <div className="text-xs font-bold uppercase text-texte-2 font-mono">État Sanitaire</div>
                        <div className={`font-black text-lg ${data.eau_potable.conformite ? 'text-encre' : 'text-alerte'}`}>
                           {data.eau_potable.conformite ? "EAU CONFORME" : "NON CONFORME"}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 pt-1">
                     <p className="text-sm font-medium text-texte mb-2">
                        &laquo; {data.eau_potable.conclusion} &raquo;
                     </p>
                     <div className="flex flex-wrap items-center gap-4 text-xs text-texte-2 font-mono">
                        <span className="flex items-center gap-1"><CheckCircle size={12} /> Réseau : {data.eau_potable.reseau}</span>
                        <span>Prélèvement du : {formatDateFr(data.eau_potable.date_prelevement)}</span>
                     </div>
                  </div>
               </div>

               {data.eau_potable.parametres_cles.length > 0 && (
                  <div>
                     <h4 className="font-bold text-sm text-texte mb-3 uppercase tracking-wider opacity-70">Dernières analyses (contrôle sanitaire)</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {data.eau_potable.parametres_cles.map((param) => (
                           <div key={param.id} className="p-3 rounded-sm border border-trait bg-papier flex flex-col items-center text-center">
                              <div className="text-xs text-texte-2 font-bold uppercase mb-1 font-mono">{param.nom}</div>
                              <div className={`font-black text-lg ${param.code_couleur === 'red' ? 'text-alerte' : param.code_couleur === 'green' ? 'text-ok' : 'text-texte'}`}>
                                 {typeof param.valeur === 'number' ? param.valeur.toLocaleString('fr-FR') : param.valeur}
                                 <span className="text-xs font-normal text-texte-2 ml-1">{param.unite}</span>
                              </div>
                              {param.limite && (
                                 <div className="text-xs text-texte-2 mt-1 bg-white px-1.5 py-0.5 rounded-sm border border-trait font-mono">
                                    Norme : {param.limite}
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               )}
               <SourceBadge source={sources.eau} className="mt-4" />
            </div>
         ) : sources.eau && sources.eau.status !== 'loading' ? (
            <UnavailableBlock title="Qualité de l'eau potable" source={sources.eau} />
         ) : null}

         {/* 5. CONNECTIVITÉ NUMÉRIQUE */}
         {data.connectivite ? (
            <ConnectivityBlock c={data.connectivite} source={sources.connectivite} />
         ) : sources.connectivite && sources.connectivite.status !== 'loading' ? (
            <UnavailableBlock title="Connectivité (fibre, mobile)" source={sources.connectivite} />
         ) : null}
      </div>
   );
};

const Unverified = ({ label }: { label: string }) => (
   <div className="p-4 rounded-sm border border-trait bg-papier text-sm text-texte-2">
      <span className="font-bold text-texte">{label}</span> : données indisponibles (non vérifié).
   </div>
);

const ConnectivityBlock = ({ c, source }: { c: ConnectivityData; source?: SourceInfo }) => (
   <div className="bg-white border border-trait rounded-sm p-5">
      <h3 className="font-serif text-lg font-bold text-texte mb-6 border-b border-trait pb-2 flex items-center gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-encre" aria-hidden><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
         Connectivité & Réseaux Numériques
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

         <div className="bg-encre-soft rounded-sm p-6 flex flex-col items-center justify-center text-center border border-encre/20">
            <div className="text-sm font-bold text-encre uppercase tracking-wide mb-2 font-mono">Score Connectivité</div>
            {c.score_connectivite !== null ? (
               <>
                  <div className="text-5xl font-black text-encre mb-2">{c.score_connectivite}<span className="text-2xl text-encre">/100</span></div>
                  <div className="text-xs text-encre font-medium px-3 py-1 bg-white rounded-sm border border-encre/20">
                     {c.score_connectivite >= 80 ? "Excellente" : c.score_connectivite >= 50 ? "Bonne" : "Moyenne"}
                  </div>
               </>
            ) : (
               <div className="text-sm text-encre font-medium">Non évalué (données partielles)</div>
            )}
         </div>

         <div className="md:col-span-2 space-y-4">
            {c.fixe ? (
               <div className={`p-4 rounded-sm border flex items-start gap-4 ${c.fixe.fibre ? 'bg-ok-soft border-ok/30' : 'bg-vigil-soft border-vigil/30'}`}>
                  <div className={`p-2 rounded-sm ${c.fixe.fibre ? 'bg-ok-soft text-ok' : 'bg-vigil-soft text-vigil'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
                  </div>
                  <div>
                     <div className="font-bold text-texte text-lg flex items-center gap-2">
                        Internet Fixe : {c.fixe.techno_principale}
                        {c.fixe.fibre && <CheckCircle size={16} className="text-ok" />}
                     </div>
                     <div className="text-sm text-texte-2 mt-1">
                        Débit théorique max : <span className="font-bold">{c.fixe.max_debit}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-3">
                        {c.fixe.operateurs.map((op, i) => (
                           <span key={i} className="text-xs font-bold uppercase bg-white border border-trait text-texte-2 px-2 py-1 rounded-sm font-mono">
                              {op}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            ) : <Unverified label="Internet fixe" />}

            {c.mobile ? (
               <div className="p-4 rounded-sm border border-trait bg-papier flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white rounded-sm border border-trait text-texte-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                     </div>
                     <div>
                        <div className="font-bold text-texte">Réseau Mobile</div>
                        <div className="text-xs text-texte-2">Couverture : {c.mobile.couverture}</div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <div className={`px-3 py-1 rounded-sm text-xs font-bold border ${c.mobile.g5 ? 'bg-encre-soft text-encre border-encre/20' : 'bg-papier text-texte-2 border-trait'}`}>
                        5G
                     </div>
                     <div className={`px-3 py-1 rounded-sm text-xs font-bold border ${c.mobile.g4 ? 'bg-encre-soft text-encre border-encre/20' : 'bg-papier text-texte-2 border-trait'}`}>
                        4G+
                     </div>
                  </div>
               </div>
            ) : <Unverified label="Réseau mobile" />}
         </div>
      </div>
      <SourceBadge source={source} className="mt-4" />
   </div>
);
