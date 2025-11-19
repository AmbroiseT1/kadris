"use client";
import React from 'react';
import { Lock } from 'lucide-react';

export const TabOwner = () => (
  <div className="bg-kadris-slate text-white rounded-2xl p-12 text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
     {/* Background effect */}
     <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
     
     <div className="relative z-10 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-kadris-terracotta">
           <Lock size={32} />
        </div>
        <h2 className="font-serif text-3xl font-bold mb-4">Données Privées Propriétaire</h2>
        <p className="text-white/70 mb-8 text-lg">
           L'historique des travaux, les factures, les diagnostics complets (DPE) et les plans sont accessibles uniquement au propriétaire vérifié.
        </p>
        <button className="bg-kadris-terracotta hover:bg-[#A04530] text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
           Je suis le propriétaire
        </button>
        <p className="mt-4 text-xs text-white/30 uppercase tracking-widest">Vérification par Titre de Propriété requise</p>
     </div>
  </div>
);