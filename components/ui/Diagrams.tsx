"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Map, DollarSign, AlertTriangle } from 'lucide-react';

// --- VISUAL 1: MAP LAYERS ---
export const MapLayersViz: React.FC = () => {
  return (
    <div className="relative w-full h-72 flex items-center justify-center perspective-[1000px] group cursor-pointer">
      
      {/* Layer 3: Market Data (Top) */}
      <motion.div 
        className="absolute w-48 h-48 bg-white/90 rounded-xl shadow-lg border border-kadris-slate/20 flex items-center justify-center z-30 transform preserve-3d transition-all duration-500 group-hover:-translate-y-12 group-hover:rotate-x-12 group-hover:shadow-xl"
        style={{ rotateX: 60, rotateZ: -45, translateZ: 60 }}
      >
         <div className="text-kadris-terracotta flex flex-col items-center gap-2">
            <DollarSign size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-kadris-slate">Valeur & Marché</span>
         </div>
         {/* Grid lines */}
         <div className="absolute inset-0 border-2 border-kadris-terracotta/10 rounded-xl"></div>
      </motion.div>

      {/* Layer 2: Risk Data (Middle) */}
      <motion.div 
        className="absolute w-48 h-48 bg-kadris-sage/20 backdrop-blur-sm rounded-xl shadow-md border border-kadris-sage/30 flex items-center justify-center z-20 transform preserve-3d transition-all duration-500 group-hover:translate-y-0 group-hover:rotate-x-12"
        style={{ rotateX: 60, rotateZ: -45, translateZ: 30 }}
      >
        <div className="text-kadris-slate flex flex-col items-center gap-2 opacity-80">
            <AlertTriangle size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Risques & Sols</span>
         </div>
      </motion.div>

      {/* Layer 1: Cadastre (Bottom) */}
      <motion.div 
        className="absolute w-48 h-48 bg-kadris-slate/90 rounded-xl shadow-xl flex items-center justify-center z-10 transform preserve-3d transition-all duration-500 group-hover:translate-y-12 group-hover:rotate-x-12"
        style={{ rotateX: 60, rotateZ: -45, translateZ: 0 }}
      >
         <div className="text-white/80 flex flex-col items-center gap-2">
            <Map size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Cadastre</span>
         </div>
         <svg className="absolute inset-0 w-full h-full opacity-20 p-4" viewBox="0 0 100 100">
            <path d="M10,10 L40,10 L40,40 L10,40 Z" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M50,10 L90,20 L80,50 L50,40 Z" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M10,50 L40,50 L30,90 L10,80 Z" fill="none" stroke="white" strokeWidth="2"/>
            <path d="M50,60 L90,60 L90,90 L50,90 Z" fill="none" stroke="white" strokeWidth="2"/>
         </svg>
      </motion.div>
      
      <div className="absolute -bottom-8 text-xs font-sans text-kadris-slate/40 tracking-widest uppercase">
        Survoler pour décomposer
      </div>
    </div>
  );
};

// --- VISUAL 2: DATA SYNTHESIS CARD ---
export const DataSynthesisCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-xl border border-kadris-slate/10 overflow-hidden max-w-sm mx-auto font-sans">
       {/* Header */}
       <div className="bg-kadris-slate p-4 flex justify-between items-center text-white">
          <div>
             <div className="text-xs opacity-60 uppercase tracking-wider font-bold">Synthèse Adresse</div>
             <div className="font-serif text-lg">14 Rue de la République</div>
          </div>
          <div className="w-8 h-8 bg-kadris-terracotta rounded-full flex items-center justify-center font-bold text-sm">A</div>
       </div>

       {/* Body */}
       <div className="p-6 space-y-6">
          
          {/* Price Graph Simulation */}
          <div>
             <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-kadris-slate">Historique Prix / m²</span>
                <span className="text-xs text-kadris-terracotta font-medium">+12% sur 5 ans</span>
             </div>
             <div className="h-24 flex items-end gap-1">
                {[40, 45, 42, 55, 60, 75].map((h, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     whileInView={{ height: `${h}%` }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-kadris-terracotta' : 'bg-kadris-slate/20'}`}
                   />
                ))}
             </div>
             <div className="flex justify-between text-[10px] text-kadris-slate/40 mt-1">
                <span>2018</span>
                <span>2023</span>
             </div>
          </div>

          {/* Risk Items */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-kadris-cream p-3 rounded-lg border border-kadris-slate/5">
                <div className="text-xs text-kadris-slate/50 font-bold uppercase mb-1">Argiles</div>
                <div className="text-kadris-terracotta font-bold flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-kadris-terracotta"></div> Fort
                </div>
             </div>
             <div className="bg-kadris-cream p-3 rounded-lg border border-kadris-slate/5">
                <div className="text-xs text-kadris-slate/50 font-bold uppercase mb-1">Inondation</div>
                <div className="text-kadris-sage font-bold flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-kadris-sage"></div> Faible
                </div>
             </div>
          </div>

          {/* Sale History List */}
          <div>
             <div className="text-xs font-bold text-kadris-slate mb-2 uppercase tracking-wider">Dernières Ventes (DVF)</div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm border-b border-kadris-slate/5 pb-1">
                   <span className="text-kadris-slate/70">Jan 2022</span>
                   <span className="font-medium text-kadris-slate">245 000 €</span>
                </div>
                <div className="flex justify-between text-sm border-b border-kadris-slate/5 pb-1">
                   <span className="text-kadris-slate/70">Mar 2015</span>
                   <span className="font-medium text-kadris-slate">198 000 €</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}