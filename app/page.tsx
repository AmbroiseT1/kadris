"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Menu, X, Shield, CheckCircle, BrickWall, TrendingUp, ArrowRight } from 'lucide-react';

// --- IMPORTS DES COMPOSANTS ---
import { MapLayersViz, DataSynthesisCard } from '@/components/ui/Diagrams';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAddressSelect = (addressData: any) => {
    const buildingId = addressData.properties.id;
    console.log("🚀 Redirection vers le rapport pour l'ID :", buildingId);
    router.push(`/report/${buildingId}`);
  };

  return (
    <main className="min-h-screen bg-kadris-cream text-kadris-slate selection:bg-kadris-terracotta selection:text-white font-sans">

      {/* --- HEADER / NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-kadris-cream/95 backdrop-blur-sm border-b border-kadris-slate/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-kadris-slate p-1 border border-kadris-slate/20 bg-white rounded-sm">
              <BrickWall strokeWidth={2} size={24} />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-kadris-slate">
              Kadris
            </span>
          </div>

          {/* Liens Desktop */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-kadris-slate" suppressHydrationWarning>
            <a href="#how-it-works" className="hover:text-kadris-terracotta hover:underline decoration-2 underline-offset-4 transition-all">Comment ça marche</a>
            <a href="#pricing" className="hover:text-kadris-terracotta hover:underline decoration-2 underline-offset-4 transition-all">Tarifs</a>
            <a href="#login" className="px-5 py-2 border border-kadris-slate/20 hover:bg-kadris-slate hover:text-white rounded-sm transition-colors">
              Connexion
            </a>
            <a href="#owner" className="px-5 py-2 bg-kadris-slate text-white rounded-sm hover:bg-kadris-slate/90 transition-colors shadow-sm">
              Espace Propriétaire
            </a>
          </div>

          {/* Bouton Menu Mobile */}
          <button className="md:hidden text-kadris-slate p-2 border border-kadris-slate/20 rounded-sm" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Menu Mobile (Overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-kadris-cream flex flex-col items-center justify-center gap-8 text-xl font-serif animate-fade-in">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Tarifs</a>
          <a href="#login" onClick={() => setMenuOpen(false)}>Connexion</a>
          <a href="#owner" onClick={() => setMenuOpen(false)} className="px-6 py-3 bg-kadris-terracotta text-white rounded-sm">Espace Propriétaire</a>
        </div>
      )}

      {/* --- HERO SECTION (RECHERCHE) --- */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-visible">
        <BackgroundGrid />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-kadris-slate mb-8 leading-tight max-w-5xl mx-auto tracking-tight">
            L'histoire invisible de <br className="hidden md:block" />votre futur logement.
          </h1>

          <p className="text-lg md:text-xl text-kadris-slate/70 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Accédez au passeport numérique complet : risques naturels, historique de transaction (DVF) et travaux déclarés en un clic.
          </p>

          {/* BARRE DE RECHERCHE INTELLIGENTE */}
          <div className="mb-12 relative z-30">
            <AddressAutocomplete onSelect={handleAddressSelect} />
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-kadris-slate/50 font-mono uppercase tracking-wider mt-8">
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-kadris-sage" /> Données Officielles</span>
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-kadris-sage" /> Mises à jour Hebdo</span>
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-kadris-sage" /> 100% Gratuit</span>
          </div>
        </div>
      </section>

      {/* --- SECTION TEASER (VISUALISATION) --- */}
      <section className="py-24 bg-white border-y border-kadris-slate/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-kadris-slate mb-4">
              Qu'est-ce que Kadris révèle ?
            </h2>
            <div className="w-24 h-1 bg-kadris-terracotta mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Module 1: Map Layers Visual */}
            <div className="flex flex-col items-center group">
              <div className="w-full max-w-md mb-8 transform group-hover:scale-[1.02] transition-transform duration-500">
                <MapLayersViz />
              </div>
              <div className="text-center md:text-left max-w-md">
                <h3 className="font-serif text-2xl text-kadris-slate mb-3 border-b border-kadris-slate/10 pb-2 inline-block">L'invisible devient visible</h3>
                <p className="text-kadris-slate/70 leading-relaxed font-light">
                  Nous croisons le cadastre parcellaire avec les zones à risque (inondation, argiles) et les données de marché. Visualisez l'environnement réel du bien.
                </p>
              </div>
            </div>

            {/* Module 2: Data Card Visual */}
            <div className="flex flex-col items-center lg:items-start group">
              <div className="w-full max-w-md mb-8 lg:order-2 transform group-hover:scale-[1.02] transition-transform duration-500">
                <DataSynthesisCard />
              </div>
              <div className="text-center md:text-left max-w-md lg:order-1 mb-8">
                <h3 className="font-serif text-2xl text-kadris-slate mb-3 border-b border-kadris-slate/10 pb-2 inline-block">La vérité des chiffres</h3>
                <p className="text-kadris-slate/70 leading-relaxed font-light">
                  Prix au m² réel basé sur les actes notariés, historique des ventes précédentes, et diagnostics techniques pré-calculés. Ne négociez plus à l'aveugle.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION PROPRIÉTAIRE (CONVERSION) --- */}
      <section id="owner" className="py-24 bg-kadris-cream relative overflow-hidden">
        {/* Accents géométriques */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-kadris-sage/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-kadris-slate/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-white rounded-sm p-8 md:p-16 border border-kadris-slate/10 flex flex-col md:flex-row items-center justify-between gap-12 shadow-none">

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-kadris-sage/10 text-kadris-slate text-xs font-bold tracking-widest uppercase border border-kadris-sage/20 mb-6">
                <Shield size={12} /> Offre Propriétaire
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-kadris-slate mb-6">
                Vous êtes déjà propriétaire ? <span className="text-kadris-terracotta border-b-2 border-kadris-terracotta/20">C'est Gratuit.</span>
              </h2>
              <p className="text-lg text-kadris-slate/70 mb-8 leading-relaxed font-light">
                Centralisez vos documents, suivez l'évolution de la valeur de votre bien en temps réel et gérez votre maintenance préventive grâce à notre carnet numérique.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-kadris-slate/80">
                  <div className="p-1 bg-kadris-sage/20 rounded-sm"><CheckCircle className="text-kadris-sage" size={14} /></div>
                  <span className="font-medium">Estimation de la valeur marché actualisée mensuellement</span>
                </li>
                <li className="flex items-start gap-3 text-kadris-slate/80">
                  <div className="p-1 bg-kadris-sage/20 rounded-sm"><CheckCircle className="text-kadris-sage" size={14} /></div>
                  <span className="font-medium">Coffre-fort numérique sécurisé pour vos actes et factures</span>
                </li>
                <li className="flex items-start gap-3 text-kadris-slate/80">
                  <div className="p-1 bg-kadris-sage/20 rounded-sm"><CheckCircle className="text-kadris-sage" size={14} /></div>
                  <span className="font-medium">Alertes entretien et conformité énergétique</span>
                </li>
              </ul>

              <button className="group flex items-center gap-3 bg-kadris-slate text-white px-8 py-4 rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-kadris-slate/90 transition-all">
                Revendiquer mon bien
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Aperçu Dashboard Abstrait */}
            <div className="w-full max-w-md aspect-square bg-kadris-cream rounded-sm p-6 relative border border-kadris-slate/10 overflow-hidden">
              <div className="w-full h-32 bg-white rounded-sm border border-kadris-slate/5 mb-4 p-4">
                <div className="w-1/3 h-3 bg-kadris-slate/10 rounded-sm mb-3"></div>
                <div className="flex items-end gap-2">
                  <div className="w-full h-16 bg-kadris-sage/20 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-kadris-sage/40"></div>
                  </div>
                  <div className="w-1/3 h-16 flex items-center justify-center bg-kadris-terracotta/10 rounded-sm">
                    <TrendingUp className="text-kadris-terracotta" />
                  </div>
                </div>
              </div>
              <div className="w-full h-24 bg-white rounded-sm border border-kadris-slate/5 mb-4 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-sm bg-kadris-slate/10 flex items-center justify-center">
                  <Shield size={20} className="text-kadris-slate" />
                </div>
                <div className="flex-1">
                  <div className="w-3/4 h-3 bg-kadris-slate/10 rounded-sm mb-2"></div>
                  <div className="w-1/2 h-3 bg-kadris-slate/10 rounded-sm"></div>
                </div>
              </div>
              <div className="w-full h-full bg-white rounded-sm border border-kadris-slate/5 p-4 opacity-50">
                <div className="w-full h-3 bg-kadris-slate/10 rounded-sm mb-2"></div>
                <div className="w-full h-3 bg-kadris-slate/10 rounded-sm mb-2"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-kadris-slate/10 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-kadris-slate p-1 border border-kadris-slate/10">
                  <BrickWall strokeWidth={2} size={20} />
                </div>
                <span className="font-serif font-bold text-lg text-kadris-slate">
                  Kadris
                </span>
              </div>
              <p className="text-sm text-kadris-slate/60 leading-relaxed font-light">
                La première plateforme d'intelligence immobilière qui rend visible l'invisible pour les acheteurs et les propriétaires.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-kadris-slate mb-4 text-xs uppercase tracking-widest border-b border-kadris-slate/10 pb-2 inline-block">Plateforme</h4>
              <ul className="space-y-2 text-sm text-kadris-slate/60">
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Tarifs</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Espace Pro</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-kadris-slate mb-4 text-xs uppercase tracking-widest border-b border-kadris-slate/10 pb-2 inline-block">Légal</h4>
              <ul className="space-y-2 text-sm text-kadris-slate/60">
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Mentions Légales</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">CGU</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-kadris-slate mb-4 text-xs uppercase tracking-widest border-b border-kadris-slate/10 pb-2 inline-block">Contact</h4>
              <ul className="space-y-2 text-sm text-kadris-slate/60">
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Support</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Presse</a></li>
                <li><a href="#" className="hover:text-kadris-terracotta hover:underline">Carrières</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-kadris-slate/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-kadris-slate/40 font-mono">
            <div>&copy; 2024 Kadris Technologies. Tous droits réservés.</div>
            <div className="flex gap-4">
              <span className="hover:text-kadris-slate cursor-pointer">LinkedIn</span>
              <span className="hover:text-kadris-slate cursor-pointer">Twitter</span>
              <span className="hover:text-kadris-slate cursor-pointer">Instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}