import React from 'react';

/** Pendant le chargement de la 3D : le contour du logement se dessine comme un plan. */
export default function PlanTrace({ label = 'Construction de la maquette 3D…' }: { label?: string }) {
    const path = 'M70 190V100L160 45L250 100V190Z';
    return (
        <div className="w-full h-full grid place-items-center bg-papier" role="status">
            <svg viewBox="0 0 320 230" className="w-56 max-w-full" aria-hidden>
                <path d={path} fill="var(--color-encre-soft)" className="motion-safe:animate-[pulse_2s_ease-in-out_infinite]" />
                <path d={path} fill="none" stroke="var(--color-encre)" strokeWidth={2} strokeLinejoin="round"
                    style={{ strokeDasharray: 600, ['--len' as string]: 600, animation: 'trace 1.4s ease-in-out infinite alternate' } as React.CSSProperties} />
                <path d="M70 208h180M70 203v10M250 203v10" stroke="var(--color-texte-2)" strokeWidth={1} fill="none" />
            </svg>
            <span className="font-mono text-xs text-texte-2 -mt-4">{label}</span>
        </div>
    );
}
