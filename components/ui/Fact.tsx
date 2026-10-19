import React from 'react';
import StatusChip, { type Status } from './StatusChip';
import Term from './Term';

/**
 * Constat : libellé, valeur, statut, explication d'une ligne, source et date.
 * Une valeur absente s'affiche « Non évalué », jamais comme un résultat.
 */
export default function Fact({
    label, value, unit, status, statusLabel, hint, source, date, term, className = '',
}: {
    label: string;
    value?: React.ReactNode;
    unit?: string;
    status?: Status;
    statusLabel?: string;
    hint?: React.ReactNode;
    source?: string;
    date?: string;
    term?: string;
    className?: string;
}) {
    const missing = value === undefined || value === null || value === '';
    const st: Status | undefined = missing ? 'inconnu' : status;
    return (
        <div className={`card p-4 grid gap-2 content-start min-w-0 ${className}`}>
            <div className="flex items-start justify-between gap-2">
                <span className="label">{label}{term && <Term id={term} />}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-2">
                <span className={`font-display font-bold leading-none tabular ${missing ? 'text-xl text-texte-2' : 'text-2xl text-texte'}`}>
                    {missing ? 'Non évalué' : value}
                    {!missing && unit && <small className="ml-1 text-sm font-medium text-texte-2">{unit}</small>}
                </span>
                {st && <StatusChip status={st}>{missing ? 'Donnée absente' : statusLabel ?? ''}</StatusChip>}
            </div>
            {hint && <p className="text-sm text-texte-2">{hint}</p>}
            {(source || date) && (
                <div className="flex flex-wrap justify-between gap-2 border-t border-dashed border-trait pt-2 font-mono text-xs text-texte-2">
                    {source && <span>Source : {source}</span>}
                    {date && <span>{date}</span>}
                </div>
            )}
        </div>
    );
}
