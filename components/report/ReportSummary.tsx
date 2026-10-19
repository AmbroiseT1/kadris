import React from 'react';
import type { BuildingData } from '@/app/lib/types';
import type { BackendMarketStats } from '@/app/lib/dvf';
import Fact from '@/components/ui/Fact';
import type { Status } from '@/components/ui/StatusChip';
import CountUp from '@/components/motion/CountUp';

function dpeStatus(c?: string): Status | undefined {
    if (!c) return undefined;
    if ('ABC'.includes(c)) return 'ok';
    if ('DE'.includes(c)) return 'vigil';
    if ('FG'.includes(c)) return 'alerte';
    return undefined;
}

/** Phrase de synthèse, construite uniquement à partir des données réellement reçues. */
function verdict(d: BuildingData): string {
    const parts: string[] = [];
    const annee = d.annee_construction && /\d{4}/.test(d.annee_construction) ? d.annee_construction : null;
    const usage = (d.usage || '').toLowerCase();
    const type = usage.includes('résidentiel collectif') || (d.nb_logements ?? 0) > 2 ? 'Immeuble' : usage.includes('individuel') ? 'Maison' : 'Bâtiment';
    parts.push(`${type}${annee ? ` ${type === 'Maison' ? 'construite' : 'construit'} en ${annee}` : ''}${d.materiaux_murs && d.materiaux_murs !== 'Non renseigné' ? `, murs en ${d.materiaux_murs.toLowerCase()}` : ''}.`);
    const watch: string[] = [];
    const dpe = d.dpe_reel?.classe_bilan_dpe || d.dpe_lettre;
    if (dpe && 'DEFG'.includes(dpe)) watch.push(`la performance énergétique (classe ${dpe})`);
    const arg = d.risques_detailles?.argiles;
    if (arg === 'Moyen' || arg === 'Fort') watch.push(`l'aléa argiles ${arg.toLowerCase()}`);
    if (d.risques_detailles?.inondation) watch.push('le risque inondation sur la commune');
    if (d.urbanisme?.zonage && !d.urbanisme.zonage.is_constructible) watch.push('le zonage du PLU');
    if (watch.length) parts.push(`À vérifier : ${watch.join(', ')}.`);
    else if (d.risques_detailles?.status === 'ok' && dpe) parts.push('Aucun point d\'alerte dans les données reçues.');
    return parts.join(' ');
}

export default function ReportSummary({ data, marketStats }: { data: BuildingData; marketStats: BackendMarketStats | null }) {
    const dpe = (data.dpe_reel?.classe_bilan_dpe || data.dpe_lettre || '').toUpperCase();
    const knownDpe = /^[A-G]$/.test(dpe) ? dpe : undefined;
    const conso = data.dpe_reel?.conso_5_usages_ep_m2;
    const annee = data.annee_construction && /\d{4}/.test(data.annee_construction) ? data.annee_construction : undefined;
    const arg = data.risques_detailles?.argiles ?? undefined;
    const argStatus: Status | undefined = arg === 'Fort' ? 'alerte' : arg === 'Moyen' ? 'vigil' : arg ? 'ok' : undefined;
    const prix = marketStats?.prix_median_m2 || undefined;
    const ventes = marketStats?.nombre_transactions ?? 0;

    return (
        <div className="card p-5 grid gap-4">
            <span className="label">En résumé</span>
            <p className="text-lg max-w-[68ch]">{verdict(data)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Fact label="Construction" value={annee} status="ok" statusLabel={data.fiabilite === 'Haute' ? 'Date fiable' : 'Date estimée'} source="BDNB" />
                <Fact
                    label="Énergie"
                    term="dpe"
                    value={knownDpe ? `${knownDpe}${conso ? ` · ${Math.round(conso)}` : ''}` : undefined}
                    unit={conso ? 'kWh/m²/an' : undefined}
                    status={dpeStatus(knownDpe)}
                    statusLabel={knownDpe && 'ABC'.includes(knownDpe) ? 'Économe' : knownDpe && 'DE'.includes(knownDpe) ? 'Moyen' : 'Énergivore'}
                    source="ADEME"
                />
                <Fact label="Argiles" term="argiles" value={arg} status={argStatus} statusLabel={argStatus === 'ok' ? 'Favorable' : argStatus === 'vigil' ? 'À surveiller' : 'Point d\'alerte'} source="Géorisques" />
                <Fact
                    label="Prix médian"
                    term="dvf"
                    value={prix ? <CountUp value={Math.round(prix)} /> : undefined}
                    unit={prix ? '€/m²' : undefined}
                    status={prix ? (ventes >= 5 ? 'ok' : 'vigil') : undefined}
                    statusLabel={ventes >= 5 ? `${ventes} ventes` : 'Peu de ventes'}
                    source="DVF"
                />
            </div>
        </div>
    );
}
