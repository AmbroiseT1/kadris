"use client";

import React, { use, useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Shield, TrendingUp, AlertTriangle, Lock, BrainCircuit, Scroll, ShoppingBag, Database, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import proj4 from 'proj4';

// --- IMPORTS DES COMPOSANTS ---
import { TabSynthese } from '@/components/report/TabSynthese';
import { TabAnalysis } from '@/components/report/TabAnalysis';
import { TabDVF } from '@/components/report/TabDVF';
import { TabRisks } from '@/components/report/TabRisks';
import { TabUrbanisme } from '@/components/report/TabUrbanisme';
import { TabQuartier } from '@/components/report/TabQuartier';
import { TabOwner } from '@/components/report/TabOwner';
import { TabBatiment } from '@/components/report/TabBatiment';

// --- IMPORTS DES LIBRAIRIES ---
import { fetchDVF, TransactionDVF } from '../../lib/dvf';
import { fetchWaterQuality } from '../../lib/eau';
import { fetchRisks } from '../../lib/georisques';
import { fetchUrbanisme } from '../../lib/urbanisme';
import { fetchQuartier } from '../../lib/quartier';
import { fetchDPE } from '../../lib/dpe';
import { fetchConnectivity } from '../../lib/arcep';
import { BuildingData } from '@/app/lib/types';

// --- CONSTANTES ---
const LAMBERT_93 = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const WGS_84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

// --- LOGIQUE DE CHARGEMENT ---
async function fetchBuildingData(cleInterop: string): Promise<BuildingData | null> {
  if (!cleInterop) return null;
  try {
    const url = `https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse?limit=1&cle_interop_adr=eq.${cleInterop}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.length > 0) {
      const bat = data[0];
      let coords = null;
      if (bat.geom_groupe?.coordinates?.[0]?.[0]?.[0]) {
        const point = bat.geom_groupe.coordinates[0][0][0];
        if (point[0] > 180) {
          const p = proj4(LAMBERT_93, WGS_84, point);
          coords = { lon: p[0], lat: p[1] };
        } else {
          coords = { lon: point[0], lat: point[1] };
        }
      }

      const anneeFiscale = bat.annee_construction ? parseInt(bat.annee_construction) : null;
      const anneeReelle = bat.annee_construction_reelle_t ? parseInt(bat.annee_construction_reelle_t) : null;
      const anneeDPE = bat.annee_construction_dpe ? parseInt(bat.annee_construction_dpe) : null;
      let anneeFinale = "Non daté";
      const datesValides = [anneeFiscale, anneeReelle, anneeDPE].filter(d => d !== null && !isNaN(d) && d > 1000) as number[];

      if (datesValides.length > 0) anneeFinale = Math.min(...datesValides).toString();
      else if (bat.periode_construction_max) anneeFinale = `Période ${bat.periode_construction_max}`;

      return {
        adresse_ban: bat.libelle_adr_principale_ban,
        annee_construction: anneeFinale,
        dpe_lettre: bat.classe_bilan_dpe || bat.classe_bilan_dpe_moyen || "Non noté",
        materiaux_murs: bat.mat_mur_txt || "Non renseigné",
        materiaux_toiture: bat.mat_toit_txt || "Non renseigné",
        hauteur: bat.hauteur_mean,
        nb_niveaux: bat.nb_niveau,
        surface_sol: bat.surface_emprise_sol,
        altitude: bat.altitude_sol_mean,
        nb_logements: bat.nb_log,
        usage: bat.usage_niveau_1_txt || "Non déterminé",
        fiabilite: bat.fiabilite_cr_adr_niv_1?.includes("fiables") ? "Haute" : "Moyenne",
        coords: coords || undefined,
        raw_bdnb: bat
      };
    }
    return null;
  } catch (error) {
    console.error("Crash BDNB:", error);
    return null;
  }
}

// --- PAGE PRINCIPALE ---
export default function ReportPage({ params }: { params: Promise<{ cityCode: string }> }) {
  const { cityCode } = use(params);
  const [activeTab, setActiveTab] = useState<'synthese' | 'analysis' | 'urba' | 'quartier' | 'dvf' | 'risks' | 'owner' | 'batiment'>('synthese');
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDVF, setLoadingDVF] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const batiment = await fetchBuildingData(cityCode);
      setBuildingData(batiment);
      setLoading(false);

      if (batiment && batiment.coords) {
        setLoadingDVF(true);

        // Extraction du code INSEE (5 premiers caractères de la clé d'interop)
        const codeInsee = cityCode.substring(0, 5);

        const [ventes, risques, urba, quartier, dpe, eau, connectivite] = await Promise.all([
          fetchDVF(batiment.coords.lat, batiment.coords.lon),
          fetchRisks(batiment.coords.lat, batiment.coords.lon),
          fetchUrbanisme(batiment.coords.lat, batiment.coords.lon),
          fetchQuartier(batiment.coords.lat, batiment.coords.lon),
          fetchDPE(batiment.coords.lat, batiment.coords.lon),
          fetchWaterQuality(codeInsee),
          fetchConnectivity(batiment.coords.lat, batiment.coords.lon, cityCode)
        ]);

        setDvfData(ventes);
        if (risques) batiment.risques_detailles = risques;
        if (urba) batiment.urbanisme = urba;
        if (quartier) batiment.quartier = quartier;
        if (dpe) batiment.dpe_reel = dpe;
        if (eau) batiment.eau_potable = eau;
        if (connectivite) batiment.connectivite = connectivite;

        setLoadingDVF(false);
      }
    }
    if (cityCode) loadData();
  }, [cityCode]);

  return (
    <div className="min-h-screen bg-kadris-cream font-sans text-kadris-slate pb-20">

      {/* HEADER STYLE NOTAIRE */}
      <header className="bg-white border-b border-kadris-slate/10 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-kadris-slate text-sm uppercase tracking-wider hover:text-kadris-terracotta transition-colors">
              <ArrowLeft size={16} /> Retour
            </Link>
            <div className="h-6 w-px bg-kadris-slate/10 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2 text-sm text-kadris-slate/60">
              <FileText size={14} />
              <span className="font-mono">Dossier : {cityCode}</span>
            </div>
          </div>
          <button className="bg-kadris-slate text-white px-5 py-2 rounded-sm text-sm font-bold uppercase tracking-wide hover:bg-kadris-slate/90 shadow-sm flex items-center gap-2">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-kadris-slate mb-2">
            {buildingData?.adresse_ban || "Chargement de l'adresse..."}
          </h1>
          <p className="text-kadris-slate/60 text-lg font-light">Passeport Immobilier & Audit Technique</p>
        </div>

        {/* NAVIGATION ONGLETS STYLE DOSSIER */}
        <div className="mb-8 border-b border-kadris-slate/10">
          <div className="flex flex-wrap gap-8">
            {[
              { id: 'synthese', label: 'Synthèse', icon: MapPin },
              { id: 'analysis', label: 'Analyse IA', icon: BrainCircuit },
              { id: 'batiment', label: 'Bâtiment', icon: Database },
              { id: 'urba', label: 'Urbanisme', icon: Scroll },
              { id: 'quartier', label: 'Quartier', icon: ShoppingBag },
              { id: 'dvf', label: 'Prix & DVF', icon: TrendingUp },
              { id: 'risks', label: 'Risques', icon: AlertTriangle },
              { id: 'owner', label: 'Propriétaire', icon: Lock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === tab.id ? 'border-kadris-terracotta text-kadris-terracotta' : 'border-transparent text-kadris-slate/40 hover:text-kadris-slate hover:border-kadris-slate/20'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'synthese' && <TabSynthese data={buildingData} dvf={dvfData} loading={loading} />}
          {activeTab === 'analysis' && <TabAnalysis data={buildingData} dvf={dvfData} />}
          {activeTab === 'batiment' && <TabBatiment data={{ ...buildingData?.raw_bdnb, dpe_reel: buildingData?.dpe_reel }} />}
          {activeTab === 'urba' && <TabUrbanisme data={buildingData} />}
          {activeTab === 'quartier' && <TabQuartier data={buildingData} />}
          {activeTab === 'dvf' && <TabDVF transactions={dvfData} loading={loadingDVF} surface={buildingData?.surface_sol} surface_terrain={buildingData?.raw_bdnb?.surface_terrain} />}
          {activeTab === 'risks' && <TabRisks data={buildingData} />}
          {activeTab === 'owner' && <TabOwner />}
        </div>

      </main>
    </div>
  );
}