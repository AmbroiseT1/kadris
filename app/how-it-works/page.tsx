"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Search, FileSearch, Shield, TrendingUp, Users, Clock, CheckCircle, Sparkles, Eye, Home, Lock } from 'lucide-react';

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen bg-bricq-cream text-bricq-slate">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bricq-cream/95 backdrop-blur-sm border-b border-bricq-slate/10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
                        <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                    </Link>
                    <Link href="/" className="text-sm text-bricq-slate/60 hover:text-bricq-slate transition-colors">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </nav>

            {/* Hero Section - THE WHY */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-bricq-terracotta/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bricq-sage/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-bricq-terracotta/10 border border-bricq-terracotta/20 rounded-full mb-8">
                            <Sparkles size={16} className="text-bricq-terracotta" />
                            <span className="text-sm font-bold text-bricq-terracotta uppercase tracking-wider">Le Pourquoi</span>
                        </div>

                        <h1 className="font-serif text-5xl md:text-7xl font-bold mb-8 leading-tight">
                            L'immobilier mérite la{' '}
                            <span className="relative inline-block">
                                <span className="relative z-10 bg-gradient-to-r from-bricq-terracotta to-bricq-sage bg-clip-text text-transparent">
                                    transparence
                                </span>
                                <motion.div
                                    className="absolute bottom-2 left-0 right-0 h-3 bg-bricq-terracotta/20"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                ></motion.div>
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-bricq-slate/70 mb-12 leading-relaxed font-light max-w-3xl mx-auto">
                            Chaque année, des millions de Français achètent ou vendent un bien immobilier <span className="font-bold text-bricq-slate">à l'aveugle</span>.
                            bricq change les règles du jeu en rendant l'invisible visible.
                        </p>

                        {/* Stats Pills */}
                        <div className="flex flex-wrap gap-4 justify-center mb-12">
                            <StatPill icon={<Eye size={20} />} value="80%" label="des acheteurs ignorent les risques" />
                            <StatPill icon={<Clock size={20} />} value="6 mois" label="pour découvrir un vice caché" />
                            <StatPill icon={<TrendingUp size={20} />} value="15k€" label="perdus en moyenne" />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <Link
                                href="#how"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-bricq-slate text-white rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-all shadow-lg hover:shadow-xl group"
                            >
                                Découvrir comment
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* The Problem Section */}
            <section className="py-24 bg-white border-y border-bricq-slate/10">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="font-serif text-4xl md:text-5xl font-bold text-center mb-16">
                                Le problème qu'on résout
                            </h2>

                            <div className="grid md:grid-cols-3 gap-8">
                                <ProblemCard
                                    icon={<Lock size={32} />}
                                    title="Information verrouillée"
                                    description="Les données existent mais sont éparpillées dans 12+ bases différentes. Inaccessibles au commun des mortels."
                                    color="terracotta"
                                />
                                <ProblemCard
                                    icon={<Users size={32} />}
                                    title="Asymétrie totale"
                                    description="Les pros ont accès à tout. Les particuliers signent à l'aveugle. Cette inégalité coûte cher."
                                    color="slate"
                                />
                                <ProblemCard
                                    icon={<Clock size={32} />}
                                    title="Découverte tardive"
                                    description="Les problèmes apparaissent 6 mois après l'achat. Trop tard pour négocier ou se retirer."
                                    color="sage"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* HOW Section - Timeline */}
            <section id="how" className="py-32 bg-gradient-to-b from-bricq-cream to-white">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-bricq-sage/10 border border-bricq-sage/20 rounded-full mb-8">
                            <Sparkles size={16} className="text-bricq-sage" />
                            <span className="text-sm font-bold text-bricq-sage uppercase tracking-wider">Comment ça marche</span>
                        </div>

                        <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6">
                            Trois étapes pour tout savoir
                        </h2>
                        <p className="text-xl text-bricq-slate/70 max-w-2xl mx-auto font-light">
                            De la recherche à la décision éclairée, bricq vous accompagne à chaque instant.
                        </p>
                    </motion.div>

                    <div className="max-w-5xl mx-auto">
                        <StepCard
                            number="01"
                            title="Recherchez votre adresse"
                            description="Entrez simplement l'adresse du bien qui vous intéresse. Notre moteur intelligent interroge instantanément 12+ bases de données officielles : cadastre, DVF, géorisques, DPE, et bien plus."
                            icon={<Search size={48} />}
                            features={[
                                "Base Adresse Nationale (BAN)",
                                "Données Valeurs Foncières (DVF)",
                                "Base Nationale des Bâtiments (BDNB)",
                                "Géorisques & Plans de Prévention"
                            ]}
                            delay={0}
                        />

                        <StepCard
                            number="02"
                            title="Analysez le rapport complet"
                            description="En moins de 3 secondes, accédez au 'passeport immobilier' : historique des ventes, diagnostics énergétiques, risques naturels, qualité du quartier. Tout est là, clairement présenté."
                            icon={<FileSearch size={48} />}
                            features={[
                                "Historique des transactions (prix, dates)",
                                "Performance énergétique & travaux",
                                "Exposition aux risques (inondation, argile)",
                                "Analyse du quartier (transports, services)"
                            ]}
                            delay={0.2}
                            reverse
                        />

                        <StepCard
                            number="03"
                            title="Décidez en confiance"
                            description="Armé de données certifiées, vous négociez mieux, évitez les pièges et investissez sereinement. Pour les propriétaires, c'est un carnet numérique qui valorise votre bien."
                            icon={<Shield size={48} />}
                            features={[
                                "Comparable de prix au m² réels",
                                "Alertes sur vices potentiels",
                                "Export PDF pour votre banque/notaire",
                                "Suivi de la valeur dans le temps (proprio)"
                            ]}
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section className="py-24 bg-bricq-slate text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                            La technologie au service de la transparence
                        </h2>
                        <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
                            Nous croyons que la donnée publique doit être publiquement accessible
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <TechCard
                            title="APIs Gouvernementales"
                            description="Connexion directe aux sources officielles (IGN, DGFIP, MTE)"
                        />
                        <TechCard
                            title="Traitement instantané"
                            description="Agrégation de 12+ sources en moins de 3 secondes"
                        />
                        <TechCard
                            title="Mise à jour continue"
                            description="Synchronisation hebdomadaire avec les bases officielles"
                        />
                        <TechCard
                            title="Sécurité & confidentialité"
                            description="Chiffrement bout en bout, conformité RGPD totale"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-32 bg-gradient-to-br from-bricq-cream via-white to-bricq-sage/10">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h2 className="font-serif text-4xl md:text-6xl font-bold mb-8">
                            Prêt à voir l'invisible ?
                        </h2>
                        <p className="text-xl text-bricq-slate/70 mb-12 max-w-2xl mx-auto font-light">
                            Rejoignez les milliers d'utilisateurs qui prennent des décisions immobilières éclairées.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-bricq-slate text-white rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-all shadow-lg hover:shadow-xl group"
                            >
                                Essayer gratuitement
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-bricq-slate text-bricq-slate rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate hover:text-white transition-all"
                            >
                                Espace Propriétaire
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

// Components
function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-bricq-slate/10 rounded-full shadow-sm"
        >
            <div className="text-bricq-terracotta">{icon}</div>
            <div className="text-left">
                <div className="font-bold text-bricq-slate text-lg">{value}</div>
                <div className="text-xs text-bricq-slate/60">{label}</div>
            </div>
        </motion.div>
    );
}

function ProblemCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
    const colorClasses = {
        terracotta: 'border-bricq-terracotta/20 bg-bricq-terracotta/5',
        slate: 'border-bricq-slate/20 bg-bricq-slate/5',
        sage: 'border-bricq-sage/20 bg-bricq-sage/5'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`p-8 border-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} hover:scale-105 transition-transform duration-300`}
        >
            <div className="text-bricq-slate mb-4">{icon}</div>
            <h3 className="font-serif text-xl font-bold mb-3 text-bricq-slate">{title}</h3>
            <p className="text-bricq-slate/70 leading-relaxed">{description}</p>
        </motion.div>
    );
}

function StepCard({ number, title, description, icon, features, delay, reverse }: {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    delay: number;
    reverse?: boolean;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay }}
            className="relative mb-20"
        >
            <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
                {/* Icon Circle */}
                <div className="flex-shrink-0">
                    <div className="relative">
                        <div className="absolute inset-0 bg-bricq-terracotta/20 rounded-full blur-xl"></div>
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-bricq-terracotta to-bricq-sage flex items-center justify-center text-white shadow-2xl">
                            {icon}
                        </div>
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-bricq-cream">
                            <span className="font-serif text-2xl font-bold text-bricq-slate">{number}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-bricq-slate">{title}</h3>
                    <p className="text-lg text-bricq-slate/70 mb-6 leading-relaxed font-light">{description}</p>

                    <div className="grid sm:grid-cols-2 gap-3">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={isInView ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: delay + 0.2 + (i * 0.1) }}
                                className="flex items-start gap-2"
                            >
                                <CheckCircle size={16} className="text-bricq-sage mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-bricq-slate/80">{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TechCard({ title, description }: { title: string; description: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-6 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
        >
            <h4 className="font-serif text-xl font-bold mb-3">{title}</h4>
            <p className="text-white/70 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
