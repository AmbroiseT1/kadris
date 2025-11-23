"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Home, FileText, Shield, Trash2 } from 'lucide-react';
import { getCurrentUserProfile } from '@/utils/userStorage';
import { getCurrentUserProperties, clearCurrentUser } from '@/utils/propertyStorage';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const profile = getCurrentUserProfile();
        const userProps = getCurrentUserProperties();

        if (!profile) {
            // No user logged in, redirect to login
            router.push('/login');
            return;
        }

        setUserProfile(profile);
        setProperties(userProps);
        setIsLoading(false);
    }, [router]);

    const handleLogout = () => {
        clearCurrentUser();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-kadris-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-kadris-slate font-medium">Chargement de votre profil...</p>
                </div>
            </div>
        );
    }

    if (!userProfile) return null;

    return (
        <div className="min-h-screen bg-[#fdfbf7]">
            {/* Header */}
            <header className="bg-white border-b border-kadris-slate/10">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/properties" className="flex items-center gap-3">
                            <img src="/kadris-logo.png" alt="Kadris Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
                            <span className="text-3xl font-bold font-serif tracking-tighter text-kadris-slate">Kadris</span>
                        </Link>
                        <Link
                            href="/properties"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-kadris-slate/60 hover:text-kadris-slate transition-colors"
                        >
                            <Home size={16} />
                            <span>Mes biens</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="space-y-8">
                    {/* Page Title */}
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-kadris-slate mb-2">Mon Profil</h1>
                        <p className="text-kadris-slate/60">Gérez vos informations personnelles et vos paramètres de compte.</p>
                    </div>

                    {/* User Information Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-kadris-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-kadris-slate/10">
                            <User className="text-kadris-slate" size={24} />
                            <h2 className="text-2xl font-serif font-bold text-kadris-slate">Informations personnelles</h2>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-kadris-slate/60 mb-2">Prénom</label>
                                    <p className="text-lg font-medium text-kadris-slate">{userProfile.firstName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-kadris-slate/60 mb-2">Nom</label>
                                    <p className="text-lg font-medium text-kadris-slate">{userProfile.lastName}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-kadris-slate/60 mb-2">Email</label>
                                <p className="text-lg font-medium text-kadris-slate">{userProfile.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-kadris-slate/60 mb-2">Membre depuis</label>
                                <p className="text-lg font-medium text-kadris-slate">
                                    {new Date(userProfile.createdAt).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* My Properties Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-kadris-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-kadris-slate/10">
                            <div className="flex items-center gap-3">
                                <Home className="text-kadris-slate" size={24} />
                                <h2 className="text-2xl font-serif font-bold text-kadris-slate">Mes Biens Immobiliers</h2>
                            </div>
                            <div className="px-3 py-1 bg-kadris-terracotta/10 text-kadris-terracotta font-bold text-sm rounded-full">
                                {properties.length} {properties.length > 1 ? 'biens' : 'bien'}
                            </div>
                        </div>

                        {properties.length === 0 ? (
                            <p className="text-kadris-slate/60 text-center py-8">Vous n'avez pas encore revendiqué de propriété.</p>
                        ) : (
                            <div className="space-y-4">
                                {properties.map((prop) => (
                                    <Link
                                        key={prop.id}
                                        href={`/dashboard?propertyId=${prop.id}`}
                                        className="block p-4 border border-kadris-slate/20 rounded-lg hover:border-kadris-terracotta hover:bg-kadris-terracotta/5 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-serif font-bold text-kadris-slate group-hover:text-kadris-terracotta transition-colors">
                                                    {prop.data.adresse_ban}
                                                </h3>
                                                <p className="text-sm text-kadris-slate/60 mt-1">
                                                    Revendiqué le {new Date(prop.claimedAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <span className="text-xs text-kadris-slate/40 group-hover:text-kadris-terracotta transition-colors">
                                                Voir le dashboard →
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Data & Privacy Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white border border-kadris-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-kadris-slate/10">
                            <Shield className="text-kadris-slate" size={24} />
                            <h2 className="text-2xl font-serif font-bold text-kadris-slate">Confidentialité et Données</h2>
                        </div>

                        <div className="space-y-6 text-kadris-slate/80">
                            <div>
                                <h3 className="font-bold text-kadris-slate mb-2">Protection de vos données</h3>
                                <p className="text-sm leading-relaxed">
                                    Kadris s'engage à protéger vos données personnelles. Toutes vos informations sont stockées de manière sécurisée
                                    et ne sont jamais partagées avec des tiers sans votre consentement explicite.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-kadris-slate mb-2">Vos droits</h3>
                                <ul className="text-sm space-y-2 list-disc list-inside">
                                    <li>Droit d'accès à vos données personnelles</li>
                                    <li>Droit de rectification de vos informations</li>
                                    <li>Droit à l'effacement de vos données</li>
                                    <li>Droit à la portabilité de vos données</li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-kadris-slate/10">
                                <p className="text-xs text-kadris-slate/60">
                                    Pour exercer vos droits ou pour toute question concernant vos données,
                                    contactez-nous à <a href="mailto:privacy@kadris.fr" className="text-kadris-terracotta hover:underline">privacy@kadris.fr</a>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Account Actions Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white border border-kadris-slate/10 rounded-lg p-8"
                    >
                        <h2 className="text-xl font-serif font-bold text-kadris-slate mb-6">Actions du compte</h2>

                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-kadris-slate text-white font-bold uppercase tracking-wider hover:bg-kadris-slate/90 transition-colors rounded-sm"
                            >
                                <LogOut size={18} />
                                <span>Se déconnecter</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
                                        // TODO: Implement account deletion
                                        alert('Fonctionnalité à venir');
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 font-bold uppercase tracking-wider hover:bg-red-50 transition-colors rounded-sm"
                            >
                                <Trash2 size={18} />
                                <span>Supprimer mon compte</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
