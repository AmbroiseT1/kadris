"use client";

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Building2, FileCheck2, HardHat, KeyRound, Search, ShieldCheck } from 'lucide-react';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import Fact from '@/components/ui/Fact';
import DpeLabel from '@/components/ui/DpeLabel';
import StatusChip from '@/components/ui/StatusChip';
import Reveal from '@/components/motion/Reveal';
import PlanTrace from '@/components/motion/PlanTrace';
import { useBrickNavigate } from '@/components/motion/useBrickNavigate';
import { useAuth } from '@/app/context/AuthContext';

const Building3D = dynamic(() => import('@/components/building3d/Building3D'), { ssr: false, loading: () => <PlanTrace /> });

const SOURCES = [
  { nom: 'BDNB', quoi: 'Bâtiment, matériaux, hauteur' },
  { nom: 'ADEME', quoi: 'Diagnostics de performance énergétique' },
  { nom: 'DVF', quoi: 'Ventes immobilières des dernières années' },
  { nom: 'Géorisques', quoi: 'Inondation, argiles, radon, séismes' },
  { nom: 'Géoportail de l’urbanisme', quoi: 'Zonage PLU et servitudes' },
  { nom: 'IGN', quoi: 'Forme du bâtiment et parcelle' },
  { nom: 'Arcep', quoi: 'Fibre et réseau mobile' },
  { nom: 'Hub’Eau', quoi: 'Qualité de l’eau potable' },
];

const PROFILS = [
  {
    id: 'rapport',
    icon: Search,
    titre: 'Vous achetez',
    texte: 'Avant de visiter ou de signer, lisez ce que les données publiques disent du bâtiment : énergie, risques, prix des ventes voisines, règles d’urbanisme.',
    lien: { href: '#recherche', label: 'Chercher une adresse' },
  },
  {
    id: 'proprietaire',
    icon: HardHat,
    titre: 'Vous possédez',
    texte: 'Tenez le carnet de santé du logement : travaux, factures, charges et rappels d’entretien, rangés au même endroit et visibles sur la maquette 3D.',
    lien: { href: '/register', label: 'Créer mon espace' },
  },
  {
    id: 'vendre',
    icon: KeyRound,
    titre: 'Vous vendez',
    texte: 'Transmettez un passeport complet à l’acheteur : l’historique des travaux et les justificatifs rassurent et évitent les questions de dernière minute.',
    lien: { href: '/register', label: 'Préparer mon passeport' },
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { navigate, overlay } = useBrickNavigate();

  return (
    <div className="min-h-screen bg-papier text-texte">
      <SiteHeader />

      <main id="contenu">
        {/* ACCUEIL */}
        <section className="relative overflow-hidden border-b border-trait">
          <div aria-hidden className="absolute inset-0 motif-briques opacity-60" />
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-24 md:pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 items-center">
            <div className="grid grid-cols-1 gap-6 min-w-0" id="recherche">
              <span className="label">Passeport du logement</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
                Tout ce que les données publiques savent de votre logement.
              </h1>
              <p className="text-lg text-texte-2 max-w-xl">
                Saisissez une adresse : Bricq rassemble l’énergie, les risques, l’urbanisme, les ventes voisines et la forme réelle du bâtiment dans un seul rapport, gratuit et sourcé.
              </p>
              <AddressAutocomplete onSelect={(f) => navigate(`/report/${encodeURIComponent(f.properties.id)}`)} />
              <p className="text-sm text-texte-2">Gratuit, sans compte. Chaque information indique sa source et sa date.</p>
            </div>

            {/* Aperçu d'un rapport */}
            <Reveal className="card p-5 sm:p-6 grid gap-5 shadow-overlay" delay={120}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="label">Exemple de rapport</span>
                  <p className="font-display text-xl font-bold mt-1">12 rue des Tanneurs, Lille</p>
                </div>
                <StatusChip status="vigil">2 points à vérifier</StatusChip>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Fact label="Construction" value="1932" source="BDNB" />
                <Fact label="Énergie" value={<DpeLabel classe="E" compact />} status="vigil" statusLabel="Classe E" source="ADEME" term="dpe" />
                <Fact label="Retrait des argiles" value="Moyen" status="vigil" statusLabel="À surveiller" source="Géorisques" term="argiles" />
                <Fact label="Prix médian" value="3 180" unit="€/m²" source="DVF" term="dvf" />
              </div>
              <p className="text-xs text-texte-2 font-mono border-t border-trait pt-3">Données d’exemple. Les vôtres s’afficheront à partir de votre adresse.</p>
            </Reveal>
          </div>
        </section>

        {/* SOURCES */}
        <section aria-labelledby="sources-titre" className="bg-surface border-b border-trait">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10 grid gap-6">
            <h2 id="sources-titre" className="label">Sources publiques interrogées à chaque rapport</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              {SOURCES.map((s) => (
                <li key={s.nom} className="grid gap-0.5">
                  <span className="font-display font-bold">{s.nom}</span>
                  <span className="text-sm text-texte-2">{s.quoi}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PROFILS */}
        <section aria-labelledby="profils-titre" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid gap-10">
          <div className="grid gap-3 max-w-2xl">
            <span className="label">Pour qui</span>
            <h2 id="profils-titre" className="text-3xl md:text-4xl font-extrabold">Un même dossier, du compromis à la revente.</h2>
          </div>
          <ul className="grid md:grid-cols-3 gap-5">
            {PROFILS.map(({ id, icon: Icon, titre, texte, lien }, i) => (
              <Reveal as="li" key={id} delay={i * 90} className="card p-6 grid gap-4 content-start scroll-mt-24">
                <span id={id} className="w-11 h-11 rounded-md bg-encre-soft text-encre grid place-items-center"><Icon size={22} aria-hidden /></span>
                <h3 className="text-xl font-bold">{titre}</h3>
                <p className="text-texte-2">{texte}</p>
                <Link href={lien.href} className="inline-flex items-center gap-1.5 font-bold text-encre underline underline-offset-4 mt-auto">
                  {lien.label} <ArrowRight size={16} aria-hidden />
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* COUPE DU BÂTIMENT */}
        <section aria-labelledby="coupe-titre" className="bg-encre text-papier">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="grid gap-5">
              <span className="label text-papier/70">Le rapport en coupe</span>
              <h2 id="coupe-titre" className="text-3xl md:text-4xl font-extrabold text-papier">Du sol au toit, chaque couche a sa source.</h2>
              <p className="text-papier/80 text-lg">
                Le rapport se lit comme une coupe de bâtiment : le terrain et ses risques, les murs et leur énergie, le quartier autour, puis l’histoire des ventes. Une information manquante est signalée comme telle, jamais présentée comme une bonne nouvelle.
              </p>
            </div>
            <ol className="grid gap-2 font-mono text-sm">
              {[
                ['Toit et volume', 'IGN BD TOPO, BDNB'],
                ['Murs et énergie', 'ADEME, BDNB'],
                ['Règles de construction', 'Géoportail de l’urbanisme'],
                ['Terrain et risques', 'Géorisques'],
                ['Ventes voisines', 'DVF'],
              ].map(([couche, src], i) => (
                <Reveal as="li" key={couche} delay={i * 80} className="flex items-center justify-between gap-4 px-4 min-h-[52px] rounded-sm bg-white/8 border-l-4 border-brique">
                  <span className="font-sans font-bold text-base">{couche}</span>
                  <span className="text-papier/70 text-right">{src}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ESPACE PROPRIÉTAIRE */}
        <section aria-labelledby="espace-titre" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 items-center">
          <div className="grid gap-5">
            <span className="label">Espace propriétaire</span>
            <h2 id="espace-titre" className="text-3xl md:text-4xl font-extrabold">Le carnet de santé de votre maison, en 3D.</h2>
            <p className="text-lg text-texte-2">
              Votre logement est modélisé à partir de sa forme réelle (IGN) et de sa hauteur (BDNB). Chaque zone prend la couleur de son état : entretenue, à surveiller, à traiter.
            </p>
            <ul className="grid gap-3">
              {[
                [FileCheck2, 'Factures et diagnostics lus automatiquement et rangés'],
                [HardHat, 'Historique des travaux et rappels d’entretien'],
                [ShieldCheck, 'Données privées, partagées seulement si vous le décidez'],
              ].map(([Icon, txt]) => {
                const I = Icon as typeof FileCheck2;
                return (
                  <li key={txt as string} className="flex items-start gap-3"><I size={20} className="text-brique mt-0.5 shrink-0" aria-hidden /> {txt as string}</li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">
                {isAuthenticated ? 'Ouvrir mon espace' : 'Créer mon espace'}
              </Link>
              {!isAuthenticated && <Link href="/login" className="btn btn-secondary">Se connecter</Link>}
            </div>
          </div>
          <div className="card overflow-hidden h-[340px] md:h-[420px]">
            <Building3D sample mode="etat" states={{ murs: 'ok', toit: 'vigil' }} className="h-full" label="Exemple de maquette 3D colorée selon l'état d'entretien" />
          </div>
        </section>

        {/* PROFESSIONNELS */}
        <section id="professionnels" aria-labelledby="pros-titre" className="bg-surface border-y border-trait scroll-mt-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-[minmax(0,1fr)_auto] gap-8 items-center">
            <div className="grid gap-3 max-w-2xl">
              <span className="label">Professionnels</span>
              <h2 id="pros-titre" className="text-2xl md:text-3xl font-extrabold">Notaires, agents, diagnostiqueurs, syndics.</h2>
              <p className="text-texte-2">Remettez à vos clients un passeport du logement complet et sourcé, à leur nom. Les données publiques sont prêtes, ils ajoutent le reste.</p>
            </div>
            <a href="mailto:contact@bricq.fr" className="btn btn-encre"><Building2 size={18} aria-hidden /> Nous contacter</a>
          </div>
        </section>
      </main>

      <SiteFooter />
      {overlay}
    </div>
  );
}
