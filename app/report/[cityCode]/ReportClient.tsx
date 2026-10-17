"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Lock, Sparkles, Scroll, ShoppingBag, Database, FileText, Download } from 'lucide-react';
import Link from 'next/link';

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

const TABS = [
  { id: 'synthese', label: 'Synthèse', icon: MapPin },
  { id: 'batiment', label: 'Bâtiment', icon: Database },
  { id: 'quartier', label: 'Quartier', icon: ShoppingBag },
  { id: 'risks', label: 'Risques', icon: AlertTriangle },
  { id: 'urba', label: 'Urbanisme', icon: Scroll },
  { id: 'dvf', label: 'Prix & DVF', icon: TrendingUp },
  { id: 'analyse', label: 'Analyse', icon: Sparkles },
  { id: 'owner', label: 'Propriétaire', icon: Lock },
] as const;

type TabId = typeof TABS[number]['id'];

const ENRICHMENT_KEYS: SourceKey[] = ['risques', 'urbanisme', 'quartier', 'dvf', 'dpe', 'eau', 'connectivite'];

export default function ReportClient({ cleInterop }: { cleInterop: string }) {
  const [activeTab, setActiveTab] = useState<TabId>('synthese');
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
  const [marketStats, setMarketStats] = useState<BackendMarketStats | null>(null);
  // Clé BAN validée avant tout appel (elle est injectée dans les requêtes BDNB / ADEME / Arcep)
  const validKey = isValidCleInterop(cleInterop);
  const [loading, setLoading] = useState(validKey);
  const [loadingDVF, setLoadingDVF] = useState(false);
  const [fetchError, setLoadError] = useState<string | null>(null);
  const loadError = validKey ? fetchError : "Identifiant d'adresse invalide.";
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  // --- Onglets accessibles : flèches gauche/droite, Début/Fin ---
  const onTabKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const id = TABS[next].id;
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  }, []);

  const sources = buildingData?.sources;

  return (
    <div className="min-h-screen bg-bricq-cream font-sans text-bricq-slate pb-20 print:bg-white print:pb-0">
      <style>{`@media print { @page { margin: 12mm; } .animate-in { animation: none !important; } }`}</style>

      {/* HEADER STYLE NOTAIRE */}
      <header className="bg-white border-b border-bricq-slate/10 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bricq-logo.png" alt="Bricq Logo" className="w-6 h-6 object-contain mix-blend-multiply" />
              <span className="font-serif font-bold text-lg text-bricq-slate tracking-tighter">Bricq</span>
            </Link>
            <div className="h-6 w-px bg-bricq-slate/10 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2 text-sm text-bricq-slate/60">
              <FileText size={14} aria-hidden />
              <span className="font-mono">Dossier : {cleInterop}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || !buildingData}
            className="bg-bricq-slate text-white px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wide hover:bg-bricq-slate/90 shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} aria-hidden /> Export PDF
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 print:py-0">
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-bricq-slate mb-2">
            {buildingData?.adresse_ban || (loading ? "Chargement de l'adresse..." : 'Rapport immobilier')}
          </h1>
          <p className="text-bricq-slate/60 text-lg font-light">Passeport Immobilier & Audit Technique</p>
          <p className="hidden print:block text-xs text-slate-500 mt-2">
            Rapport généré le {new Date().toLocaleDateString('fr-FR')} — onglet « {TABS.find(t => t.id === activeTab)?.label} ». Données publiques : voir la source indiquée sous chaque bloc.
          </p>
        </div>

        {loadError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-800 rounded-sm" role="alert">
            {loadError}
            <SourceBadge source={sources?.bdnb ?? sourceInfo('bdnb', 'error')} className="mt-2" />
          </div>
        )}

        {/* NAVIGATION ONGLETS STYLE DOSSIER */}
        <div className="mb-8 border-b border-bricq-slate/10 print:hidden">
          <div role="tablist" aria-label="Sections du rapport" className="flex flex-wrap gap-8">
            {TABS.map((tab, index) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                  className={`flex items-center gap-2 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-bricq-terracotta ${selected ? 'border-bricq-terracotta text-bricq-terracotta' : 'border-transparent text-bricq-slate/40 hover:text-bricq-slate hover:border-bricq-slate/20'}`}
                >
                  <tab.icon size={16} aria-hidden /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500 focus:outline-none"
        >
          {activeTab === 'synthese' && <TabSynthese data={buildingData} dvf={dvfData} loading={loading} />}
          {activeTab === 'batiment' && <TabBatiment data={buildingData ? { ...buildingData.dpe_reel?.raw, ...buildingData.raw_bdnb, dpe_reel: buildingData.dpe_reel } : null} sources={{ bdnb: sources?.bdnb, dpe: sources?.dpe }} />}
          {activeTab === 'quartier' && <TabQuartier data={buildingData} />}
          {activeTab === 'risks' && <TabRisks data={buildingData} />}
          {activeTab === 'urba' && <TabUrbanisme data={buildingData} />}
          {activeTab === 'dvf' && <TabDVF transactions={dvfData} loading={loadingDVF && sources?.dvf?.status === 'loading'} marketStats={marketStats} surface={buildingData?.dpe_reel?.surface_habitable_logement} surface_terrain={buildingData?.raw_bdnb?.surface_terrain} source={sources?.dvf} />}
          {activeTab === 'analyse' && <TabAnalyse data={buildingData} dvf={dvfData} />}
          {activeTab === 'owner' && <TabOwner />}
        </div>

      </main>
    </div>
  );
}
