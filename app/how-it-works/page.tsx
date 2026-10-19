"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, CircleSlash, FileCheck2, KeyRound, Lock, Search, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import SiteHeader from '@/components/ui/SiteHeader';
import SiteFooter from '@/components/ui/SiteFooter';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import StatusChip from '@/components/ui/StatusChip';
import Reveal from '@/components/motion/Reveal';
import { useBrickNavigate } from '@/components/motion/useBrickNavigate';

/* Le mur des sources : une brique par base publique, posée rangée par rangée. */
const MUR: { nom: string; quoi: string }[][] = [
  [{ nom: 'IGN', quoi: 'forme du bâtiment' }, { nom: 'Cadastre', quoi: 'parcelle' }, { nom: 'BDNB', quoi: 'bâti, hauteur' }],
  [{ nom: 'ADEME', quoi: 'DPE' }, { nom: 'Géorisques', quoi: 'risques' }, { nom: 'PLU', quoi: 'urbanisme' }, { nom: 'DVF', quoi: 'ventes' }],
  [{ nom: 'Arcep', quoi: 'fibre, mobile' }, { nom: "Hub'Eau", quoi: 'eau potable' }, { nom: 'OSM', quoi: 'commerces, écoles' }],
];

const ETAPES = [
  { n: '01', titre: 'Vous tapez une adresse.', texte: "La Base Adresse Nationale la reconnaît et nous donne son identifiant officiel. Pas de compte, pas d'e-mail." },
  { n: '02', titre: 'On interroge les sources.', texte: "En parallèle, directement chez chaque organisme public. Chaque réponse arrive avec sa date. Une source qui ne répond pas est marquée comme telle." },
  { n: '03', titre: 'Vous lisez un rapport.', texte: "Une page, un sommaire, une phrase de synthèse en haut. Chaque bloc dit d'où il vient. Vous pouvez le partager ou l'imprimer." },
];

type Couche = { id: string; nom: string; hauteur: string; lit: string[]; source: string; limite: string };
const COUCHES: Couche[] = [
  {
    id: 'toit', nom: 'Toit et volume', hauteur: 'h = 9 à 12 m',
    lit: ['Contour au sol du bâtiment', 'Hauteur, nombre de niveaux', 'Matériaux de toiture'],
    source: 'IGN BD TOPO, BDNB',
    limite: "La forme du toit est déduite des matériaux. Ce n'est pas un relevé : les lucarnes, cheminées ou vérandas n'apparaissent pas.",
  },
  {
    id: 'murs', nom: 'Murs et énergie', hauteur: 'h = 3 à 9 m',
    lit: ['Classe énergie (DPE) et émissions', 'Matériaux des murs', 'Année de construction'],
    source: 'ADEME, BDNB',
    limite: "Le DPE affiché est celui déposé pour ce bâtiment. S'il n'y en a pas, on le dit, on ne l'invente pas.",
  },
  {
    id: 'regles', nom: 'Règles de construction', hauteur: 'h = 0 m',
    lit: ['Zone du PLU', 'Servitudes (monuments, réseaux)', 'Constructibilité indicative'],
    source: "Géoportail de l'urbanisme",
    limite: "Indicatif. Pour un projet de travaux, seule la mairie fait foi.",
  },
  {
    id: 'sol', nom: 'Terrain et risques', hauteur: 'h = sous le sol',
    lit: ['Retrait-gonflement des argiles', 'Inondation, séisme, radon', 'Sites pollués, installations classées'],
    source: 'Géorisques',
    limite: "Un aléa est une probabilité, pas un dommage constaté. Il ne remplace pas l'état des risques officiel, que le rapport vous permet de télécharger.",
  },
  {
    id: 'marche', nom: 'Ventes voisines', hauteur: 'autour',
    lit: ['Ventes réelles à proximité', 'Prix médian au m²', 'Ventes passées de ce bâtiment'],
    source: 'DVF (DGFiP)',
    limite: "Ce sont des prix de vente passés, pas une estimation. Les ventes les plus récentes arrivent avec plusieurs mois de décalage.",
  },
];

const PAS = [
  { titre: "Ce n'est pas une expertise.", texte: "Bricq rassemble ce que l'État publie. Personne ne s'est déplacé chez vous." },
  { titre: "Ce n'est pas un diagnostic officiel.", texte: "Pour vendre, les diagnostics obligatoires restent obligatoires. Bricq vous aide à les ranger." },
  { titre: "« Non évalué » ne veut pas dire « rien à signaler ».", texte: "Quand une source ne répond pas, la rubrique est hachurée en gris. Jamais en vert." },
  { titre: "La maquette 3D est une reconstitution.", texte: "Elle sert à se repérer, pas à mesurer." },
];

const FAQ = [
  { q: "C'est gratuit ?", r: "Oui, le rapport est gratuit et sans compte. L'espace propriétaire aussi." },
  { q: "D'où viennent les données ?", r: "Uniquement de bases publiques ouvertes : IGN, cadastre, BDNB (CSTB), ADEME, DGFiP (DVF), Géorisques, Géoportail de l'urbanisme, Arcep, Hub'Eau et OpenStreetMap. Chaque bloc du rapport cite la sienne." },
  { q: "Mon adresse est-elle enregistrée ?", r: "Pas pour un rapport consulté sans compte : nous ne la conservons pas. Elle n'est enregistrée que si vous ajoutez votre logement dans l'espace propriétaire." },
  { q: "Une information est fausse, je fais quoi ?", r: "Elle est fausse à la source. Écrivez-nous à contact@bricq.fr avec l'adresse : on vous dit à quel organisme la signaler." },
  { q: "Pourquoi ma maison n'a pas la bonne forme en 3D ?", r: "Si le contour IGN n'est pas disponible, on affiche un volume approximatif à partir de la surface et de la hauteur. La légende sous la maquette l'indique." },
];

export default function HowItWorksPage() {
  const { navigate, overlay } = useBrickNavigate();
  const [couche, setCouche] = useState<string>('toit');
  const active = COUCHES.find((c) => c.id === couche) ?? COUCHES[0];

  return (
    <div className="min-h-screen bg-papier text-texte">
      <SiteHeader />

      <main id="contenu">
        {/* 1. EN UNE PHRASE */}
        <section className="relative overflow-hidden border-b border-trait">
          <div aria-hidden className="absolute inset-0 motif-briques opacity-50" />
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-1 gap-6 min-w-0">
              <span className="label">Méthode et sources</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05]">
                Une adresse.<br />Dix sources publiques.<br /><span className="text-brique">Un rapport.</span>
              </h1>
              <p className="text-lg text-texte-2 max-w-lg">
                Tout ce que l&apos;État publie sur un logement existe déjà, mais en dix endroits. Bricq va le chercher pour vous, le range et vous dit d&apos;où vient chaque ligne.
              </p>
            </div>

            {/* Le mur des sources */}
            <figure aria-label="Les sources publiques interrogées, empilées comme un mur" className="grid gap-2 min-w-0">
              {MUR.map((rangee, r) => (
                <div key={r} className={`flex gap-1.5 sm:gap-2 ${r % 2 ? 'pl-3 sm:pl-12' : ''}`}>
                  {rangee.map((b, j) => {
                    const delay = (MUR.slice(0, r).flat().length + j + 1) * 90;
                    return (
                      <div
                        key={b.nom}
                        className="flex-1 min-w-0 rounded-sm bg-brique text-white px-1.5 sm:px-3 py-2.5 sm:py-4 shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] motion-safe:animate-[pose-brique_520ms_var(--ease-pose)_both]"
                        style={{ animationDelay: `${delay}ms`, flexGrow: b.nom.length > 8 ? 1.6 : 1 }}
                      >
                        <span className="block font-display font-extrabold text-[13px] sm:text-lg leading-tight break-words">{b.nom}</span>
                        <span className="block font-mono text-[0.68rem] sm:text-xs text-white/80 leading-tight break-words">{b.quoi}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <figcaption className="mt-2 font-mono text-xs text-texte-2">Une brique par base publique. Toutes ouvertes, toutes gratuites.</figcaption>
            </figure>
          </div>
        </section>

        {/* 2. EN TROIS TEMPS */}
        <section aria-labelledby="temps-titre" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid gap-10">
          <div className="grid gap-3 max-w-2xl">
            <span className="label">Le fonctionnement</span>
            <h2 id="temps-titre" className="text-3xl md:text-4xl font-extrabold">Trois temps, quelques secondes.</h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-0 md:gap-0 border-t-2 border-encre">
            {ETAPES.map((e, i) => (
              <Reveal as="li" key={e.n} delay={i * 120} className="relative grid gap-3 content-start pt-6 pb-8 md:pr-8 border-b md:border-b-0 md:border-r last:border-0 border-trait border-dashed">
                {/* Cote de plan */}
                <span aria-hidden className="absolute -top-[7px] left-0 w-3 h-3 rounded-full bg-papier border-2 border-encre" />
                <span className="font-mono text-sm text-brique font-bold">{e.n}</span>
                <h3 className="text-2xl font-extrabold">{e.titre}</h3>
                <p className="text-texte-2">{e.texte}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* 3. LA COUPE INTERACTIVE */}
        <section aria-labelledby="coupe-titre" className="bg-encre text-papier">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid gap-10">
            <div className="grid gap-3 max-w-2xl">
              <span className="label text-papier/70">Démonter le rapport</span>
              <h2 id="coupe-titre" className="text-3xl md:text-4xl font-extrabold">Choisissez une couche du bâtiment.</h2>
              <p className="text-papier/80">Pour chacune : ce qu&apos;on lit, où on le lit, et ce que ça ne dit pas.</p>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8 items-start">
              {/* Coupe du bâtiment : chaque couche est un bouton */}
              <div role="tablist" aria-label="Couches du bâtiment" className="grid gap-1.5">
                {COUCHES.map((c, i) => {
                  const on = c.id === couche;
                  const width = ['w-[62%] mx-auto', 'w-[78%] mx-auto', 'w-[88%] mx-auto', 'w-full', 'w-full'][i];
                  return (
                    <button
                      key={c.id}
                      role="tab"
                      type="button"
                      id={`tab-${c.id}`}
                      aria-selected={on}
                      aria-controls="couche-detail"
                      onClick={() => setCouche(c.id)}
                      className={`${width} ${i === 0 ? 'rounded-t-[48px]' : 'rounded-sm'} ${i === 4 ? 'border-dashed' : ''} min-h-[56px] px-4 flex items-center justify-between gap-3 border-2 text-left transition-colors ${on ? 'bg-brique border-brique text-white' : 'bg-white/5 border-white/15 text-papier hover:bg-white/10'}`}
                    >
                      <span className="font-bold">{c.nom}</span>
                      <span className={`font-mono text-xs ${on ? 'text-white/85' : 'text-papier/60'}`}>{c.hauteur}</span>
                    </button>
                  );
                })}
              </div>

              <div id="couche-detail" role="tabpanel" aria-labelledby={`tab-${active.id}`} key={active.id} className="card bg-surface text-texte p-6 grid gap-5 motion-safe:animate-[pose-brique_380ms_var(--ease-pose)_both]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-2xl font-extrabold">{active.nom}</h3>
                  <span className="font-mono text-xs text-texte-2">Source : {active.source}</span>
                </div>
                <div className="grid gap-2">
                  <span className="label">Ce qu&apos;on lit</span>
                  <ul className="grid gap-1.5">
                    {active.lit.map((l) => (
                      <li key={l} className="flex items-start gap-2"><Check size={18} className="text-ok mt-0.5 shrink-0" aria-hidden /> {l}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-2 p-4 rounded-sm bg-vigil-soft border-l-4 border-vigil">
                  <span className="label text-vigil">Ce que ça ne dit pas</span>
                  <p>{active.limite}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CE QUE BRICQ NE FAIT PAS */}
        <section aria-labelledby="pas-titre" className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10">
          <div className="grid gap-4 content-start">
            <span className="label">Franchement</span>
            <h2 id="pas-titre" className="text-3xl md:text-4xl font-extrabold">Ce que Bricq ne fait pas.</h2>
            <p className="text-texte-2">On préfère vous le dire ici que vous le faire découvrir chez le notaire.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <StatusChip status="ok">Vérifié</StatusChip>
              <StatusChip status="vigil">À surveiller</StatusChip>
              <StatusChip status="alerte">À traiter</StatusChip>
              <StatusChip status="inconnu">Non évalué</StatusChip>
            </div>
            <p className="text-sm text-texte-2">Les quatre états du rapport. Toujours une couleur, une icône et un mot.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {PAS.map((p, i) => (
              <Reveal as="li" key={p.titre} delay={i * 80} className="card p-5 grid gap-2 content-start">
                <CircleSlash size={22} className="text-brique" aria-hidden />
                <h3 className="text-lg font-bold">{p.titre}</h3>
                <p className="text-texte-2">{p.texte}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* 5. L'ESPACE PROPRIÉTAIRE */}
        <section aria-labelledby="espace-titre" className="bg-surface border-y border-trait">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid gap-10">
            <div className="grid gap-3 max-w-2xl">
              <span className="label">Si c&apos;est votre logement</span>
              <h2 id="espace-titre" className="text-3xl md:text-4xl font-extrabold">Le rapport devient un carnet de santé.</h2>
            </div>
            <ol className="grid md:grid-cols-4 gap-4">
              {[
                { icon: KeyRound, t: 'Créez un compte', d: 'E-mail et mot de passe. C’est tout.' },
                { icon: UserCheck, t: 'Ajoutez le logement', d: 'Avec un justificatif (taxe foncière, acte). On vérifie que c’est bien le vôtre.' },
                { icon: FileCheck2, t: 'Rangez vos papiers', d: 'Factures, diagnostics, devis. Ils sont lus et classés automatiquement.' },
                { icon: Search, t: 'Suivez l’état', d: 'Travaux, rappels, charges. La maquette 3D prend la couleur de l’entretien.' },
              ].map(({ icon: Icon, t, d }, i) => (
                <Reveal as="li" key={t} delay={i * 90} className="relative grid gap-3 content-start p-5 rounded-lg border border-trait bg-papier">
                  <span className="font-mono text-xs text-texte-2">Étape {i + 1}</span>
                  <Icon size={24} className="text-encre" aria-hidden />
                  <h3 className="text-lg font-bold">{t}</h3>
                  <p className="text-sm text-texte-2">{d}</p>
                </Reveal>
              ))}
            </ol>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {[
                { icon: Lock, t: 'Privé par défaut', d: 'Vos documents ne sont visibles que par vous.' },
                { icon: ShieldCheck, t: 'Rien de partagé sans vous', d: 'Aucune donnée n’est transmise à un tiers.' },
                { icon: Trash2, t: 'Supprimable à tout moment', d: 'Un logement supprimé l’est avec tous ses documents.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex items-start gap-3">
                  <Icon size={20} className="text-ok mt-0.5 shrink-0" aria-hidden />
                  <p><span className="font-bold">{t}.</span> <span className="text-texte-2">{d}</span></p>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn btn-encre justify-self-start">Créer mon espace <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </section>

        {/* 6. QUESTIONS */}
        <section aria-labelledby="faq-titre" className="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid gap-8">
          <h2 id="faq-titre" className="text-3xl md:text-4xl font-extrabold">Questions directes, réponses courtes.</h2>
          <div className="grid border-t border-trait">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-trait">
                <summary className="list-none cursor-pointer min-h-[60px] py-4 flex items-center justify-between gap-4 font-display text-lg font-bold">
                  {f.q}
                  <span aria-hidden className="w-8 h-8 shrink-0 grid place-items-center rounded-full border border-trait-fort text-brique transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-texte-2 max-w-2xl">{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 7. ESSAYER */}
        <section aria-labelledby="essai-titre" className="relative overflow-hidden bg-brique text-white">
          <div aria-hidden className="absolute inset-0 opacity-15 [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:100%_28px,80px_56px,80px_56px] [background-position:0_0,0_0,40px_28px]" />
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 md:py-20 grid gap-6 [&>*]:min-w-0">
            <h2 id="essai-titre" className="text-3xl md:text-5xl font-extrabold text-white">Le plus simple, c&apos;est d&apos;essayer.</h2>
            <p className="text-white/85 text-lg">Votre adresse, la maison de vos parents, celle que vous visitez samedi.</p>
            <div className="w-full max-w-2xl bg-surface rounded-sm p-1">
              <AddressAutocomplete onSelect={(f) => navigate(`/report/${encodeURIComponent(f.properties.id)}`)} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      {overlay}
    </div>
  );
}
