"use client";

import React from 'react';
import { FileText, Download, Shield, ExternalLink, Info } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';

export const TabRisks = ({ data }: { data: BuildingData | null }) => {
   // Sécurité : Vérification des données
   if (!data?.risques_detailles) {
      return (
         <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <Shield className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Les coordonnées du bien sont nécessaires pour générer l'État des Risques.</p>
         </div>
      );
   }

   const { pdf_url } = data.risques_detailles as any;

   return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

         {/* 1. HEADER & ACTION */}
         <div className="bg-white p-8 rounded-2xl border border-kadris-slate/5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                     <Shield size={24} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-kadris-slate">
                     État des Risques et Pollutions (ERP)
                  </h3>
               </div>
               <p className="text-slate-600 max-w-2xl leading-relaxed">
                  Ce document officiel est généré en temps réel par le Ministère de la Transition Écologique.
                  Il recense les aléas naturels (inondation, argiles, sismicité), technologiques et miniers obligatoires pour la vente.
               </p>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
               <a
                  href={pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 bg-kadris-slate hover:bg-kadris-terracotta text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
               >
                  <Download size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Télécharger le PDF Officiel</span>
               </a>
               <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Info size={12} />
                  <span>Source certifiée : Géorisques.gouv.fr</span>
               </div>
            </div>

         </div>

         {/* 2. VISUALISATION (IFRAME) */}
         <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner h-[800px] relative group">

            {/* Overlay de chargement / Message si pas de support */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-0">
               <p className="text-slate-400 flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Chargement de la prévisualisation...
               </p>
            </div>

            <iframe
               src={`${pdf_url}#view=FitH`} // Ajout du paramètre pour adapter la vue
               className="w-full h-full relative z-10"
               title="Prévisualisation ERP"
               loading="lazy"
            />

            {/* Bouton flottant "Ouvrir en grand" */}
            <a
               href={pdf_url}
               target="_blank"
               rel="noopener noreferrer"
               className="absolute bottom-6 right-6 z-20 bg-white text-slate-800 px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
            >
               <ExternalLink size={14} /> Ouvrir en plein écran
            </a>

         </div>

      </div>
   );
};

// Petit composant Loader pour l'attente
const Loader2 = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);