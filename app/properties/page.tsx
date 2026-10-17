"use client";

import { LogoMark } from "@/components/ui/Logo";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Home, ArrowRight, AlertTriangle, Trash2, X, Upload, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileDropdown from '@/components/ui/ProfileDropdown';
import OwnershipBadge from '@/components/dashboard/OwnershipBadge';
import { useAuth } from '@/app/context/AuthContext';
import { apiErrorMessage, propertiesApi, type Property } from '@/app/lib/api';
import {
    clearLegacyProperties, getLegacyProperties, legacyToPropertyFields, type LegacyProperty,
} from '@/utils/propertyStorage';

type BuildingSummary = {
    annee_construction?: string;
    dpe_lettre?: string;
    surface_sol?: number;
    nb_logements?: number;
    usage?: string;
    rnb_id?: string;
};

const summary = (p: Property): BuildingSummary => (p.building_data ?? {}) as BuildingSummary;
const show = (v: unknown, suffix = '') => (v === undefined || v === null || v === '' ? '—' : `${v}${suffix}`);

/** Import des biens enregistrés dans ce navigateur avant le stockage serveur. */
function LegacyImport({ email, isAdmin, onImported }: { email: string; isAdmin: boolean; onImported: (p: Property) => void }) {
    // LegacyImport n'est rendu que côté client, après le chargement de l'utilisateur
    const [items, setItems] = useState<LegacyProperty[]>(() => getLegacyProperties(email));
    const [proofs, setProofs] = useState<Record<string, File | null>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (items.length === 0) return null;

    const importOne = async (item: LegacyProperty) => {
        setBusy(item.id);
        setError(null);
        try {
            const created = await propertiesApi.create(legacyToPropertyFields(item), proofs[item.id] ?? null);
            clearLegacyProperties(email, item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            onImported(created);
        } catch (e) {
            setError(apiErrorMessage(e, "L'import a échoué."));
        } finally {
            setBusy(null);
        }
    };

    const dismiss = () => {
        if (window.confirm("Effacer de ce navigateur les biens non importés ?")) {
            clearLegacyProperties(email);
            setItems([]);
        }
    };

    return (
        <div className="mb-10 p-6 bg-vigil-soft border border-vigil/30 rounded-sm">
            <h2 className="font-serif text-xl font-bold text-texte mb-1">Biens enregistrés sur cet appareil</h2>
            <p className="text-sm text-texte-2 mb-4">
                Ces biens n&apos;étaient sauvegardés que dans ce navigateur. Importez-les dans votre compte
                {isAdmin ? '.' : ' en joignant un justificatif de propriété pour chacun.'}
            </p>
            <ul className="space-y-3">
                {items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 bg-white p-3 border border-vigil/30">
                        <MapPin size={16} className="text-brique" />
                        <span className="flex-1 min-w-[200px] text-sm font-medium text-texte">{item.data.adresse_ban}</span>
                        {!isAdmin && (
                            <label className="text-xs flex items-center gap-1 cursor-pointer text-texte-2 hover:text-texte">
                                <Upload size={14} />
                                <span className="truncate max-w-[160px]">{proofs[item.id]?.name || 'Justificatif'}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setProofs((prev) => ({ ...prev, [item.id]: f }));
                                    }}
                                />
                            </label>
                        )}
                        <button
                            type="button"
                            onClick={() => importOne(item)}
                            disabled={busy !== null || (!isAdmin && !proofs[item.id])}
                            className="px-3 py-1.5 text-xs font-bold uppercase bg-encre text-white disabled:opacity-50 flex items-center gap-1"
                        >
                            {busy === item.id && <Loader2 size={12} className="animate-spin" />}
                            Importer
                        </button>
                    </li>
                ))}
            </ul>
            {error && <p role="alert" className="mt-3 text-sm text-alerte">{error}</p>}
            <button type="button" onClick={dismiss} className="mt-4 text-xs underline text-texte-2 hover:text-texte">
                Ne pas importer et effacer de ce navigateur
            </button>
        </div>
    );
}

export default function PropertiesPage() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [reloadKey, setReloadKey] = useState(0);

    // Rechargement manuel (bouton « Réessayer »)
    const load = useCallback(() => {
        setIsLoading(true);
        setLoadError(null);
        setReloadKey((k) => k + 1);
    }, []);

    useEffect(() => {
        // La redirection des visiteurs non connectés est gérée par AuthContext
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                const list = await propertiesApi.list();
                if (!cancelled) setProperties(list);
            } catch (e) {
                if (!cancelled) setLoadError(apiErrorMessage(e, "Impossible de charger vos biens."));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user, reloadKey]);

    const handleDeleteClick = (e: React.MouseEvent, propertyId: string) => {
        e.stopPropagation();
        setDeleteError(null);
        setPropertyToDelete(propertyId);
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;
        setIsDeleting(true);
        try {
            await propertiesApi.remove(propertyToDelete);
            setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete));
            setPropertyToDelete(null);
        } catch (e) {
            setDeleteError(apiErrorMessage(e, "La suppression a échoué."));
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePropertyClick = (propertyId: string) => {
        router.push(`/dashboard?propertyId=${encodeURIComponent(propertyId)}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-papier flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brique border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-texte font-medium">Chargement de vos biens...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-papier p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
                <Link href="/" className="flex items-center gap-3 text-texte hover:opacity-70 transition-opacity">
                    <LogoMark className="w-10 h-10 text-encre" />
                    <span className="text-3xl font-bold font-serif tracking-tighter text-texte">bricq</span>
                </Link>
                <div className="flex items-center gap-4">
                    <ProfileDropdown />
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-texte mb-4">Mes Biens</h1>
                        <p className="text-texte-2 text-lg">Sélectionnez le bien que vous souhaitez gérer.</p>
                    </div>
                    {isAdmin && (
                        <Link href="/properties/admin" className="flex items-center gap-2 text-sm font-bold text-texte border border-trait px-4 py-2 hover:bg-encre-soft">
                            <ShieldCheck size={16} /> Vérifier les justificatifs
                        </Link>
                    )}
                </div>

                {user && (
                    <LegacyImport
                        email={user.email}
                        isAdmin={isAdmin}
                        onImported={(p) => setProperties((prev) => [...prev, p])}
                    />
                )}

                {loadError ? (
                    <div role="alert" className="text-center py-16">
                        <p className="text-alerte mb-4">{loadError}</p>
                        <button onClick={load} className="px-6 py-3 bg-encre text-white font-bold uppercase tracking-wider">
                            Réessayer
                        </button>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <Building size={64} className="mx-auto mb-6 text-texte-2" />
                        <h2 className="font-serif text-2xl font-bold text-texte mb-4">Ajoutez votre premier bien</h2>
                        <p className="text-texte-2 mb-8">Revendiquez votre bien immobilier pour suivre ses travaux, charges et documents.</p>
                        <Link href="/properties/add" className="inline-block px-8 py-4 bg-encre text-white font-bold uppercase tracking-wider hover:bg-encre/90 transition-colors">
                            Ajouter un bien
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property, index) => {
                            const b = summary(property);
                            return (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handlePropertyClick(property.id)}
                                    className="group bg-white rounded-sm border border-trait overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                >
                                    {/* Header */}
                                    <div className="p-6 bg-encre-soft border-b border-trait">
                                        <div className="flex items-center gap-2 mb-2 justify-between">
                                            <div className="flex items-center gap-2">
                                                <Building size={20} className="text-brique" />
                                                <h3 className="font-serif text-xl font-bold text-texte">{b.usage || 'Bien immobilier'}</h3>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, property.id)}
                                                className="text-texte-2 hover:text-alerte transition-colors p-1"
                                                title="Supprimer ce bien"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-2 text-texte-2 text-sm">
                                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>{property.address_label}</span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <OwnershipBadge status={property.ownership_status} comment={property.ownership_comment} />
                                            {b.rnb_id && (
                                                <span className="text-xs text-texte-2 font-mono bg-white/50 inline-block px-1.5 py-0.5 rounded border border-trait">
                                                    RNB: {b.rnb_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="p-6 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-texte-2 text-xs mb-1">Construction</p>
                                                <p className="font-bold text-texte">{show(b.annee_construction)}</p>
                                            </div>
                                            <div>
                                                <p className="text-texte-2 text-xs mb-1">DPE</p>
                                                <p className="font-bold text-texte text-2xl">{show(b.dpe_lettre)}</p>
                                            </div>
                                            <div>
                                                <p className="text-texte-2 text-xs mb-1">Surface</p>
                                                <p className="font-bold text-texte">{show(b.surface_sol, ' m²')}</p>
                                            </div>
                                            <div>
                                                <p className="text-texte-2 text-xs mb-1">Logements</p>
                                                <p className="font-bold text-texte">{show(b.nb_logements)}</p>
                                            </div>
                                        </div>

                                        <button className="w-full mt-4 py-3 bg-encre text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-encre/90 transition-colors">
                                            Accéder au Dashboard <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Add New Property Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: properties.length * 0.1 }}
                            onClick={() => router.push('/properties/add')}
                            className="bg-transparent rounded-sm border-2 border-dashed border-trait flex flex-col items-center justify-center p-8 text-center hover:border-trait-fort hover:bg-encre-soft transition-all cursor-pointer group min-h-[380px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-encre-soft flex items-center justify-center text-texte-2 mb-4 group-hover:bg-encre-soft group-hover:text-texte transition-colors">
                                <Home size={32} />
                            </div>
                            <h3 className="font-serif text-lg font-bold text-texte mb-2">Ajouter un bien</h3>
                            <p className="text-texte-2 text-sm max-w-[200px]">
                                Revendiquez une nouvelle propriété pour l&apos;ajouter à votre portefeuille.
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
                                    <h3 className="text-xl font-bold font-serif text-texte flex items-center gap-2">
                                        <AlertTriangle className="text-vigil" size={24} />
                                        Confirmer la suppression
                                    </h3>
                                    <button
                                        onClick={() => setPropertyToDelete(null)}
                                        className="text-texte-2 hover:text-texte transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <p className="text-texte mb-6">
                                    Êtes-vous sûr de vouloir supprimer ce bien ? <br />
                                    <span className="text-sm text-texte-2 mt-2 block">
                                        Ses travaux, charges, tâches et documents seront définitivement supprimés.
                                        Un réajout entraînera une nouvelle vérification.
                                    </span>
                                </p>
                                {deleteError && <p role="alert" className="mb-4 text-sm text-alerte">{deleteError}</p>}

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setPropertyToDelete(null)}
                                        className="px-4 py-2 text-texte font-medium hover:bg-encre-soft rounded-md transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 bg-alerte text-white font-medium rounded-md hover:bg-alerte transition-colors shadow-sm disabled:opacity-60"
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
