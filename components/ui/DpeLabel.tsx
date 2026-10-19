import React from 'react';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const COLORS: Record<string, string> = {
    A: 'bg-dpe-a', B: 'bg-dpe-b', C: 'bg-dpe-c', D: 'bg-dpe-d', E: 'bg-dpe-e', F: 'bg-dpe-f', G: 'bg-dpe-g',
};

/** Étiquette énergie au format réglementaire. La lettre est toujours écrite. */
export default function DpeLabel({ classe, valeur, unite = 'kWh/m²/an', compact = false }: { classe?: string | null; valeur?: number | null; unite?: string; compact?: boolean }) {
    const c = (classe || '').toUpperCase();
    const known = (CLASSES as readonly string[]).includes(c);
    const alt = known ? `DPE classe ${c}${valeur ? `, ${Math.round(valeur)} ${unite}` : ''}` : 'DPE non disponible';
    if (compact) {
        return (
            <span role="img" aria-label={alt} className={`inline-grid place-items-center w-9 h-9 rounded font-display font-extrabold text-lg text-[#10181d] ${known ? COLORS[c] : 'bg-inconnu-soft text-inconnu'}`}>
                {known ? c : '?'}
            </span>
        );
    }
    return (
        <div role="img" aria-label={alt} className="grid gap-[3px] w-full max-w-[280px]">
            {CLASSES.map((k, i) => (
                <div key={k} className="flex items-center gap-2 h-[22px]">
                    <span
                        className={`h-full flex items-center pl-2 font-display font-extrabold text-sm text-[#10181d] ${COLORS[k]} ${known && k !== c ? 'opacity-45' : ''}`}
                        style={{ width: `${30 + i * 10}%`, clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)' }}
                    >
                        {k}
                    </span>
                    {k === c && (
                        <span className="flex items-center gap-1.5 font-mono text-xs font-medium text-texte whitespace-nowrap">
                            <span aria-hidden className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-texte" />
                            {valeur ? `${Math.round(valeur)} ${unite}` : 'ce logement'}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
