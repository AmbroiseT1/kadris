"use client";
import React, { useMemo } from 'react';
import { TrendingUp, Euro, Target, History, ArrowUpRight, ArrowDownRight, MapPin, ExternalLink, AlertTriangle, Activity, Layers } from 'lucide-react';
import { TransactionDVF, calculateMarketStats } from '@/app/lib/dvf';

interface TabDVFProps {
   transactions: TransactionDVF[];
   loading: boolean;
   surface?: number; // Surface du bien actuel pour l'estimation
}

export const TabDVF = ({ transactions, loading, surface }: TabDVFProps) => {

   const stats = useMemo(() => {
      return calculateMarketStats(transactions);
   }, [transactions]);

   const targetSale = useMemo(() => {
      return transactions.find(t => t.is_target);
   }, [transactions]);

   const estimation = useMemo(() => {
      if (!surface || !stats.prix_moyen_m2) return null;
      // On pourrait affiner l'estimation en utilisant le prix du segment correspondant à la surface
      let basePrice = stats.prix_moyen_m2;
      if (surface < 50 && stats.prix_par_surface.small > 0) basePrice = stats.prix_par_surface.small;
      else if (surface >= 50 && surface < 120 && stats.prix_par_surface.medium > 0) basePrice = stats.prix_par_surface.medium;
      else if (surface >= 120 && stats.prix_par_surface.large > 0) basePrice = stats.prix_par_surface.large;

      return Math.round(surface * basePrice);
   }, [surface, stats]);

   const appreciation = useMemo(() => {
      if (!targetSale || !estimation) return null;
      const diff = estimation - targetSale.valeur_fonciere;
      const percent = (diff / targetSale.valeur_fonciere) * 100;
      return { value: diff, percent: percent };
   }, [targetSale, estimation]);

   if (loading) return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-kadris-slate/50 animate-pulse">
         <TrendingUp size={48} className="mb-4 opacity-20" />
         <p>Analyse experte du marché en cours...</p>
      </div>
   );

   if (transactions.length === 0) return (
      <div className="bg-white rounded-2xl p-12 border border-kadris-slate/5 shadow-sm text-center">
         <TrendingUp size={48} className="mx-auto text-kadris-sage mb-4 opacity-50" />
         <h3 className="text-xl font-bold text-kadris-slate">Données insuffisantes</h3>
         <p className="text-kadris-slate/50 mt-2 max-w-md mx-auto">
            Nous n'avons pas trouvé assez de transactions comparables dans un rayon de 300m pour établir une estimation fiable.
         </p>
      </div>
   );

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* BLOC 1 : TICKER DU MARCHÉ (KPIs) */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* KPI 1 : PRIX MOYEN */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-kadris-blue/10 rounded-lg text-kadris-blue">
                     <Euro size={20} />
                  </div>
                  {stats.tendance_annuelle !== 0 && (
                     <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.tendance_annuelle > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {stats.tendance_annuelle > 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                        {Math.abs(stats.tendance_annuelle)}%
                     </div>
                  )}
               </div>
               <div>
                  <div className="text-2xl font-bold text-kadris-slate">{stats.prix_moyen_m2.toLocaleString()} €/m²</div>
                  <div className="text-xs text-kadris-slate/50 font-medium mt-1">Moyenne globale</div>
               </div>
            </div>

            {/* KPI 2 : ESTIMATION EXPERTE */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm flex flex-col justify-between relative overflow-hidden md:col-span-2">
               <div className="absolute top-0 right-0 w-32 h-32 bg-kadris-terracotta/5 rounded-bl-full -mr-8 -mt-8"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-kadris-terracotta/10 rounded-lg text-kadris-terracotta">
                        <Target size={20} />
                     </div>
                     <span className="text-xs font-bold text-kadris-terracotta uppercase tracking-wider">Estimation Experte</span>
                  </div>
               </div>
               <div className="relative flex items-end gap-4">
                  <div>
                     <div className="text-3xl font-bold text-kadris-slate">
                        {estimation ? `${estimation.toLocaleString()} €` : "N/A"}
                     </div>
                     <div className="text-sm text-kadris-slate/50 font-medium mt-1">
                        Basé sur la surface ({surface || "?"} m²) et le segment de marché
                     </div>
                  </div>
               </div>
            </div>

            {/* KPI 3 : TENSION DU MARCHÉ */}
            <div className="bg-white p-5 rounded-2xl border border-kadris-slate/5 shadow-sm flex flex-col justify-between">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-kadris-sage/10 rounded-lg text-kadris-sage">
                     <Activity size={20} />
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${stats.tension_marche === 'Elevée' ? 'bg-red-100 text-red-700' :
                        stats.tension_marche === 'Faible' ? 'bg-blue-100 text-blue-700' :
                           'bg-green-100 text-green-700'
                     }`}>
                     {stats.tension_marche.toUpperCase()}
                  </div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-kadris-slate">
                     {stats.volume_ventes} <span className="text-sm font-normal text-kadris-slate/50">ventes</span>
                  </div>
                  <div className="text-xs text-kadris-slate/50 font-medium mt-1">
                     Volume transactions
                  </div>
               </div>
            </div>
         </div>

         {/* BLOC SEGMENTATION */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-kadris-slate/5 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-slate-500 uppercase">Studios & T2</div>
                     <div className="text-xs text-slate-400">&lt; 50m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-slate-700">
                  {stats.prix_par_surface.small ? `${stats.prix_par_surface.small.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-kadris-slate/5 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-slate-500 uppercase">T3 & T4</div>
                     <div className="text-xs text-slate-400">50 - 120m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-slate-700">
                  {stats.prix_par_surface.medium ? `${stats.prix_par_surface.medium.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-kadris-slate/5 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-slate-500 uppercase">Grands Espaces</div>
                     <div className="text-xs text-slate-400">&gt; 120m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-slate-700">
                  {stats.prix_par_surface.large ? `${stats.prix_par_surface.large.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
         </div>

         {/* BLOC 2 : HISTORIQUE DU BIEN (SNIPER) */}
         {targetSale && (
            <div className="bg-gradient-to-br from-kadris-slate to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

               <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                        <History size={24} className="text-kadris-cream" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-white mb-1">Dernière mutation détectée</h3>
                        <p className="text-white/60 text-sm max-w-md">
                           Ce bien semble avoir été vendu le <span className="text-white font-bold">{new Date(targetSale.date_mutation).toLocaleDateString('fr-FR')}</span>.
                        </p>
                        {targetSale.is_flip && (
                           <div className="mt-2 inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full text-red-200 text-xs font-bold">
                              <AlertTriangle size={12} />
                              ALERTE FLIP DÉTECTÉE
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex items-center gap-8 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                     <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Prix d'achat</div>
                        <div className="text-2xl font-bold text-white">{targetSale.valeur_fonciere.toLocaleString()} €</div>
                        <div className="text-[10px] text-white/40 mt-1">
                           ~ {(targetSale.valeur_fonciere_corrigee || targetSale.valeur_fonciere).toLocaleString()} € (Actualisé inflation)
                        </div>
                     </div>

                     {appreciation && (
                        <>
                           <div className="h-8 w-px bg-white/10"></div>
                           <div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Plus-value latente</div>
                              <div className={`text-2xl font-bold ${appreciation.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                 {appreciation.value > 0 ? '+' : ''}{appreciation.value.toLocaleString()} €
                                 <span className="text-sm ml-2 opacity-80">({appreciation.percent > 0 ? '+' : ''}{Math.round(appreciation.percent)}%)</span>
                              </div>
                           </div>
                        </>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* BLOC 3 : LISTE DES COMPARABLES */}
         <div className="bg-white rounded-2xl border border-kadris-slate/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-kadris-slate/5 flex justify-between items-center">
               <h3 className="font-serif text-xl font-bold text-kadris-slate">Comparables ({stats.volume_ventes})</h3>
               <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-kadris-slate/40 uppercase tracking-wider">Rayon 300m</div>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-kadris-cream/30 text-kadris-slate/60 font-bold uppercase text-xs tracking-wider">
                     <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Adresse</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Surface</th>
                        <th className="px-6 py-4">Terrain</th>
                        <th className="px-6 py-4">Prix</th>
                        <th className="px-6 py-4">Prix/m²</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-kadris-slate/5">
                     {transactions.map((t, i) => (
                        <tr key={i} className={`hover:bg-kadris-cream/20 transition-colors ${t.is_target ? 'bg-kadris-terracotta/5' : ''}`}>
                           <td className="px-6 py-4 font-medium text-kadris-slate whitespace-nowrap">
                              {new Date(t.date_mutation).toLocaleDateString('fr-FR')}
                              {t.is_target && <span className="ml-2 text-[10px] bg-kadris-terracotta text-white px-1.5 py-0.5 rounded-full">CIBLE</span>}
                              {t.is_flip && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold" title="Achat-Revente rapide détecté">FLIP</span>}
                           </td>
                           <td className="px-6 py-4 text-kadris-slate/70 min-w-[200px]">
                              <a
                                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.adresse)}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1 hover:text-kadris-terracotta transition-colors group"
                              >
                                 <span className="truncate max-w-[180px] block" title={t.adresse}>{t.adresse}</span>
                                 <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                           </td>
                           <td className="px-6 py-4 text-kadris-slate/70">{t.type_local}</td>
                           <td className="px-6 py-4 text-kadris-slate/70">{t.surface_reelle_bati} m²</td>
                           <td className="px-6 py-4 text-kadris-slate/70">{t.surface_terrain > 0 ? `${t.surface_terrain} m²` : '-'}</td>
                           <td className="px-6 py-4 font-bold text-kadris-slate whitespace-nowrap group relative cursor-help">
                              {t.valeur_fonciere.toLocaleString()} €
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                 Corrigé inflation : {(t.valeur_fonciere_corrigee || t.valeur_fonciere).toLocaleString()} €
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${t.prix_m2 < stats.prix_moyen_m2
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                 }`}>
                                 {t.prix_m2.toLocaleString()} €
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};