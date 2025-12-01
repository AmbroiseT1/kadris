"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState } from 'react';
import { Menu, X, Shield, CheckCircle, TrendingUp, ArrowRight, Compass, Map as MapIcon, HardHat, TriangleAlert, FileText } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import ProfileDropdown from '@/components/ui/ProfileDropdown';

// --- IMPORTS DES COMPOSANTS ---
import { MapLayersViz, DataSynthesisCard } from '@/components/ui/Diagrams';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import ArchitecturalViewer from '@/components/dashboard/ArchitecturalViewer';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAddressSelect = (addressData: any) => {
    const buildingId = addressData.properties.id;
    console.log("🚀 Redirection vers le rapport pour l'ID :", buildingId);
    router.push(`/report/${buildingId}`);
  };

  const handleOwnerSpaceClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <main className="min-h-screen bg-bricq-cream text-bricq-slate selection:bg-bricq-terracotta selection:text-white font-sans">

      {/* --- HEADER / NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bricq-cream/95 backdrop-blur-sm border-b border-bricq-slate/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">
              bricq
            </span>
          </div>

          {/* Liens Desktop */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-bricq-slate" suppressHydrationWarning>
            <Link href="/how-it-works" className="hover:text-bricq-terracotta hover:underline decoration-2 underline-offset-4 transition-all">Comment ça marche</Link>
            <a href="#pricing" className="hover:text-bricq-terracotta hover:underline decoration-2 underline-offset-4 transition-all">Tarifs</a>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="px-5 py-2 bg-bricq-slate text-white rounded-sm hover:bg-bricq-slate/90 transition-colors shadow-sm">
                  Mon Tableau de Bord
                </Link>
                <ProfileDropdown />
              </div>
            ) : (
              <>
                <Link href="/login" className="px-5 py-2 border border-bricq-slate/20 hover:bg-bricq-slate hover:text-white rounded-sm transition-colors">
                  Connexion
                </Link>
                <button onClick={handleOwnerSpaceClick} className="px-5 py-2 bg-bricq-slate text-white rounded-sm hover:bg-bricq-slate/90 transition-colors shadow-sm">
                  Espace Propriétaire
                </button>
              </>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button className="md:hidden text-bricq-slate p-2 border border-bricq-slate/20 rounded-sm" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Menu Mobile (Overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-bricq-cream flex flex-col items-center justify-center gap-8 text-xl font-serif animate-fade-in">
          <Link href="/how-it-works" onClick={() => setMenuOpen(false)}>Comment ça marche</Link>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Tarifs</a>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Mon Tableau de Bord</Link>
              <button onClick={() => { setMenuOpen(false); /* logout logic here if needed or link to profile */ }} className="text-red-500">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <button onClick={() => { setMenuOpen(false); handleOwnerSpaceClick(); }} className="px-6 py-3 bg-bricq-terracotta text-white rounded-sm">Espace Propriétaire</button>
            </>
          )}
        </div>
      )}

      {/* --- HERO SECTION (RECHERCHE) --- */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-visible">
        <BackgroundGrid />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-bricq-slate mb-8 leading-tight max-w-5xl mx-auto tracking-tight">
            L'histoire invisible de <br className="hidden md:block" />votre futur logement.
          </h1>

          <p className="text-lg md:text-xl text-bricq-slate/70 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Accédez au passeport numérique complet : risques naturels, historique de transaction (DVF) et travaux déclarés en un clic.
          </p>

          {/* BARRE DE RECHERCHE INTELLIGENTE */}
          <div className="mb-12 relative z-30">
            <AddressAutocomplete onSelect={handleAddressSelect} />
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-bricq-slate/50 font-mono uppercase tracking-wider mt-8">
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-bricq-sage" /> Données Officielles</span>
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-bricq-sage" /> Mises à jour Hebdo</span>
            <span className="flex items-center gap-2"><CheckCircle size={12} className="text-bricq-sage" /> 100% Gratuit</span>
          </div>
        </div>
      </section>

      {/* --- SECTION TEASER (VISUALISATION) --- */}
      <section className="py-24 bg-white border-y border-bricq-slate/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bricq-slate mb-4">
              Qu'est-ce que bricq révèle ?
            </h2>
            <div className="w-24 h-1 bg-bricq-terracotta mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Module 1: Map Layers Visual */}
            <div className="flex flex-col items-center group">
              <div className="w-full max-w-md mb-8 transform group-hover:scale-[1.02] transition-transform duration-500">
                <MapLayersViz />
              </div>
              <div className="text-center md:text-left max-w-md">
                <h3 className="font-serif text-2xl text-bricq-slate mb-3 border-b border-bricq-slate/10 pb-2 inline-block">L'invisible devient visible</h3>
                <p className="text-bricq-slate/70 leading-relaxed font-light">
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
                <h3 className="font-serif text-2xl text-bricq-slate mb-3 border-b border-bricq-slate/10 pb-2 inline-block">La vérité des chiffres</h3>
                <p className="text-bricq-slate/70 leading-relaxed font-light">
                  Prix au m² réel basé sur les actes notariés, historique des ventes précédentes, et diagnostics techniques pré-calculés. Ne négociez plus à l'aveugle.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION VALEUR AJOUTÉE (NOUVELLE) --- */}
      <section className="py-24 bg-bricq-cream border-b border-bricq-slate/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bricq-slate mb-4">
              Qu'est-ce que bricq vous apporte ?
            </h2>
            <div className="w-24 h-1 bg-bricq-terracotta mx-auto mb-6"></div>
            <p className="text-lg text-bricq-slate/70 max-w-2xl mx-auto font-light">
              Un "double numérique" de votre maison : un carnet de santé qui vous redonne le contrôle.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Colonne Texte */}
            <div className="space-y-12">

              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border border-bricq-sage/30 flex items-center justify-center text-bricq-sage shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Shield size={28} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-bricq-slate mb-2">La sérénité au quotidien</h3>
                  <p className="text-bricq-slate/70 leading-relaxed font-light">
                    Fini le stress de la maintenance oubliée. Votre dashboard agit comme un assistant personnel qui vous rappelle les échéances importantes et centralise tous vos documents vitaux.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border border-bricq-terracotta/30 flex items-center justify-center text-bricq-terracotta shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-bricq-slate mb-2">La fierté de valoriser son bien</h3>
                  <p className="text-bricq-slate/70 leading-relaxed font-light">
                    Chaque facture de travaux uploadée devient une preuve tangible de la valeur ajoutée. Vous ne subissez plus les coûts, vous investissez dans votre capital.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border border-bricq-slate/20 flex items-center justify-center text-bricq-slate shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-bricq-slate mb-2">La confiance lors de la revente</h3>
                  <p className="text-bricq-slate/70 leading-relaxed font-light">
                    Le jour de la vente, présentez un historique limpide et vérifié. C'est l'argument ultime pour justifier votre prix et rassurer votre futur acheteur.
                  </p>
                </div>
              </div>

            </div>

            {/* Colonne Image (Mockup) */}
            <div className="flex flex-col gap-4">
              <div className="relative group h-80 w-full">
                <div className="absolute inset-0 bg-bricq-slate/5 transform translate-x-6 translate-y-6 rounded-sm transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4"></div>
                <div className="relative z-10 bg-white h-full w-full rounded-sm shadow-2xl border border-bricq-slate/10 transform transition-transform duration-500 group-hover:-translate-y-2 overflow-hidden flex flex-col">
                  {/* Fake Browser Header */}
                  <div className="h-6 border-b border-bricq-slate/10 bg-bricq-cream/50 flex items-center px-3 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-300"></div>
                    <div className="w-2 h-2 rounded-full bg-green-300"></div>
                  </div>
                  {/* 3D Viewer Content */}
                  <div className="flex-1 relative bg-[#fdfbf7] flex overflow-hidden">
                    {/* Container for 3D View - shrinks when drawer is open (simulated) */}
                    <div className="w-1/2 h-full relative">
                      <ArchitecturalViewer />
                    </div>

                    {/* Mini Detail Drawer (Fixed Open) */}
                    <div className="w-1/2 h-full bg-white/95 border-l border-bricq-slate/10 p-4 flex flex-col z-20 relative">
                      {/* Texture overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                      <div className="border-b border-black/10 pb-2 mb-3 relative z-10">
                        <h4 className="font-serif font-bold text-xs uppercase tracking-tight">Historique Travaux</h4>
                      </div>

                      <div className="space-y-4 overflow-hidden relative z-10">
                        {/* Item 1 */}
                        <div className="relative pl-3 border-l border-black/20">
                          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-white border border-black"></div>
                          <div className="text-[8px] font-mono text-gray-500 mb-0.5">2024 - EN COURS</div>
                          <div className="text-[10px] font-bold font-serif leading-tight">Ravalement Façade</div>
                          <div className="text-[8px] text-gray-600 italic mt-0.5 font-handwriting">"Reprise des fissures et enduit."</div>
                          <div className="w-full h-1 bg-gray-100 mt-1 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-black"></div>
                          </div>
                        </div>

                        {/* Item 2 */}
                        <div className="relative pl-3 border-l border-black/20">
                          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-black"></div>
                          <div className="text-[8px] font-mono text-gray-500 mb-0.5">2023 - TERMINÉ</div>
                          <div className="text-[10px] font-bold font-serif leading-tight">Pompe à Chaleur</div>
                          <div className="text-[8px] text-gray-600 italic mt-0.5 font-handwriting">"Installation PAC Air/Eau 12kW."</div>
                        </div>

                        {/* Item 3 */}
                        <div className="relative pl-3 border-l border-black/20">
                          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-black"></div>
                          <div className="text-[8px] font-mono text-gray-500 mb-0.5">2020 - TERMINÉ</div>
                          <div className="text-[10px] font-bold font-serif leading-tight">Isolation Combles</div>
                          <div className="text-[8px] text-gray-600 italic mt-0.5 font-handwriting">"Laine de verre soufflée R=7."</div>
                        </div>

                        {/* Item 4 */}
                        <div className="relative pl-3 border-l border-black/20">
                          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-black"></div>
                          <div className="text-[8px] font-mono text-gray-500 mb-0.5">2018 - TERMINÉ</div>
                          <div className="text-[10px] font-bold font-serif leading-tight">Réfection Toiture</div>
                          <div className="text-[8px] text-gray-600 italic mt-0.5 font-handwriting">"Tuiles mécaniques neuves."</div>
                        </div>

                        {/* Item 5 */}
                        <div className="relative pl-3 border-l border-black/20 opacity-50">
                          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-black"></div>
                          <div className="text-[8px] font-mono text-gray-500 mb-0.5">2015 - TERMINÉ</div>
                          <div className="text-[10px] font-bold font-serif leading-tight">Fenêtres Double Vitrage</div>
                        </div>
                      </div>
                    </div>

                    {/* Mini Nav Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#fdfbf7] border-t border-bricq-slate/10 flex items-center justify-around px-4 z-30">
                      <div className="flex flex-col items-center gap-1 opacity-50">
                        <Compass size={14} strokeWidth={1.5} />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider">VUE</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-50">
                        <MapIcon size={14} strokeWidth={1.5} />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider">QUARTIER</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-50">
                        <TrendingUp size={14} strokeWidth={1.5} />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider">ESTIM.</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-100">
                        <HardHat size={16} strokeWidth={2} className="text-black" />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider text-black">TRAVAUX</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-50">
                        <TriangleAlert size={14} strokeWidth={1.5} />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider">RISQUES</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 opacity-50">
                        <FileText size={14} strokeWidth={1.5} />
                        <span className="text-[5px] font-mono font-bold uppercase tracking-wider">DOCS</span>
                      </div>
                    </div>

                    {/* Overlay to prevent scroll capture if needed, or just let it be interactive */}
                    <div className="absolute inset-0 pointer-events-none border-[10px] border-white/0"></div>
                  </div>
                </div>
              </div>
              <p className="text-center font-mono text-xs text-bricq-slate/50 uppercase tracking-widest">
                Dashboard bricq pour vous accompagner au quotidien
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION PROPRIÉTAIRE (CONVERSION) --- */}
      <section id="owner" className="py-24 bg-bricq-cream relative overflow-hidden">
        {/* Accents géométriques */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-bricq-sage/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-bricq-slate/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-white rounded-sm p-8 md:p-16 border border-bricq-slate/10 flex flex-col md:flex-row items-center justify-between gap-12 shadow-none">

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-bricq-sage/10 text-bricq-slate text-xs font-bold tracking-widest uppercase border border-bricq-sage/20 mb-6">
                <Shield size={12} /> Offre Propriétaire
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-bricq-slate mb-6">
                Vous êtes déjà propriétaire ? <span className="text-bricq-terracotta border-b-2 border-bricq-terracotta/20">C'est Gratuit.</span>
              </h2>
              <p className="text-lg text-bricq-slate/70 mb-8 leading-relaxed font-light">
                Centralisez vos documents, suivez l'évolution de la valeur de votre bien en temps réel et gérez votre maintenance préventive grâce à notre carnet numérique.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-bricq-slate/80">
                  <div className="p-1 bg-bricq-sage/20 rounded-sm"><CheckCircle className="text-bricq-sage" size={14} /></div>
                  <span className="font-medium">Estimation de la valeur marché actualisée mensuellement</span>
                </li>
                <li className="flex items-start gap-3 text-bricq-slate/80">
                  <div className="p-1 bg-bricq-sage/20 rounded-sm"><CheckCircle className="text-bricq-sage" size={14} /></div>
                  <span className="font-medium">Coffre-fort numérique sécurisé pour vos actes et factures</span>
                </li>
                <li className="flex items-start gap-3 text-bricq-slate/80">
                  <div className="p-1 bg-bricq-sage/20 rounded-sm"><CheckCircle className="text-bricq-sage" size={14} /></div>
                  <span className="font-medium">Alertes entretien et conformité énergétique</span>
                </li>
              </ul>

              <button onClick={handleOwnerSpaceClick} className="group flex items-center gap-3 bg-bricq-slate text-white px-8 py-4 rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-all">
                Revendiquer mon bien
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Aperçu Dashboard Abstrait */}
            <div className="w-full max-w-md aspect-square bg-bricq-cream rounded-sm p-6 relative border border-bricq-slate/10 overflow-hidden">
              <div className="w-full h-32 bg-white rounded-sm border border-bricq-slate/5 mb-4 p-4">
                <div className="w-1/3 h-3 bg-bricq-slate/10 rounded-sm mb-3"></div>
                <div className="flex items-end gap-2">
                  <div className="w-full h-16 bg-bricq-sage/20 rounded-sm relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-bricq-sage/40"></div>
                  </div>
                  <div className="w-1/3 h-16 flex items-center justify-center bg-bricq-terracotta/10 rounded-sm">
                    <TrendingUp className="text-bricq-terracotta" />
                  </div>
                </div>
              </div>
              <div className="w-full h-24 bg-white rounded-sm border border-bricq-slate/5 mb-4 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-sm bg-bricq-slate/10 flex items-center justify-center">
                  <Shield size={20} className="text-bricq-slate" />
                </div>
                <div className="flex-1">
                  <div className="w-3/4 h-3 bg-bricq-slate/10 rounded-sm mb-2"></div>
                  <div className="w-1/2 h-3 bg-bricq-slate/10 rounded-sm"></div>
                </div>
              </div>
              <div className="w-full h-full bg-white rounded-sm border border-bricq-slate/5 p-4 opacity-50">
                <div className="w-full h-3 bg-bricq-slate/10 rounded-sm mb-2"></div>
                <div className="w-full h-3 bg-bricq-slate/10 rounded-sm mb-2"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-bricq-slate/10 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/bricq-logo.png" alt="bricq Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
                <span className="font-serif font-bold text-lg text-bricq-slate tracking-tighter">
                  bricq
                </span>
              </div>
              <p className="text-sm text-bricq-slate/60 leading-relaxed font-light">
                La première plateforme d'intelligence immobilière qui rend visible l'invisible pour les acheteurs et les propriétaires.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-bricq-slate mb-4 text-xs uppercase tracking-widest border-b border-bricq-slate/10 pb-2 inline-block">Plateforme</h4>
              <ul className="space-y-2 text-sm text-bricq-slate/60">
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Tarifs</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Espace Pro</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-bricq-slate mb-4 text-xs uppercase tracking-widest border-b border-bricq-slate/10 pb-2 inline-block">Légal</h4>
              <ul className="space-y-2 text-sm text-bricq-slate/60">
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Mentions Légales</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">CGU</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-bricq-slate mb-4 text-xs uppercase tracking-widest border-b border-bricq-slate/10 pb-2 inline-block">Contact</h4>
              <ul className="space-y-2 text-sm text-bricq-slate/60">
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Support</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Presse</a></li>
                <li><a href="#" className="hover:text-bricq-terracotta hover:underline">Carrières</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-bricq-slate/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-bricq-slate/40 font-mono">
            <div>&copy; 2024 bricq Technologies. Tous droits réservés.</div>
            <div className="flex gap-4">
              <span className="hover:text-bricq-slate cursor-pointer">LinkedIn</span>
              <span className="hover:text-bricq-slate cursor-pointer">Twitter</span>
              <span className="hover:text-bricq-slate cursor-pointer">Instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
