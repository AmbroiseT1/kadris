import React from 'react';
import { AlertTriangle, Database, Loader2 } from 'lucide-react';
import { formatDateFr, SourceInfo } from '@/app/lib/sources';

/** Pied de bloc : source, date et état (« Données indisponibles » en cas d'erreur). */
export const SourceBadge = ({ source, className = '' }: { source?: SourceInfo; className?: string }) => {
    if (!source) return null;

    const name = source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-bricq-slate">
            {source.name}
        </a>
    ) : (
        source.name
    );

    if (source.status === 'loading') {
        return (
            <p className={`flex items-center gap-1.5 text-[11px] text-slate-400 ${className}`}>
                <Loader2 size={11} className="animate-spin" aria-hidden /> Source : {name} — chargement…
            </p>
        );
    }

    const fetched = formatDateFr(source.fetchedAt);
    return (
        <p
            className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] ${source.status === 'error' ? 'text-red-700' : 'text-slate-400'} ${className}`}
        >
            {source.status === 'error' ? <AlertTriangle size={11} aria-hidden /> : <Database size={11} aria-hidden />}
            <span>Source : {name}</span>
            {source.dataDate && <span>· Données : {source.dataDate}</span>}
            {fetched && <span>· Consulté le {fetched}</span>}
            {source.status === 'error' && <span className="font-bold">· Données indisponibles</span>}
            {source.status === 'partial' && <span className="font-bold text-orange-600">· Données partielles</span>}
            {source.status === 'empty' && <span>· Aucune donnée publiée</span>}
            {source.note && <span className="italic">· {source.note}</span>}
        </p>
    );
};

/** Bloc de remplacement quand une source est injoignable : jamais de valeur par défaut trompeuse. */
export const UnavailableBlock = ({ title, source }: { title: string; source?: SourceInfo }) => (
    <div className="bg-white border border-red-100 rounded-sm p-5" role="status">
        <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
            <AlertTriangle size={16} aria-hidden /> {title} : données indisponibles
        </div>
        <p className="text-sm text-slate-500 mb-3">
            La source n&apos;a pas répondu. Cette rubrique n&apos;est pas évaluée — l&apos;absence d&apos;information ne signifie pas l&apos;absence de risque ou de contrainte.
        </p>
        <SourceBadge source={source} />
    </div>
);
