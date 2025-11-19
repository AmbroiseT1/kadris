import React from 'react';

export const BackgroundGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
       {/* Base Tint */}
       <div className="absolute inset-0 bg-kadris-cream"></div>
       
       {/* Grid Pattern */}
       <div className="absolute inset-0 opacity-[0.03]" 
            style={{ 
                backgroundImage: `linear-gradient(#1A2B3C 1px, transparent 1px), linear-gradient(90deg, #1A2B3C 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}>
       </div>

       {/* Soft Gradients */}
       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-kadris-terracotta/5 rounded-full blur-[120px]"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-kadris-sage/10 rounded-full blur-[100px]"></div>

       {/* Sharp Geometric Accent Lines */}
       {/* On définit une boite de 100x100 unités, et on dessine dedans */}
       <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* M0,0 L100,100 = De haut-gauche à bas-droite */}
          <path d="M0,0 L100,50" stroke="#1A2B3C" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <path d="M100,0 L80,100" stroke="#1A2B3C" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
       </svg>
    </div>
  );
};