"use client";

import React from 'react';
import { Download, Shield, ExternalLink, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { BuildingData } from '@/app/lib/types';
import { RiskData, RiskSectionStatus } from '@/app/lib/georisques';
import { formatDateFr } from '@/app/lib/sources';
import { SourceBadge } from './SourceBadge';

type Tone = 'danger' | 'warning' | 'ok' | 'unknown';

const TONE: Record<Tone, string> = {
   danger: 'bg-red-50 border-red-100 text-red-800',
   warning: 'bg-orange-50 border-orange-100 text-orange-800',
   ok: 'bg-green-50 border-green-100 text-green-800',
   unknown: 'bg-slate-50 border-slate-200 text-slate-500',
};

const RiskRow = ({ title, status = 'error', value, tone, detail }: { title: string; status?: RiskSectionStatus; value?: string; tone?: Tone; detail?: React.ReactNode }) => {
   const effectiveTone: Tone = status === 'ok' ? (tone || 'ok') : 'unknown';
   const label = status === 'error' ? 'Données indisponibles' : status === 'empty' ? 'Non renseigné' : value;
   const Icon = effectiveTone === 'unknown' ? HelpCircle : effectiveTone === 'ok' ? CheckCircle : AlertTriangle;
   return (
      <div className={`p-4 rounded-sm border ${TONE[effectiveTone]}`}>
         <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-bricq-slate">{title}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
               <Icon size={14} aria-hidden /> {label}
            </span>
         </div>
         {status === 'ok' && detail && <div className="mt-2 text-xs text-slate-600">{detail}</div>}
      </div>
   );
};

function argilesTone(niveau: RiskData['argiles']): Tone {
   if (niveau === 'Fort') return 'danger';
   if (niveau === 'Moyen') return 'warning';
   return 'ok';
}

export const TabRisks = ({ data }: { data: BuildingData | null }) => {
   const source = data?.sources?.risques;
   const r = data?.risques_detailles;

   if (!r) {
      return (
         <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <Shield className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">
               {source?.status === 'loading'
                  ? 'Interrogation de Géorisques en cours…'
                  : "Les coordonnées du bien sont nécessaires pour générer l'État des Risques."}
            </p>
            <SourceBadge source={source} className="justify-center mt-4" />
         </div>
      );
   }

   const s: Partial<NonNullable<RiskData['sections']>> = r.sections ?? {};
   const installationsCount = r.installations_count ?? r.installations?.length ?? 0;

   return (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

         {/* 1. SYNTHÈSE DES RUBRIQUES */}
         <section className="bg-white p-6 rounded-sm border border-stone-200" aria-labelledby="risks-synthese">
            <h3 id="risks-synthese" className="font-serif text-xl font-bold text-bricq-slate mb-1 flex items-center gap-2">
               <Shield size={20} className="text-bricq-terracotta" /> Synthèse des risques
            </h3>
            <p className="text-xs text-slate-500 mb-4">
               Inondation, CatNat, sismicité et radon sont évalués à l&apos;échelle de la commune ; argiles au point ; cavités (500 m) et ICPE (1 km) autour du bien.
            </p>

            {r.status === 'unavailable' && (
               <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 text-sm rounded-sm" role="alert">
                  Géorisques n&apos;a pas répondu : les risques ne sont pas évalués. Cela ne signifie pas l&apos;absence de risque — consultez le PDF officiel ci-dessous.
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <RiskRow
                  title="Retrait-gonflement des argiles"
                  status={s.argiles}
                  value={r.argiles === 'Nul' ? 'Non exposé' : r.argiles ? `Exposition ${r.argiles.toLowerCase()}` : undefined}
                  tone={argilesTone(r.argiles)}
               />
               <RiskRow
                  title="Inondation (commune)"
                  status={s.inondation}
                  value={r.inondation ? 'Commune exposée' : 'Non recensé'}
                  tone={r.inondation ? 'warning' : 'ok'}
                  detail={r.inondation_detail?.zones.length ? `Atlas des zones inondables : ${r.inondation_detail.zones.join(', ')}` : undefined}
               />
               <RiskRow
                  title="Arrêtés CatNat (commune)"
                  status={s.catnat}
                  value={r.catnat ? `${r.catnat.count} arrêté(s)` : undefined}
                  tone={(r.catnat?.count || 0) > 0 ? 'warning' : 'ok'}
                  detail={r.catnat?.evenements.length ? (
                     <ul className="space-y-0.5">
                        {r.catnat.evenements.slice(0, 5).map((e, i) => (
                           <li key={i}>{e.libelle} — {formatDateFr(e.date_debut)}</li>
                        ))}
                     </ul>
                  ) : undefined}
               />
               <RiskRow
                  title="Cavités souterraines (500 m)"
                  status={s.cavites}
                  value={r.cavites ? (r.cavites.count > 0 ? `${r.cavites.count} recensée(s)` : 'Aucune recensée') : undefined}
                  tone={(r.cavites?.count || 0) > 0 ? 'danger' : 'ok'}
               />
               <RiskRow
                  title="Installations classées (1 km)"
                  status={s.installations}
                  value={installationsCount > 0 ? `${installationsCount} ICPE` : 'Aucune recensée'}
                  tone={installationsCount > 0 ? 'warning' : 'ok'}
                  detail={r.installations?.length ? r.installations.slice(0, 5).map(i => i.nom).filter(Boolean).join(' · ') : undefined}
               />
               <RiskRow
                  title="Zone de sismicité"
                  status={s.sismicite}
                  value={r.sismicite ? (r.sismicite.libelle || `Zone ${r.sismicite.zone}`) : undefined}
                  tone={Number(r.sismicite?.zone) >= 3 ? 'warning' : 'ok'}
               />
               <RiskRow
                  title="Potentiel radon"
                  status={s.radon}
                  value={r.radon ? `Catégorie ${r.radon.classe}` : undefined}
                  tone={r.radon?.classe === '3' ? 'warning' : 'ok'}
               />
            </div>
            <SourceBadge source={source} className="mt-4" />
         </section>

         {/* 2. ERP OFFICIEL */}
         <div className="bg-white p-8 rounded-2xl border border-bricq-slate/5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
               <h3 className="font-serif text-2xl font-bold text-bricq-slate mb-2">
                  État des Risques et Pollutions (ERP)
               </h3>
               <p className="text-slate-600 max-w-2xl leading-relaxed">
                  Document officiel généré par le Ministère de la Transition Écologique. Seul ce document fait foi pour la vente.
               </p>
            </div>
            <a
               href={r.pdf_url}
               target="_blank"
               rel="noopener noreferrer"
               className="group flex items-center justify-center gap-3 bg-bricq-slate hover:bg-bricq-terracotta text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md"
            >
               <Download size={20} aria-hidden />
               <span>Télécharger le PDF Officiel</span>
            </a>
         </div>

         {/* 3. VISUALISATION (IFRAME) */}
         <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner h-[800px] relative group print:hidden">
            <iframe
               src={`${r.pdf_url}#view=FitH`}
               className="w-full h-full relative z-10"
               title="Prévisualisation ERP"
               loading="lazy"
            />
            <a
               href={r.pdf_url}
               target="_blank"
               rel="noopener noreferrer"
               className="absolute bottom-6 right-6 z-20 bg-white text-slate-800 px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-slate-50"
            >
               <ExternalLink size={14} aria-hidden /> Ouvrir en plein écran
            </a>
         </div>
      </div>
   );
};
