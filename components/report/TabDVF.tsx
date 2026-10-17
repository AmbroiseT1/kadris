"use client";
import React, { useMemo } from 'react';
import { TrendingUp, Euro, Target, History, ArrowUpRight, ArrowDownRight, ExternalLink, AlertTriangle, Activity, Layers, Info } from 'lucide-react';
import { TransactionDVF, calculateMarketStats, BackendMarketStats, PriceStats, DVF_RADIUS_M } from '@/app/lib/dvf';
import { SourceInfo } from '@/app/lib/sources';
import { SourceBadge, UnavailableBlock } from './SourceBadge';

interface TabDVFProps {
   transactions: TransactionDVF[];
   loading: boolean;
   marketStats: BackendMarketStats | null;
   surface?: number; // Surface HABITABLE du bien (DPE), pas l'emprise au sol ; sans elle, pas d'estimation
   surface_terrain?: number; // Surface terrain du bien actuel
   source?: SourceInfo;
}

const fmtPrice = (s: PriceStats | null | undefined) =>
   s ? `${s.prix_median_m2.toLocaleString('fr-FR')} €/m²` : '—';

const MedianCard = ({ label, near, commune }: { label: string; near?: PriceStats | null; commune?: PriceStats | null }) => (
   <div className="bg-white p-4 rounded-xl border border-trait shadow-sm">
      <div className="text-xs font-bold text-texte-2 uppercase mb-2">{label} — prix médian</div>
      <div className="flex items-baseline justify-between gap-4">
         <div>
            <div className="text-lg font-bold text-texte">{fmtPrice(near)}</div>
            <div className="text-xs text-texte-2">{near ? `${near.nombre_transactions} ventes, rayon ${DVF_RADIUS_M} m` : `Aucune vente comparable à ${DVF_RADIUS_M} m`}</div>
         </div>
         <div className="text-right">
            <div className="text-sm font-bold text-texte-2">{fmtPrice(commune)}</div>
            <div className="text-xs text-texte-2">{commune ? `commune (${commune.nombre_transactions} ventes)` : 'commune'}</div>
         </div>
      </div>
   </div>
);

export const TabDVF = ({ transactions, loading, marketStats, surface, surface_terrain, source }: TabDVFProps) => {

   const stats = useMemo(() => {
      // Si on a des stats venant du backend, on les mixe avec le client side pour les parties manquantes (comme la segmentation surface)
      const clientStats = calculateMarketStats(transactions);

      if (marketStats) {
         return {
            ...clientStats,
            prix_moyen_m2: marketStats.prix_moyen_m2,
            prix_min: marketStats.prix_min_m2,
            prix_max: marketStats.prix_max_m2,
            volume_ventes: marketStats.nombre_transactions,
            // On peut aussi utiliser la médiane si on veut l'afficher qqpart
            prix_median_m2: marketStats.prix_median_m2
         };
      }

      return clientStats;
   }, [transactions, marketStats]);

   const targetSale = useMemo(() => {
      return transactions.find(t => t.is_target);
   }, [transactions]);

   const estimation = useMemo(() => {
      if (!surface || !stats.prix_moyen_m2) return null;

      // 1. Estimation du Bâti
      let basePrice = stats.prix_moyen_m2;
      // Affinement par segment de surface
      if (surface < 50 && stats.prix_par_surface.small > 0) basePrice = stats.prix_par_surface.small;
      else if (surface >= 50 && surface < 120 && stats.prix_par_surface.medium > 0) basePrice = stats.prix_par_surface.medium;
      else if (surface >= 120 && stats.prix_par_surface.large > 0) basePrice = stats.prix_par_surface.large;

      const valueBati = surface * basePrice;

      // 2. Estimation du Terrain (Heuristique simple : 15% du prix au m² bâti si pas de donnée précise)
      // C'est une approximation, l'idéal serait d'avoir un prix m² terrain distinct
      let valueTerrain = 0;
      if (surface_terrain && surface_terrain > 0) {
         const estimatedLandPrice = basePrice * 0.15;
         valueTerrain = surface_terrain * estimatedLandPrice;
      }

      return Math.round(valueBati + valueTerrain);
   }, [surface, surface_terrain, stats]);

   const appreciation = useMemo(() => {
      if (!targetSale || !estimation) return null;
      const diff = estimation - targetSale.valeur_fonciere;
      const percent = (diff / targetSale.valeur_fonciere) * 100;
      return { value: diff, percent: percent };
   }, [targetSale, estimation]);

   if (loading) return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-texte-2 animate-pulse">
         <TrendingUp size={48} className="mb-4 opacity-20" />
         <p>Analyse experte du marché en cours...</p>
      </div>
   );

   if (source?.status === 'error') return (
      <UnavailableBlock title="Prix & transactions (DVF)" source={source} />
   );

   if (transactions.length === 0) return (
      <div className="bg-white rounded-2xl p-12 border border-trait shadow-sm text-center">
         <TrendingUp size={48} className="mx-auto text-ok mb-4 opacity-50" />
         <h3 className="text-xl font-bold text-texte">Données insuffisantes</h3>
         <p className="text-texte-2 mt-2 max-w-md mx-auto">
            Aucune vente publiée dans un rayon de {DVF_RADIUS_M} m sur les 5 dernières années. Les départements 57, 67, 68 (livre foncier) et Mayotte ne sont pas couverts par DVF.
         </p>
         <SourceBadge source={source} className="justify-center mt-4" />
      </div>
   );

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

         {/* BLOC 1 : TICKER DU MARCHÉ (KPIs) */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* KPI 1 : PRIX MOYEN */}
            <div className="bg-white p-5 rounded-2xl border border-trait shadow-sm flex flex-col justify-between group relative">
               <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-texte text-white text-xs p-2 rounded max-w-[150px] shadow-lg">
                     Moyenne des prix au m² des ventes enregistrées dans le rayon de {DVF_RADIUS_M} m.
                  </div>
               </div>
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-encre-soft rounded-lg text-encre">
                     <Euro size={20} />
                  </div>
                  {stats.tendance_annuelle !== 0 && (
                     <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.tendance_annuelle > 0 ? 'bg-ok-soft text-ok' : 'bg-alerte-soft text-alerte'}`}>
                        {stats.tendance_annuelle > 0 ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                        {Math.abs(stats.tendance_annuelle)}%
                     </div>
                  )}
               </div>
               <div>
                  <div className="text-2xl font-bold text-texte">{stats.prix_moyen_m2.toLocaleString()} €/m²</div>
                  <div className="text-xs text-texte-2 font-medium mt-1 flex items-center gap-1">
                     Moyenne globale <Info size={10} />
                  </div>
               </div>
            </div>

            {/* KPI 2 : ESTIMATION EXPERTE */}
            <div className="bg-white p-5 rounded-2xl border border-trait shadow-sm flex flex-col justify-between relative overflow-hidden md:col-span-2">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brique-soft rounded-bl-full -mr-8 -mt-8"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <div className="flex items-center gap-2">
                     <div className="p-2 bg-brique-soft rounded-lg text-brique">
                        <Target size={20} />
                     </div>
                     <span className="text-xs font-bold text-brique uppercase tracking-wider">Estimation Experte</span>
                  </div>
               </div>
               <div className="relative flex items-end gap-4">
                  <div>
                     <div className="text-3xl font-bold text-texte">
                        {estimation ? `${estimation.toLocaleString()} €` : "N/A"}
                     </div>
                     <div className="text-sm text-texte-2 font-medium mt-1">
                        {surface ? `Basé sur la surface habitable (${surface} m²) + terrain (${surface_terrain || 0} m²)` : "Surface habitable inconnue : estimation impossible"}
                     </div>
                  </div>
               </div>
            </div>

            {/* KPI 3 : TENSION DU MARCHÉ */}
            <div className="bg-white p-5 rounded-2xl border border-trait shadow-sm flex flex-col justify-between group relative">
               <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-texte text-white text-xs p-2 rounded max-w-[150px] shadow-lg">
                     Indicateur basé sur le volume de ventes des 12 derniers mois comparé à la moyenne historique.
                  </div>
               </div>
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-ok-soft rounded-lg text-ok">
                     <Activity size={20} />
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${stats.tension_marche === 'Elevée' ? 'bg-alerte-soft text-alerte' :
                     stats.tension_marche === 'Faible' ? 'bg-encre-soft text-encre' :
                        'bg-ok-soft text-ok'
                     }`}>
                     {stats.tension_marche.toUpperCase()}
                  </div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-texte">
                     {stats.volume_ventes} <span className="text-sm font-normal text-texte-2">ventes</span>
                  </div>
                  <div className="text-xs text-texte-2 font-medium mt-1 flex items-center gap-1">
                     Volume transactions <Info size={10} />
                  </div>
               </div>
            </div>
         </div>

         {/* BLOC SEGMENTATION */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-trait shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-papier rounded-lg text-texte-2"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-texte-2 uppercase">Studios & T2</div>
                     <div className="text-xs text-texte-2">&lt; 50m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-texte">
                  {stats.prix_par_surface.small ? `${stats.prix_par_surface.small.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-trait shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-papier rounded-lg text-texte-2"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-texte-2 uppercase">T3 & T4</div>
                     <div className="text-xs text-texte-2">50 - 120m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-texte">
                  {stats.prix_par_surface.medium ? `${stats.prix_par_surface.medium.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-trait shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-papier rounded-lg text-texte-2"><Layers size={16} /></div>
                  <div>
                     <div className="text-xs font-bold text-texte-2 uppercase">Grands Espaces</div>
                     <div className="text-xs text-texte-2">&gt; 120m²</div>
                  </div>
               </div>
               <div className="text-lg font-bold text-texte">
                  {stats.prix_par_surface.large ? `${stats.prix_par_surface.large.toLocaleString()} €/m²` : '-'}
               </div>
            </div>
         </div>

         {/* BLOC 2 : HISTORIQUE DU BIEN (SNIPER) */}
         {targetSale && (
            <div className="bg-gradient-to-br from-encre to-encre rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

               <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                        <History size={24} className="text-papier" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-white mb-1">Dernière mutation détectée</h3>
                        <p className="text-white/60 text-sm max-w-md">
                           Ce bien semble avoir été vendu le <span className="text-white font-bold">{new Date(targetSale.date_mutation).toLocaleDateString('fr-FR')}</span>.
                        </p>
                        {targetSale.is_flip && (
                           <div className="mt-2 inline-flex items-center gap-2 bg-alerte-soft border border-alerte/30 px-3 py-1 rounded-full text-alerte-soft text-xs font-bold">
                              <AlertTriangle size={12} />
                              ALERTE FLIP DÉTECTÉE
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="flex items-center gap-8 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                     <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Prix d’achat</div>
                        <div className="text-2xl font-bold text-white">{targetSale.valeur_fonciere.toLocaleString()} €</div>
                        <div className="text-xs text-white/40 mt-1">
                           ~ {(targetSale.valeur_fonciere_corrigee || targetSale.valeur_fonciere).toLocaleString()} € (Actualisé inflation)
                        </div>
                     </div>

                     {appreciation && (
                        <>
                           <div className="h-8 w-px bg-white/10"></div>
                           <div>
                              <div className="text-xs text-white/50 uppercase tracking-wider font-bold mb-1">Plus-value latente</div>
                              <div className={`text-2xl font-bold ${appreciation.value >= 0 ? 'text-ok-soft' : 'text-alerte-soft'}`}>
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
         <div className="bg-white rounded-2xl border border-trait shadow-sm overflow-hidden">
            <div className="p-6 border-b border-trait flex justify-between items-center">
               <h3 className="font-serif text-xl font-bold text-texte">Comparables ({stats.volume_ventes})</h3>
               <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-texte-2 uppercase tracking-wider">Rayon {DVF_RADIUS_M} m</div>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-papier text-texte-2 font-bold uppercase text-xs tracking-wider">
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
                  <tbody className="divide-y divide-trait">
                     {transactions.map((t, i) => (
                        <tr key={i} className={`hover:bg-papier transition-colors ${t.is_target ? 'bg-brique-soft' : ''}`}>
                           <td className="px-6 py-4 font-medium text-texte whitespace-nowrap">
                              {new Date(t.date_mutation).toLocaleDateString('fr-FR')}
                              {t.is_target && <span className="ml-2 text-xs bg-brique text-white px-1.5 py-0.5 rounded-full">CIBLE</span>}
                              {t.is_flip && <span className="ml-2 text-xs bg-alerte-soft text-alerte px-1.5 py-0.5 rounded-full font-bold" title="Achat-Revente rapide détecté">FLIP</span>}
                           </td>
                           <td className="px-6 py-4 text-texte-2 min-w-[200px]">
                              <a
                                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.adresse)}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-1 hover:text-brique transition-colors group"
                              >
                                 <span className="truncate max-w-[180px] block" title={t.adresse}>{t.adresse}</span>
                                 <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                           </td>
                           <td className="px-6 py-4 text-texte-2">{t.type_local}</td>
                           <td className="px-6 py-4 text-texte-2">{t.surface_reelle_bati} m²</td>
                           <td className="px-6 py-4 text-texte-2">{t.surface_terrain > 0 ? `${t.surface_terrain} m²` : '-'}</td>
                           <td className="px-6 py-4 font-bold text-texte whitespace-nowrap group relative cursor-help">
                              {t.valeur_fonciere.toLocaleString()} €
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-texte text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                 Corrigé inflation : {(t.valeur_fonciere_corrigee || t.valeur_fonciere).toLocaleString()} €
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {t.prix_m2 > 0 ? (
                                 <span className="px-2 py-1 rounded-md text-xs font-bold bg-papier text-texte">
                                    {t.prix_m2.toLocaleString()} €
                                 </span>
                              ) : (
                                 <span className="text-texte-2 italic text-xs">N/A</span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {marketStats?.par_type && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <MedianCard label="Appartements" near={marketStats.par_type.Appartement} commune={marketStats.commune?.Appartement} />
               <MedianCard label="Maisons" near={marketStats.par_type.Maison} commune={marketStats.commune?.Maison} />
            </div>
         )}
         <SourceBadge source={source} />
      </div>
   );
};
