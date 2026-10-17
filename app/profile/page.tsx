"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, LogOut, Home, Shield, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import { apiErrorMessage, propertiesApi, type Property } from '@/app/lib/api';
import OwnershipBadge from '@/components/dashboard/OwnershipBadge';

export default function ProfilePage() {
    // La redirection des visiteurs non connectés est gérée par AuthContext
    const { user: userProfile, isLoading: authLoading, logout } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertiesError, setPropertiesError] = useState<string | null>(null);
    const [loadingProperties, setLoadingProperties] = useState(true);

    useEffect(() => {
        if (!userProfile) return;
        propertiesApi.list()
            .then(setProperties)
            .catch((e) => setPropertiesError(apiErrorMessage(e, "Impossible de charger vos biens.")))
            .finally(() => setLoadingProperties(false));
    }, [userProfile]);

    const handleLogout = () => {
        logout();
    };

    const isLoading = authLoading || (!!userProfile && loadingProperties);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-bricq-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-bricq-slate font-medium">Chargement de votre profil...</p>
                </div>
            </div>
        );
    }

    if (!userProfile) return null;

    return (
        <div className="min-h-screen bg-[#fdfbf7]">
            {/* Header */}
            <header className="bg-white border-b border-bricq-slate/10">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/properties" className="flex items-center gap-3">
                            <img src="/bricq-logo.png" alt="bricq Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
                            <span className="text-3xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                        </Link>
                        <Link
                            href="/properties"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-bricq-slate/60 hover:text-bricq-slate transition-colors"
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
                        <h1 className="text-4xl font-serif font-bold text-bricq-slate mb-2">Mon Profil</h1>
                        <p className="text-bricq-slate/60">Gérez vos informations personnelles et vos paramètres de compte.</p>
                    </div>

                    {/* User Information Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-bricq-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bricq-slate/10">
                            <User className="text-bricq-slate" size={24} />
                            <h2 className="text-2xl font-serif font-bold text-bricq-slate">Informations personnelles</h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-bricq-slate/60 mb-2">Email</label>
                                <p className="text-lg font-medium text-bricq-slate">{userProfile.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-bricq-slate/60 mb-2">Membre depuis</label>
                                <p className="text-lg font-medium text-bricq-slate">
                                    {new Date(userProfile.created_at).toLocaleDateString('fr-FR', {
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
                        className="bg-white border border-bricq-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-bricq-slate/10">
                            <div className="flex items-center gap-3">
                                <Home className="text-bricq-slate" size={24} />
                                <h2 className="text-2xl font-serif font-bold text-bricq-slate">Mes Biens Immobiliers</h2>
                            </div>
                            <div className="px-3 py-1 bg-bricq-terracotta/10 text-bricq-terracotta font-bold text-sm rounded-full">
                                {properties.length} {properties.length > 1 ? 'biens' : 'bien'}
                            </div>
                        </div>

                        {propertiesError ? (
                            <p role="alert" className="text-red-700 text-center py-8">{propertiesError}</p>
                        ) : properties.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-bricq-slate/60 mb-4">Vous n&apos;avez pas encore ajouté de bien.</p>
                                <Link href="/properties/add" className="text-bricq-terracotta font-bold hover:underline">
                                    Ajoutez votre premier bien
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {properties.map((prop) => (
                                    <Link
                                        key={prop.id}
                                        href={`/dashboard?propertyId=${encodeURIComponent(prop.id)}`}
                                        className="block p-4 border border-bricq-slate/20 rounded-lg hover:border-bricq-terracotta hover:bg-bricq-terracotta/5 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-serif font-bold text-bricq-slate group-hover:text-bricq-terracotta transition-colors">
                                                    {prop.address_label}
                                                </h3>
                                                <p className="text-sm text-bricq-slate/60 mt-1 flex items-center gap-2">
                                                    Ajouté le {new Date(prop.created_at).toLocaleDateString('fr-FR')}
                                                    <OwnershipBadge status={prop.ownership_status} comment={prop.ownership_comment} />
                                                </p>
                                            </div>
                                            <span className="text-xs text-bricq-slate/40 group-hover:text-bricq-terracotta transition-colors">
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
                        className="bg-white border border-bricq-slate/10 rounded-lg p-8"
                    >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-bricq-slate/10">
                            <Shield className="text-bricq-slate" size={24} />
                            <h2 className="text-2xl font-serif font-bold text-bricq-slate">Confidentialité et Données</h2>
                        </div>

                        <div className="space-y-6 text-bricq-slate/80">
                            <div>
                                <h3 className="font-bold text-bricq-slate mb-2">Protection de vos données</h3>
                                <p className="text-sm leading-relaxed">
                                    bricq s’engage à protéger vos données personnelles. Toutes vos informations sont stockées de manière sécurisée
                                    et ne sont jamais partagées avec des tiers sans votre consentement explicite.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-bricq-slate mb-2">Vos droits</h3>
                                <ul className="text-sm space-y-2 list-disc list-inside">
                                    <li>Droit d’accès à vos données personnelles</li>
                                    <li>Droit de rectification de vos informations</li>
                                    <li>Droit à l’effacement de vos données</li>
                                    <li>Droit à la portabilité de vos données</li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-bricq-slate/10">
                                <p className="text-xs text-bricq-slate/60">
                                    Pour exercer vos droits ou pour toute question concernant vos données,
                                    contactez-nous à <a href="mailto:privacy@bricq.fr" className="text-bricq-terracotta hover:underline">privacy@bricq.fr</a>
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Account Actions Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white border border-bricq-slate/10 rounded-lg p-8"
                    >
                        <h2 className="text-xl font-serif font-bold text-bricq-slate mb-6">Actions du compte</h2>

                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors rounded-sm"
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
