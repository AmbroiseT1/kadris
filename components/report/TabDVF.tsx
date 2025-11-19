"use client";
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { TransactionDVF } from '@/app/lib/dvf';

export const TabDVF = ({ transactions, loading }: { transactions: TransactionDVF[], loading: boolean }) => {
    if (loading) return <div className="p-8 text-center text-kadris-slate/50">Chargement des ventes voisines...</div>;
    
    if (transactions.length === 0) return (
      <div className="bg-white rounded-2xl p-8 border border-kadris-slate/5 shadow-sm text-center">
         <TrendingUp size={48} className="mx-auto text-kadris-sage mb-4 opacity-50" />
         <h3 className="text-xl font-bold text-kadris-slate">Aucune vente détectée</h3>
         <p className="text-kadris-slate/50">Pas de transactions DVF trouvées dans un rayon proche.</p>
      </div>
    );
  
    return (
      <div className="bg-white rounded-2xl p-8 border border-kadris-slate/5 shadow-sm animate-in fade-in zoom-in-95 duration-300">
         <div className="flex justify-between items-end mb-8">
            <div>
               <h2 className="font-serif text-2xl font-bold text-kadris-slate">Transactions Immobilières</h2>
               <p className="text-kadris-slate/60">Historique identifié (Sniper) et voisinage (200m).</p>
            </div>
         </div>
  
         <div className="space-y-0">
            {transactions.map((sale, i) => (
               <div key={i} className={`relative pl-8 pb-8 border-l ${sale.is_target ? 'border-kadris-terracotta' : 'border-kadris-slate/10'} last:border-0 last:pb-0`}>
                  <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-white ${sale.is_target ? 'bg-kadris-terracotta scale-125' : 'bg-kadris-slate/30'}`}></div>
                  
                  <div className={`flex flex-col md:flex-row justify-between md:items-center p-4 rounded-lg transition-colors ${sale.is_target ? 'bg-kadris-terracotta/10 border border-kadris-terracotta/20' : 'bg-kadris-cream/30 hover:bg-kadris-cream/60'}`}>
                     <div>
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-kadris-slate">
                                {sale.type_local} ({sale.surface_reelle_bati} m²)
                            </div>
                            {sale.is_target && (
                                <span className="px-2 py-0.5 rounded-full bg-kadris-terracotta text-white text-[10px] font-bold uppercase tracking-wide">
                                    Ce Bien
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-kadris-slate/50">
                            {new Date(sale.date_mutation).toLocaleDateString('fr-FR')} • à {sale.distance}m
                        </div>
                     </div>
                     <div className="mt-2 md:mt-0 text-right">
                        <div className="font-bold text-kadris-slate text-lg">{sale.valeur_fonciere.toLocaleString()} €</div>
                        <div className="text-xs text-kadris-slate/60">{sale.prix_m2.toLocaleString()} €/m²</div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
};