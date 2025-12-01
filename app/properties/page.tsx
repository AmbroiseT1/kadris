"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Calendar, Home, ArrowRight, Shield, AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser, getCurrentUserProperties, removePropertyFromCurrentUser } from '@/utils/propertyStorage';
import ProfileDropdown from '@/components/ui/ProfileDropdown';

interface Property {
    id: string;
    data: {
        adresse_ban: string;
        annee_construction: string;
        dpe_lettre: string;
        surface_sol: number;
        nb_logements: number;
        usage: string;
        rnb_id?: string;
    };
    claimedAt: string;
}

export default function PropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();
        setPropertyToDelete(propertyId);
    };

    const confirmDelete = () => {
        if (propertyToDelete) {
            removePropertyFromCurrentUser(propertyToDelete);
            setProperties(properties.filter(p => p.id !== propertyToDelete));
            setPropertyToDelete(null);
        }
    };

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
                    <div className="w-16 h-16 border-4 border-bricq-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-bricq-slate font-medium">Chargement de vos biens...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfbf7] p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
                <Link href="/" className="flex items-center gap-3 text-bricq-slate hover:opacity-70 transition-opacity">
                    <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
                    <span className="text-3xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                </Link>
                <div className="flex items-center gap-4">
                    <ProfileDropdown />
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="font-serif text-4xl font-bold text-bricq-slate mb-4">Mes Biens</h1>
                    <p className="text-bricq-slate/60 text-lg">Sélectionnez le bien que vous souhaitez gérer.</p>
                </div>

                {properties.length === 0 ? (
                    <div className="text-center py-16">
                        <Building size={64} className="mx-auto mb-6 text-bricq-slate/20" />
                        <h2 className="font-serif text-2xl font-bold text-bricq-slate mb-4">Aucun bien revendiqué</h2>
                        <p className="text-bricq-slate/60 mb-8">Commencez par revendiquer votre premier bien immobilier.</p>
                        <Link href="/login" className="inline-block px-8 py-4 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors">
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
                                className="group bg-white rounded-sm border border-bricq-slate/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            >
                                {/* Header */}
                                <div className="p-6 bg-bricq-slate/5 border-b border-bricq-slate/10">
                                    <div className="flex items-center gap-2 mb-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building size={20} className="text-bricq-terracotta" />
                                            <h3 className="font-serif text-xl font-bold text-bricq-slate">{property.data.usage || 'Bien immobilier'}</h3>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, property.id)}
                                            className="text-bricq-slate/40 hover:text-red-500 transition-colors p-1"
                                            title="Supprimer ce bien"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-2 text-bricq-slate/60 text-sm">
                                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{property.data.adresse_ban}</span>
                                    </div>
                                    {property.data.rnb_id && (
                                        <div className="mt-2 text-xs text-bricq-slate/50 font-mono bg-white/50 inline-block px-1.5 py-0.5 rounded border border-bricq-slate/5">
                                            RNB: {property.data.rnb_id}
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="p-6 space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-bricq-slate/50 text-xs mb-1">Construction</p>
                                            <p className="font-bold text-bricq-slate">{property.data.annee_construction}</p>
                                        </div>
                                        <div>
                                            <p className="text-bricq-slate/50 text-xs mb-1">DPE</p>
                                            <p className="font-bold text-bricq-slate text-2xl">{property.data.dpe_lettre}</p>
                                        </div>
                                        <div>
                                            <p className="text-bricq-slate/50 text-xs mb-1">Surface</p>
                                            <p className="font-bold text-bricq-slate">{property.data.surface_sol} m²</p>
                                        </div>
                                        <div>
                                            <p className="text-bricq-slate/50 text-xs mb-1">Logements</p>
                                            <p className="font-bold text-bricq-slate">{property.data.nb_logements}</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 py-3 bg-bricq-slate text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-bricq-slate/90 transition-colors">
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
                            className="bg-transparent rounded-sm border-2 border-dashed border-bricq-slate/20 flex flex-col items-center justify-center p-8 text-center hover:border-bricq-slate/40 hover:bg-bricq-slate/5 transition-all cursor-pointer group min-h-[380px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-bricq-slate/5 flex items-center justify-center text-bricq-slate/40 mb-4 group-hover:bg-bricq-slate/10 group-hover:text-bricq-slate transition-colors">
                                <Home size={32} />
                            </div>
                            <h3 className="font-serif text-lg font-bold text-bricq-slate mb-2">Ajouter un bien</h3>
                            <p className="text-bricq-slate/60 text-sm max-w-[200px]">
                                Revendiquez une nouvelle propriété pour l'ajouter à votre portefeuille.
                            </p>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {propertyToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold font-serif text-bricq-slate flex items-center gap-2">
                                        <AlertTriangle className="text-amber-500" size={24} />
                                        Confirmer la suppression
                                    </h3>
                                    <button
                                        onClick={() => setPropertyToDelete(null)}
                                        className="text-bricq-slate/40 hover:text-bricq-slate transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <p className="text-bricq-slate/80 mb-6">
                                    Êtes-vous sûr de vouloir supprimer ce bien ? <br />
                                    <span className="text-sm text-bricq-slate/60 mt-2 block">
                                        Note : Un réajout de cette propriété entraînera une nouvelle vérification complète.
                                    </span>
                                </p>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setPropertyToDelete(null)}
                                        className="px-4 py-2 text-bricq-slate font-medium hover:bg-bricq-slate/5 rounded-md transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
