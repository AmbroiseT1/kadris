"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, Loader2, MapPin, X } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import OwnershipBadge from '@/components/dashboard/OwnershipBadge';
import {
    adminApi, apiErrorMessage, documentsApi, type AdminProperty, type OwnershipStatus,
} from '@/app/lib/api';

const FILTERS: { id: OwnershipStatus | 'all'; label: string }[] = [
    { id: 'pending', label: 'En attente' },
    { id: 'verified', label: 'Vérifiés' },
    { id: 'rejected', label: 'Refusés' },
    { id: 'all', label: 'Tous' },
];

/** Vérification des justificatifs de propriété. Les droits sont contrôlés par l'API (403). */
export default function AdminVerificationPage() {
    const { user, isAdmin, isLoading: authLoading } = useAuth();
    const [filter, setFilter] = useState<OwnershipStatus | 'all'>('pending');
    // Dernier chargement terminé, associé au filtre demandé : « loading » en est dérivé
    const [result, setResult] = useState<{ filter: OwnershipStatus | 'all' | null; items: AdminProperty[]; error: string | null }>({
        filter: null,
        items: [],
        error: null,
    });
    const [actionError, setActionError] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, string>>({});

    const canLoad = !!user && isAdmin;

    useEffect(() => {
        if (!canLoad) return;
        let cancelled = false;
        adminApi.listProperties(filter)
            .then((data) => { if (!cancelled) setResult({ filter, items: data, error: null }); })
            .catch((e) => {
                if (!cancelled) {
                    setResult({ filter, items: [], error: apiErrorMessage(e, 'Impossible de charger les biens.') });
                }
            });
        return () => { cancelled = true; };
    }, [canLoad, filter]);

    const items = result.items;
    const loading = result.filter !== filter;
    const error = actionError ?? (loading ? null : result.error);
    const setItems = (update: (prev: AdminProperty[]) => AdminProperty[]) =>
        setResult((r) => ({ ...r, items: update(r.items) }));

    const decide = async (id: string, status: 'verified' | 'rejected') => {
        setBusy(id);
        setActionError(null);
        try {
            const updated = await adminApi.setOwnership(id, status, comments[id]);
            setItems((prev) =>
                filter === 'all' ? prev.map((p) => (p.id === id ? updated : p)) : prev.filter((p) => p.id !== id),
            );
        } catch (e) {
            setActionError(apiErrorMessage(e));
        } finally {
            setBusy(null);
        }
    };

    const download = async (propertyId: string, doc: AdminProperty['proof_documents'][number]) => {
        try {
            await documentsApi.download(propertyId, doc);
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Téléchargement impossible.'));
        }
    };

    if (authLoading) return null;
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-papier flex items-center justify-center p-8">
                <p className="text-texte">Accès réservé aux administrateurs.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-papier p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/properties" className="inline-flex items-center gap-2 text-texte-2 hover:text-texte mb-8">
                    <ArrowLeft size={18} /> Retour à mes biens
                </Link>
                <h1 className="font-serif text-4xl font-bold text-texte mb-6">Justificatifs de propriété</h1>

                <div className="flex gap-2 mb-6">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => { setFilter(f.id); setActionError(null); }}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${filter === f.id ? 'bg-encre text-white' : 'bg-papier text-texte-2 hover:bg-trait'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error && <p role="alert" className="mb-4 text-sm text-alerte">{error}</p>}

                {loading ? (
                    <div className="flex items-center gap-2 text-texte-2"><Loader2 className="animate-spin" size={18} /> Chargement...</div>
                ) : items.length === 0 ? (
                    <p className="text-texte-2 py-12 text-center">Aucun bien dans cette catégorie.</p>
                ) : (
                    <ul className="space-y-4">
                        {items.map((p) => (
                            <li key={p.id} className="bg-white border border-trait p-5">
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <p className="font-serif font-bold text-texte flex items-center gap-2">
                                            <MapPin size={16} className="text-brique" /> {p.address_label}
                                        </p>
                                        <p className="text-xs text-texte-2 mt-1">
                                            {p.owner_email} · ajouté le {new Date(p.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <OwnershipBadge status={p.ownership_status} comment={p.ownership_comment} />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {p.proof_documents.length === 0 ? (
                                        <span className="text-xs text-alerte">Aucun justificatif fourni</span>
                                    ) : p.proof_documents.map((d) => (
                                        <button
                                            key={d.id}
                                            onClick={() => download(p.id, d)}
                                            className="flex items-center gap-1 text-xs border border-trait px-2 py-1 hover:bg-encre-soft"
                                        >
                                            <Download size={12} /> {d.original_filename || d.title}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        maxLength={1000}
                                        placeholder="Commentaire pour le propriétaire (optionnel)"
                                        value={comments[p.id] ?? ''}
                                        onChange={(e) => setComments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                        className="flex-1 min-w-[220px] px-3 py-1.5 text-sm border border-trait-fort"
                                    />
                                    <button
                                        onClick={() => decide(p.id, 'verified')}
                                        disabled={busy === p.id}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase bg-ok text-white disabled:opacity-50"
                                    >
                                        <Check size={14} /> Valider
                                    </button>
                                    <button
                                        onClick={() => decide(p.id, 'rejected')}
                                        disabled={busy === p.id}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase bg-alerte text-white disabled:opacity-50"
                                    >
                                        <X size={14} /> Refuser
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
