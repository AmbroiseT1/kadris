import React from 'react';
import { RotateCw } from 'lucide-react';

export interface BrickSource {
    key: string;
    label: string;
    state: 'loading' | 'done' | 'error';
}

/**
 * Chargement « brique par brique » : chaque source publique qui répond pose une brique.
 * Une source en échec reste en pointillé, avec un bouton pour réessayer.
 */
export default function BrickLoader({ sources, onRetry, title = 'Nous interrogeons les sources publiques' }: { sources: BrickSource[]; onRetry?: () => void; title?: string }) {
    const done = sources.filter((s) => s.state === 'done').length;
    const failed = sources.filter((s) => s.state === 'error');
    return (
        <div className="card p-5 grid gap-4" role="status" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display font-bold text-lg">{title}</p>
                <span className="font-mono text-xs text-texte-2 tabular">{done} sur {sources.length} ont répondu</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {sources.map((s) => (
                    <span
                        key={s.key}
                        className={`h-8 rounded-[3px] font-mono text-[0.75rem] leading-8 text-center truncate px-1 ${
                            s.state === 'done'
                                ? 'bg-brique text-white motion-safe:animate-[pose-brique_400ms_var(--ease-rebond)_both]'
                                : s.state === 'error'
                                    ? 'border-[1.5px] border-dashed border-alerte text-alerte'
                                    : 'border-[1.5px] border-dashed border-trait-fort text-texte-2 motion-safe:animate-pulse'
                        } col-span-2`}
                        title={`${s.label} : ${s.state === 'done' ? 'reçu' : s.state === 'error' ? 'indisponible' : 'en attente'}`}
                    >
                        {s.label}
                    </span>
                ))}
            </div>
            {failed.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-texte-2">
                    <span>{failed.map((f) => f.label).join(', ')} : pas de réponse.</span>
                    {onRetry && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
                            <RotateCw size={14} aria-hidden /> Réessayer
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
