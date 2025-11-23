"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Calendar, Home, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser, getCurrentUserProperties } from '@/utils/propertyStorage';

interface Property {
    id: string;
    data: {
        adresse_ban: string;
        annee_construction: string;
        dpe_lettre: string;
        surface_sol: number;
        nb_logements: number;
        usage: string;
    };
    claimedAt: string;
}

export default function PropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        // Get current user
        const user = getCurrentUser();
        setCurrentUser(user);

        if (!user) {
            // No user logged in, redirect to login
            router.push('/login');
            return;
        }

        // Load properties for current user
        const userProps = getCurrentUserProperties();
        setProperties(userProps);
        setIsLoading(false);
    }, [router]);

    const handlePropertyClick = (propertyId: string) => {
        router.push(`/dashboard?propertyId=${propertyId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-kadris-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-kadris-slate font-medium">Chargement de vos biens...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
                <Link href="/" className="flex items-center gap-3 text-kadris-slate hover:opacity-70 transition-opacity">
                    <img src="/kadris-logo.png" alt="Kadris Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
                    <span className="text-3xl font-bold font-serif tracking-tighter text-kadris-slate">Kadris</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-kadris-slate">Ambroise Torris</p>
                        <p className="text-xs text-kadris-slate/50">Propriétaire</p>
                    </div>
                    <div className="w-10 h-10 bg-kadris-slate text-white rounded-full flex items-center justify-center font-serif font-bold">
                        AT
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="font-serif text-4xl font-bold text-kadris-slate mb-4">Mes Biens</h1>
                    <p className="text-kadris-slate/60 text-lg">Sélectionnez le bien que vous souhaitez gérer.</p>
                </div>

                {properties.length === 0 ? (
                    <div className="text-center py-16">
                        <Building size={64} className="mx-auto mb-6 text-kadris-slate/20" />
                        <h2 className="font-serif text-2xl font-bold text-kadris-slate mb-4">Aucun bien revendiqué</h2>
                        <p className="text-kadris-slate/60 mb-8">Commencez par revendiquer votre premier bien immobilier.</p>
                        <Link href="/login" className="inline-block px-8 py-4 bg-kadris-slate text-white font-bold uppercase tracking-wider hover:bg-kadris-slate/90 transition-colors">
                            Revendiquer un bien
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property, index) => (
                            <motion.div
                                key={property.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handlePropertyClick(property.id)}
                                className="group bg-white rounded-sm border border-kadris-slate/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            >
                                {/* Header */}
                                <div className="p-6 bg-kadris-slate/5 border-b border-kadris-slate/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building size={20} className="text-kadris-terracotta" />
                                        <h3 className="font-serif text-xl font-bold text-kadris-slate">{property.data.usage || 'Bien immobilier'}</h3>
                                    </div>
                                    <div className="flex items-start gap-2 text -kadris-slate/60 text-sm">
                                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{property.data.adresse_ban}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="p-6 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-kadris-slate/50 text-xs mb-1">Construction</p>
                                            <p className="font-bold text-kadris-slate">{property.data.annee_construction}</p>
                                        </div>
                                        <div>
                                            <p className="text-kadris-slate/50 text-xs mb-1">DPE</p>
                                            <p className="font-bold text-kadris-slate text-2xl">{property.data.dpe_lettre}</p>
                                        </div>
                                        <div>
                                            <p className="text-kadris-slate/50 text-xs mb-1">Surface</p>
                                            <p className="font-bold text-kadris-slate">{property.data.surface_sol} m²</p>
                                        </div>
                                        <div>
                                            <p className="text-kadris-slate/50 text-xs mb-1">Logements</p>
                                            <p className="font-bold text-kadris-slate">{property.data.nb_logements}</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 py-3 bg-kadris-slate text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-kadris-slate/90 transition-colors">
                                        Accéder au Dashboard <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {/* Add New Property Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: properties.length * 0.1 }}
                            onClick={() => router.push('/properties/add')}
                            className="bg-transparent rounded-sm border-2 border-dashed border-kadris-slate/20 flex flex-col items-center justify-center p-8 text-center hover:border-kadris-slate/40 hover:bg-kadris-slate/5 transition-all cursor-pointer group min-h-[380px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-kadris-slate/5 flex items-center justify-center text-kadris-slate/40 mb-4 group-hover:bg-kadris-slate/10 group-hover:text-kadris-slate transition-colors">
                                <Home size={32} />
                            </div>
                            <h3 className="font-serif text-lg font-bold text-kadris-slate mb-2">Ajouter un bien</h3>
                            <p className="text-kadris-slate/60 text-sm max-w-[200px]">
                                Revendiquez une nouvelle propriété pour l'ajouter à votre portefeuille.
                            </p>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
