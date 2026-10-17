import React from 'react';
import type { BuildingData } from '@/app/lib/types';
import type { TransactionDVF } from '@/app/lib/dvf';

interface Ev { year: number; label: string; detail?: string; kind: 'construction' | 'vente' | 'diagnostic' | 'travaux' }

const KIND: Record<Ev['kind'], { dot: string; name: string }> = {
    construction: { dot: 'bg-texte', name: 'Construction' },
    vente: { dot: 'bg-brique', name: 'Vente (DVF)' },
    diagnostic: { dot: 'bg-dpe-d', name: 'Diagnostic' },
    travaux: { dot: 'bg-encre', name: 'Travaux' },
};

/**
 * Biographie du logement : construction, ventes enregistrées à cette adresse, diagnostics,
 * puis travaux déclarés par le propriétaire (dans l'espace propriétaire).
 */
export default function Biographie({ data, dvf, works = [] }: { data: BuildingData; dvf: TransactionDVF[]; works?: { year: number; title: string }[] }) {
    const events: Ev[] = [];
    const annee = parseInt(data.annee_construction || '', 10);
    if (Number.isFinite(annee)) events.push({ year: annee, label: 'Construction', detail: data.materiaux_murs && data.materiaux_murs !== 'Non renseigné' ? data.materiaux_murs : undefined, kind: 'construction' });
    dvf.filter((t) => t.is_target).forEach((t) => {
        const y = parseInt(t.date_mutation?.slice(0, 4) || '', 10);
        if (Number.isFinite(y)) events.push({ year: y, label: `Vente · ${t.type_local || 'bien'}`, detail: `${Math.round(t.valeur_fonciere).toLocaleString('fr-FR')} €`, kind: 'vente' });
    });
    const dpeDate = data.dpe_reel?.date_etablissement_dpe;
    if (dpeDate) {
        const y = parseInt(dpeDate.slice(0, 4), 10);
        if (Number.isFinite(y)) events.push({ year: y, label: `DPE classe ${data.dpe_reel?.classe_bilan_dpe ?? '?'}`, kind: 'diagnostic' });
    }
    works.forEach((w) => events.push({ year: w.year, label: w.title, kind: 'travaux' }));
    events.sort((a, b) => a.year - b.year);

    if (events.length < 2) {
        return (
            <p className="text-texte-2 text-sm">
                La frise se complète avec les ventes enregistrées à cette adresse et les travaux déclarés par le propriétaire.
                {events.length === 1 && ` Seule la ${events[0].label.toLowerCase()} (${events[0].year}) est connue pour l'instant.`}
            </p>
        );
    }

    const kinds = Array.from(new Set(events.map((e) => e.kind)));
    return (
        <div className="grid gap-4">
            {/* Frise horizontale (≥ 640 px) */}
            <ol className="hidden sm:flex items-start overflow-x-auto pb-2" aria-label="Vie du logement">
                {events.map((e, i) => (
                    <li key={i} className="relative flex-1 min-w-[120px] pt-6 pr-3">
                        <span aria-hidden className="absolute left-0 right-0 top-[11px] h-0.5 bg-texte" />
                        <span aria-hidden className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ring-2 ring-papier ${KIND[e.kind].dot}`} />
                        <b className="block font-display tabular">{e.year}</b>
                        <span className="block text-sm">{e.label}</span>
                        {e.detail && <span className="block font-mono text-xs text-texte-2">{e.detail}</span>}
                    </li>
                ))}
            </ol>
            {/* Frise verticale (mobile) */}
            <ol className="sm:hidden grid gap-3 border-l-2 border-texte pl-4" aria-label="Vie du logement">
                {events.map((e, i) => (
                    <li key={i} className="relative">
                        <span aria-hidden className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full ring-2 ring-papier ${KIND[e.kind].dot}`} />
                        <b className="font-display tabular mr-2">{e.year}</b>{e.label}
                        {e.detail && <span className="block font-mono text-xs text-texte-2">{e.detail}</span>}
                    </li>
                ))}
            </ol>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texte-2">
                {kinds.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5"><i className={`w-2.5 h-2.5 rounded-full ${KIND[k].dot}`} />{KIND[k].name}</span>
                ))}
            </div>
        </div>
    );
}
