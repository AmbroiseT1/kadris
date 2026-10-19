"use client";

import React, { useState, useEffect } from 'react';
import { Check, Download, Share2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import BrickLoader, { type BrickSource } from '@/components/motion/BrickLoader';
import ReportSummary from '@/components/report/ReportSummary';
import ReportSection from '@/components/report/ReportSection';
import Biographie from '@/components/report/Biographie';
import PlanTrace from '@/components/motion/PlanTrace';

const Building3D = dynamic(() => import('@/components/building3d/Building3D'), { ssr: false, loading: () => <PlanTrace /> });

// --- IMPORTS DES COMPOSANTS ---
import { TabSynthese } from '@/components/report/TabSynthese';
import { TabAnalyse } from '@/components/report/TabAnalyse';
import { TabDVF } from '@/components/report/TabDVF';
import { TabRisks } from '@/components/report/TabRisks';
import { TabUrbanisme } from '@/components/report/TabUrbanisme';
import { TabQuartier } from '@/components/report/TabQuartier';
import { TabOwner } from '@/components/report/TabOwner';
import { TabBatiment } from '@/components/report/TabBatiment';
import { SourceBadge } from '@/components/report/SourceBadge';

// --- IMPORTS DES LIBRAIRIES ---
import { fetchDVFReport, fetchMarketStatsStrict, TransactionDVF, BackendMarketStats } from '@/app/lib/dvf';
import { fetchWaterQuality } from '@/app/lib/eau';
import { fetchRisks } from '@/app/lib/georisques';
import { fetchUrbanisme } from '@/app/lib/urbanisme';
import { fetchQuartier } from '@/app/lib/quartier';
import { fetchDPE } from '@/app/lib/dpe';
import { fetchConnectivity } from '@/app/lib/arcep';
import { fetchBuildingData, codeInseeFromCleInterop, isValidCleInterop } from '@/app/lib/bndb';
import { formatDateFr, ReportSources, SourceKey, SourceInfo, sourceInfo } from '@/app/lib/sources';
import { BuildingData } from '@/app/lib/types';

const SECTIONS = [
  { id: 'synthese', label: 'Synthèse', keys: [] as SourceKey[] },
  { id: 'batiment', label: 'Bâtiment', keys: ['bdnb', 'dpe'] as SourceKey[] },
  { id: 'risques', label: 'Risques', keys: ['risques'] as SourceKey[] },
  { id: 'urbanisme', label: 'Urbanisme', keys: ['urbanisme'] as SourceKey[] },
  { id: 'quartier', label: 'Quartier', keys: ['quartier', 'eau', 'connectivite'] as SourceKey[] },
  { id: 'marche', label: 'Prix et ventes', keys: ['dvf'] as SourceKey[] },
  { id: 'analyse', label: 'Analyse', keys: [] as SourceKey[] },
  { id: 'histoire', label: 'Biographie', keys: [] as SourceKey[] },
  { id: 'proprietaire', label: 'Propriétaire', keys: [] as SourceKey[] },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const SHORT_NAMES: Record<SourceKey, string> = {
  bdnb: 'BDNB', dpe: 'ADEME', dvf: 'DVF', risques: 'Géorisques', urbanisme: 'PLU', quartier: 'Quartier', eau: 'Eau', connectivite: 'Arcep',
};

const ENRICHMENT_KEYS: SourceKey[] = ['risques', 'urbanisme', 'quartier', 'dvf', 'dpe', 'eau', 'connectivite'];

export default function ReportClient({ cleInterop }: { cleInterop: string }) {
  const router = useRouter();
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
  const [marketStats, setMarketStats] = useState<BackendMarketStats | null>(null);
  // Clé BAN validée avant tout appel (elle est injectée dans les requêtes BDNB / ADEME / Arcep)
  const validKey = isValidCleInterop(cleInterop);
  const [loading, setLoading] = useState(validKey);
  const [loadingDVF, setLoadingDVF] = useState(false);
  const [fetchError, setLoadError] = useState<string | null>(null);
  const loadError = validKey ? fetchError : "Identifiant d'adresse invalide.";

  useEffect(() => {
    if (!validKey) return;
    let cancelled = false;

    /** Mise à jour immuable d'une source (et éventuellement d'un champ du bâtiment). */
    const patch = (key: SourceKey, info: SourceInfo, fields: Partial<BuildingData> = {}) => {
      if (cancelled) return;
      setBuildingData(prev => prev && ({ ...prev, ...fields, sources: { ...prev.sources, [key]: info } }));
    };

    /** Exécute un connecteur : résultat → ok/empty, exception → error (« Données indisponibles »). */
    const track = async <T,>(
      key: SourceKey,
      run: () => Promise<T | null>,
      apply: (value: T) => { fields?: Partial<BuildingData>; info?: Partial<SourceInfo> },
    ): Promise<void> => {
      try {
        const value = await run();
        if (value === null || value === undefined) {
          patch(key, sourceInfo(key, 'empty'));
          return;
        }
        const { fields, info } = apply(value);
        patch(key, sourceInfo(key, info?.status ?? 'ok', info), fields);
      } catch (error) {
        console.error(`Source ${key} indisponible:`, error);
        patch(key, sourceInfo(key, 'error'));
      }
    };

    async function loadData() {
      setLoading(true);
      setLoadError(null);
      let batiment: BuildingData | null = null;
      try {
        batiment = await fetchBuildingData(cleInterop);
      } catch (error) {
        console.error('BDNB indisponible:', error);
        if (!cancelled) setLoadError('La base des bâtiments (BDNB) est momentanément indisponible.');
      }
      if (cancelled) return;

      if (!batiment) {
        setLoading(false);
        setLoadError(prev => prev ?? "Aucun bâtiment n'est rattaché à cette adresse dans la BDNB.");
        return;
      }

      const loadingSources: ReportSources = Object.fromEntries(
        ENRICHMENT_KEYS.map(k => [k, sourceInfo(k, batiment!.coords ? 'loading' : 'error')])
      );
      setBuildingData({
        ...batiment,
        sources: { bdnb: sourceInfo('bdnb', 'ok', { dataDate: batiment.raw_bdnb?.millesime ? `millésime ${batiment.raw_bdnb.millesime}` : undefined }), ...loadingSources },
      });
      setLoading(false);

      if (!batiment.coords) return;
      const { lat, lon } = batiment.coords;
      const codeInsee = codeInseeFromCleInterop(cleInterop);
      setLoadingDVF(true);

      await Promise.all([
        track('risques', () => fetchRisks(lat, lon, codeInsee), (r) => ({
          fields: { risques_detailles: r },
          info: {
            status: r.status === 'ok' ? 'ok' : r.status === 'partial' ? 'partial' : 'error',
            fetchedAt: r.fetched_at,
          },
        })),
        // fetchUrbanisme ne renvoie null qu'en cas d'échec complet
        track('urbanisme', async () => {
          const u = await fetchUrbanisme(lat, lon);
          if (!u) throw new Error("Géoportail de l'Urbanisme indisponible");
          return u;
        }, (u) => ({
          fields: { urbanisme: u },
          info: u.indisponibles?.length
            ? { status: 'partial', note: `couches indisponibles : ${u.indisponibles.join(', ')}` }
            : undefined,
        })),
        // fetchQuartier ne renvoie null qu'en cas d'échec : on le traduit en erreur
        track('quartier', async () => {
          const q = await fetchQuartier(lat, lon);
          if (!q) throw new Error('Overpass indisponible');
          return q;
        }, (q) => ({ fields: { quartier: q } })),
        track('dpe', () => fetchDPE(lat, lon, cleInterop), (dpe) => ({
          fields: { dpe_reel: dpe },
          info: { dataDate: formatDateFr(dpe.date_etablissement_dpe), note: dpe.match_label },
        })),
        track('eau', () => (codeInsee ? fetchWaterQuality(codeInsee) : Promise.resolve(null)), (eau) => ({
          fields: { eau_potable: eau },
          info: { dataDate: `prélèvement du ${formatDateFr(eau.date_prelevement)}` },
        })),
        track('connectivite', () => fetchConnectivity(lat, lon, cleInterop), (c) => ({
          fields: { connectivite: c },
          info: { status: c.fixe && c.mobile ? 'ok' : 'partial' },
        })),
        track('dvf', async () => {
          const [report, stats] = await Promise.all([
            fetchDVFReport(lat, lon, codeInsee),
            fetchMarketStatsStrict(lat, lon, undefined, codeInsee).catch(() => null),
          ]);
          if (!cancelled) {
            setDvfData(report.transactions);
            setMarketStats(stats);
          }
          return report.meta;
        }, (meta) => ({
          info: {
            status: meta.partial ? 'partial' : 'ok',
            fetchedAt: meta.fetched_at,
            dataDate: meta.millesimes.length
              ? `${Math.min(...meta.millesimes)}–${Math.max(...meta.millesimes)}`
              : 'aucun millésime publié',
          },
        })),
      ]);

      if (!cancelled) setLoadingDVF(false);
    }

    loadData();
    return () => { cancelled = true; };
  }, [cleInterop, validKey]);

  const sources = buildingData?.sources;

  // --- Sommaire : section visible à l'écran (scrollspy) ---
  const [current, setCurrent] = useState<SectionId>('synthese');
  useEffect(() => {
    if (!buildingData) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id as SectionId);
    }, { rootMargin: '-120px 0px -60% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [buildingData]);

  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* le lien reste dans la barre d'adresse */ }
  };

  const brickSources: BrickSource[] = (['bdnb', ...ENRICHMENT_KEYS] as SourceKey[]).map((k) => {
    const st = sources?.[k]?.status;
    return { key: k, label: SHORT_NAMES[k], state: !st || st === 'loading' ? 'loading' : st === 'error' ? 'error' : 'done' };
  });
  const stillLoading = loading || brickSources.some((b) => b.state === 'loading');
  const generatedOn = new Date().toLocaleDateString('fr-FR');

  const dotFor = (keys: SourceKey[]): string => {
    const sts = keys.map((k) => sources?.[k]?.status);
    if (sts.some((x) => x === 'loading' || x === undefined)) return 'bg-trait-fort';
    if (sts.every((x) => x === 'error' || x === 'empty')) return 'bg-inconnu';
    if (sts.some((x) => x === 'error' || x === 'partial')) return 'bg-vigil';
    return 'bg-ok';
  };

  return (
    <div className="min-h-screen bg-papier text-texte print:bg-white">
      <SiteHeader>
        <AddressAutocomplete size="sm" buttonLabel="" placeholder="Autre adresse" label="Rechercher une autre adresse" onSelect={(f) => router.push(`/report/${encodeURIComponent(f.properties.id)}`)} />
      </SiteHeader>

      <main id="contenu" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 print:py-0">
        {/* EN-TÊTE DU PASSEPORT */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="grid gap-2 min-w-0">
            <span className="label">Passeport du logement · généré le {generatedOn}</span>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {buildingData?.adresse_ban || (loading ? "Chargement de l'adresse…" : 'Rapport immobilier')}
            </h1>
            <span className="font-mono text-xs text-texte-2 break-all">Dossier {cleInterop}</span>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button type="button" onClick={share} className="btn btn-secondary" aria-live="polite">
              {copied ? <Check size={16} aria-hidden /> : <Share2 size={16} aria-hidden />} {copied ? 'Lien copié' : 'Partager'}
            </button>
            <button type="button" onClick={() => window.print()} disabled={loading || !buildingData} className="btn btn-secondary">
              <Download size={16} aria-hidden /> Exporter en PDF
            </button>
            <Link href="/properties/add" className="btn btn-primary">C&apos;est mon logement</Link>
          </div>
        </div>

        {loadError && (
          <div className="mb-8 p-4 bg-alerte-soft border-l-4 border-alerte rounded-sm" role="alert">
            <p className="font-bold">{loadError}</p>
            <SourceBadge source={sources?.bdnb ?? sourceInfo('bdnb', 'error')} className="mt-2" />
          </div>
        )}

        {stillLoading && !loadError && (
          <div className="mb-8 no-print"><BrickLoader sources={brickSources} /></div>
        )}

        {buildingData && (
          <>
            {/* Sommaire mobile : pastilles défilantes */}
            <nav aria-label="Sommaire du rapport" className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 bg-papier/95 backdrop-blur border-b border-trait mb-6 overflow-x-auto no-print">
              <ul className="flex gap-2 w-max">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} aria-current={current === s.id ? 'true' : undefined}
                      className={`inline-flex items-center min-h-[36px] px-3 rounded-full border text-sm whitespace-nowrap ${current === s.id ? 'bg-texte text-papier border-texte font-bold' : 'border-trait-fort bg-surface'}`}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid lg:grid-cols-[210px_minmax(0,1fr)] gap-8">
              {/* Sommaire ordinateur : collant à gauche */}
              <nav aria-label="Sommaire du rapport" className="hidden lg:block no-print">
                <ul className="sticky top-24 grid gap-0.5 text-sm">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} aria-current={current === s.id ? 'true' : undefined}
                        className={`flex items-center justify-between gap-2 px-3 min-h-[38px] rounded-md border-l-[3px] ${current === s.id ? 'bg-surface border-brique font-bold text-texte' : 'border-transparent text-texte-2 hover:text-texte'}`}>
                        {s.label}
                        {s.keys.length > 0 && <span aria-hidden className={`w-2.5 h-2.5 rounded-full ${dotFor(s.keys)}`} />}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="grid gap-14 min-w-0">
                <section id="synthese" aria-labelledby="synthese-titre" className="scroll-mt-32 grid gap-6">
                  <h2 id="synthese-titre" className="sr-only">Synthèse</h2>
                  <ReportSummary data={buildingData} marketStats={marketStats} />
                  <TabSynthese data={buildingData} dvf={dvfData} loading={loading} />
                </section>

                <ReportSection id="batiment" title="Bâtiment" term="bdnb" meta={<SourceMeta s={sources?.bdnb} />}>
                  <div className="grid gap-6">
                    {buildingData.coords && (
                      <div className="card overflow-hidden h-[340px] md:h-[420px] no-print">
                        <Building3D
                          lat={buildingData.coords.lat}
                          lon={buildingData.coords.lon}
                          hints={{
                            hauteur: buildingData.hauteur,
                            nb_niveaux: buildingData.nb_niveaux,
                            surface_sol: buildingData.surface_sol,
                            materiaux_murs: buildingData.materiaux_murs,
                            materiaux_toiture: buildingData.materiaux_toiture,
                          }}
                          className="h-full"
                          label={`Maquette 3D du bâtiment situé ${buildingData.adresse_ban ?? 'à cette adresse'}`}
                        />
                      </div>
                    )}
                    <TabBatiment data={{ ...buildingData.dpe_reel?.raw, ...buildingData.raw_bdnb, dpe_reel: buildingData.dpe_reel }} sources={{ bdnb: sources?.bdnb, dpe: sources?.dpe }} />
                  </div>
                </ReportSection>

                <ReportSection id="risques" title="Risques" term="alea" meta={<SourceMeta s={sources?.risques} />}>
                  <TabRisks data={buildingData} />
                </ReportSection>

                <ReportSection id="urbanisme" title="Urbanisme" term="plu" meta={<SourceMeta s={sources?.urbanisme} />}>
                  <TabUrbanisme data={buildingData} />
                </ReportSection>

                <ReportSection id="quartier" title="Quartier et réseaux" meta={<SourceMeta s={sources?.quartier} />}>
                  <TabQuartier data={buildingData} />
                </ReportSection>

                <ReportSection id="marche" title="Prix et ventes" term="dvf" meta={<SourceMeta s={sources?.dvf} />}>
                  <TabDVF transactions={dvfData} loading={loadingDVF && sources?.dvf?.status === 'loading'} marketStats={marketStats} surface={buildingData.dpe_reel?.surface_habitable_logement} surface_terrain={buildingData.raw_bdnb?.surface_terrain} source={sources?.dvf} />
                </ReportSection>

                <ReportSection id="analyse" title="Analyse croisée">
                  <TabAnalyse data={buildingData} dvf={dvfData} />
                </ReportSection>

                <ReportSection id="histoire" title="Biographie du logement">
                  <Biographie data={buildingData} dvf={dvfData} />
                </ReportSection>

                <ReportSection id="proprietaire" title="Propriétaire">
                  <TabOwner />
                </ReportSection>

                <p className="text-xs text-texte-2 font-mono border-t border-trait pt-4">
                  Rapport généré le {generatedOn} à partir de données publiques. La source et la date de chaque bloc sont indiquées sous celui-ci. Une rubrique « Non évalué » signifie que la source n&apos;a pas répondu, pas qu&apos;il n&apos;y a rien à signaler.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function SourceMeta({ s }: { s?: SourceInfo }) {
  if (!s) return null;
  const status = s.status === 'loading' ? 'chargement…' : s.status === 'error' ? 'indisponible' : s.status === 'partial' ? 'partiel' : s.status === 'empty' ? 'aucune donnée' : null;
  return <span>{s.name}{s.dataDate ? ` · ${s.dataDate}` : ''}{status ? ` · ${status}` : ''}</span>;
}
