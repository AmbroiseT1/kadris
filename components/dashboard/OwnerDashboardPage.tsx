"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import ArchitecturalViewer from "./ArchitecturalViewer";
import TechnicalNavBar from "./TechnicalNavBar";
import DetailDrawer, { type OwnerActions } from "./DetailDrawer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddWorkModal from "./modals/AddWorkModal";
import AddTaskModal from "./modals/AddTaskModal";
import AddExpenseModal from "./modals/AddExpenseModal";
import AddDocumentModal from "./modals/AddDocumentModal";
import OwnershipBadge from "./OwnershipBadge";
import { useResource } from "./useResource";
import { fetchDVF, TransactionDVF, fetchMarketStats, BackendMarketStats } from "@/app/lib/dvf";
import { fetchRisks } from "@/app/lib/georisques";
import { fetchQuartier } from "@/app/lib/quartier";
import type { BuildingData } from "@/app/lib/types";
import {
    apiErrorMessage, documentsApi, DOC_TYPE_OWNERSHIP_PROOF, expensesApi, propertiesApi, tasksApi, worksApi,
    type Property,
} from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import NotepadWidget from "./widgets/NotepadWidget";
import ProfileDropdown from "@/components/ui/ProfileDropdown";

/** Données attendues par les onglets du rapport, construites depuis le bien enregistré. */
function toBuildingData(p: Property): BuildingData {
    const b = (p.building_data ?? {}) as Partial<BuildingData>;
    return {
        ...b,
        fiabilite: b.fiabilite ?? "Non évaluée",
        adresse_ban: p.address_label,
        coords: p.lat != null && p.lon != null ? { lat: p.lat, lon: p.lon } : b.coords,
    };
}

export default function OwnerDashboardPage() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [activeCategory, setActiveCategory] = useState<string>("overview");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [property, setProperty] = useState<Property | null>(null);
    const [extraData, setExtraData] = useState<Partial<BuildingData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
    const [marketStats, setMarketStats] = useState<BackendMarketStats | null>(null);
    const [loadingDVF, setLoadingDVF] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // Modal States
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [documentModalType, setDocumentModalType] = useState<string | null>(null);

    const propertyId = property?.id ?? null;
    const works = useResource(propertyId, worksApi.list, "Impossible de charger les travaux.");
    const tasks = useResource(propertyId, tasksApi.list, "Impossible de charger les tâches.");
    const expenses = useResource(propertyId, expensesApi.list, "Impossible de charger les charges.");
    const documents = useResource(propertyId, documentsApi.list, "Impossible de charger les documents.");

    // Chargement du bien (celui demandé dans l'URL, sinon le premier)
    useEffect(() => {
        if (!user) return; // AuthContext redirige les visiteurs non connectés
        let cancelled = false;
        async function loadProperty() {
            setIsLoading(true);
            setLoadError(null);
            setExtraData({});
            try {
                const wanted = searchParams.get('propertyId');
                let selected: Property | null = null;
                if (wanted) {
                    selected = await propertiesApi.get(wanted);
                } else {
                    const list = await propertiesApi.list();
                    selected = list[0] ?? null;
                }
                if (!cancelled) setProperty(selected);
            } catch (e) {
                if (!cancelled) {
                    setProperty(null);
                    setLoadError(apiErrorMessage(e, "Impossible de charger votre bien."));
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadProperty();
        return () => { cancelled = true; };
    }, [searchParams, user, reloadKey]);

    // Données publiques complémentaires (DVF, risques, quartier)
    useEffect(() => {
        if (property?.lat == null || property?.lon == null) return;
        const { lat, lon } = property;
        let cancelled = false;
        setLoadingDVF(true);
        Promise.all([fetchDVF(lat, lon), fetchRisks(lat, lon), fetchQuartier(lat, lon), fetchMarketStats(lat, lon)])
            .then(([dvf, risks, quartier, stats]) => {
                if (cancelled) return;
                setDvfData(dvf || []);
                setMarketStats(stats);
                setExtraData({
                    ...(risks ? { risques_detailles: risks } : {}),
                    ...(quartier ? { quartier } : {}),
                });
            })
            .catch(() => { /* données facultatives : les onglets gèrent leur absence */ })
            .finally(() => { if (!cancelled) setLoadingDVF(false); });
        return () => { cancelled = true; };
    }, [property?.id, property?.lat, property?.lon]);

    const propertyData = useMemo<BuildingData | null>(
        () => (property ? { ...toBuildingData(property), ...extraData } : null),
        [property, extraData],
    );

    const refreshProperty = useCallback(async () => {
        if (!propertyId) return;
        try {
            setProperty(await propertiesApi.get(propertyId));
        } catch { /* le statut sera rafraîchi au prochain chargement */ }
    }, [propertyId]);

    const run = async (fn: () => Promise<void>, failure: string) => {
        setActionError(null);
        try {
            await fn();
        } catch (e) {
            setActionError(apiErrorMessage(e, failure));
        }
    };

    const actions: OwnerActions = {
        onAddWork: () => setIsAddWorkOpen(true),
        onAddTask: () => setIsAddTaskOpen(true),
        onAddExpense: () => setIsAddExpenseOpen(true),
        onAddDocument: () => setDocumentModalType('AUTRE'),
        onDeleteWork: (w) => {
            if (!propertyId || !confirm(`Supprimer « ${w.title} » ?`)) return;
            run(async () => {
                await worksApi.remove(propertyId, w.id);
                works.setItems((prev) => prev.filter((x) => x.id !== w.id));
            }, "La suppression a échoué.");
        },
        onToggleTask: (t) => {
            if (!propertyId) return;
            run(async () => {
                const updated = await tasksApi.update(propertyId, t.id, { done: !t.done });
                tasks.setItems((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
            }, "La mise à jour a échoué.");
        },
        onDeleteTask: (t) => {
            if (!propertyId || !confirm(`Supprimer « ${t.title} » ?`)) return;
            run(async () => {
                await tasksApi.remove(propertyId, t.id);
                tasks.setItems((prev) => prev.filter((x) => x.id !== t.id));
            }, "La suppression a échoué.");
        },
        onDeleteExpense: (e) => {
            if (!propertyId || !confirm(`Supprimer « ${e.label} » ?`)) return;
            run(async () => {
                await expensesApi.remove(propertyId, e.id);
                expenses.setItems((prev) => prev.filter((x) => x.id !== e.id));
            }, "La suppression a échoué.");
        },
        onDownloadDocument: (d) => {
            if (!propertyId) return;
            run(() => documentsApi.download(propertyId, d), "Téléchargement impossible.");
        },
        onDeleteDocument: (d) => {
            if (!propertyId || !confirm(`Supprimer le document « ${d.title} » ?`)) return;
            run(async () => {
                await documentsApi.remove(propertyId, d.id);
                documents.setItems((prev) => prev.filter((x) => x.id !== d.id));
                if (d.doc_type === DOC_TYPE_OWNERSHIP_PROOF) refreshProperty();
            }, "La suppression a échoué.");
        },
    };

    const handleCategorySelect = (id: string) => {
        if (activeCategory === id && isDrawerOpen) {
            setIsDrawerOpen(false);
        } else {
            setActiveCategory(id);
            setIsDrawerOpen(true);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#fdfbf7]">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-bricq-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-bricq-slate font-medium">Chargement de votre bien...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {!isLoading && loadError && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                    <div role="alert" className="text-center max-w-md px-6">
                        <h2 className="text-2xl font-serif font-bold text-bricq-slate mb-4">Bien indisponible</h2>
                        <p className="text-bricq-slate/60 mb-6">{loadError}</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setReloadKey((k) => k + 1)} className="px-6 py-3 bg-bricq-slate text-white font-bold uppercase tracking-wider">
                                Réessayer
                            </button>
                            <Link href="/properties" className="px-6 py-3 border border-bricq-slate text-bricq-slate font-bold uppercase tracking-wider">
                                Mes biens
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !loadError && !property && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                    <div className="text-center max-w-md px-6">
                        <h2 className="text-2xl font-serif font-bold text-bricq-slate mb-4">Ajoutez votre premier bien</h2>
                        <p className="text-bricq-slate/60 mb-6">
                            Revendiquez votre bien pour suivre ses travaux, ses charges et ranger ses documents au même endroit.
                        </p>
                        <Link href="/properties/add" className="inline-block px-6 py-3 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors">
                            Ajouter un bien
                        </Link>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && property && propertyData && (
                <>
                    {/* LAYER 1: 3D Background */}
                    <motion.div
                        className="absolute inset-0 z-0"
                        animate={{
                            width: isDrawerOpen ? "35%" : "100%",
                            paddingRight: isDrawerOpen ? "0px" : "0px"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <ArchitecturalViewer />
                    </motion.div>

                    {/* LAYER 2: Navigation Bar (Fixed Bottom) */}
                    <TechnicalNavBar
                        activeId={isDrawerOpen ? activeCategory : ""}
                        onSelect={handleCategorySelect}
                    />
                    <DetailDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        category={activeCategory}
                        propertyData={propertyData}
                        dvfData={dvfData}
                        marketStats={marketStats}
                        loadingDVF={loadingDVF}
                        works={works}
                        tasks={tasks}
                        expenses={expenses}
                        documents={documents}
                        actions={actions}
                    />

                    {/* Modals */}
                    <AddWorkModal
                        isOpen={isAddWorkOpen}
                        onClose={() => setIsAddWorkOpen(false)}
                        propertyId={property.id}
                        onWorkSaved={(w) => works.setItems((prev) => [w, ...prev])}
                        onDocumentSaved={(d) => documents.setItems((prev) => [d, ...prev])}
                    />
                    <AddTaskModal
                        isOpen={isAddTaskOpen}
                        onClose={() => setIsAddTaskOpen(false)}
                        propertyId={property.id}
                        onSaved={(t) => tasks.setItems((prev) => [...prev, t])}
                    />
                    <AddExpenseModal
                        isOpen={isAddExpenseOpen}
                        onClose={() => setIsAddExpenseOpen(false)}
                        propertyId={property.id}
                        onSaved={(e) => expenses.setItems((prev) => [e, ...prev])}
                    />
                    <AddDocumentModal
                        isOpen={documentModalType !== null}
                        defaultType={documentModalType ?? undefined}
                        onClose={() => setDocumentModalType(null)}
                        propertyId={property.id}
                        onSaved={(d) => {
                            documents.setItems((prev) => [d, ...prev]);
                            if (d.doc_type === DOC_TYPE_OWNERSHIP_PROOF) refreshProperty();
                        }}
                    />

                    {/* Header / Title Overlay */}
                    <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between">
                        <div>
                            <Link href="/properties" className="group flex items-center gap-3">
                                <img src="/bricq-logo.png" alt="bricq Logo" className="w-12 h-12 object-contain mix-blend-multiply opacity-90" />
                                <div>
                                    <h1 className="text-3xl font-bold font-serif tracking-tighter text-black group-hover:opacity-70 transition-opacity">
                                        bricq
                                    </h1>
                                    <p className="font-mono text-[10px] tracking-[0.3em] mt-1 border-t border-black pt-1 inline-block group-hover:border-gray-400 transition-colors">
                                        ESPACE PROPRIÉTAIRE
                                    </p>
                                </div>
                            </Link>
                            <div className="mt-4 max-w-[30vw] space-y-2">
                                <p className="text-sm font-medium text-bricq-slate">{property.address_label}</p>
                                <OwnershipBadge status={property.ownership_status} comment={property.ownership_comment} />
                                {property.ownership_status === 'rejected' && (
                                    <div className="text-xs text-red-800 bg-red-50 border border-red-200 p-2">
                                        {property.ownership_comment ? <p className="mb-1">{property.ownership_comment}</p> : null}
                                        <button className="underline font-bold" onClick={() => setDocumentModalType(DOC_TYPE_OWNERSHIP_PROOF)}>
                                            Envoyer un nouveau justificatif
                                        </button>
                                    </div>
                                )}
                                {property.ownership_status === 'pending' && !property.has_ownership_proof && (
                                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2">
                                        Aucun justificatif de propriété.{' '}
                                        <button className="underline font-bold" onClick={() => setDocumentModalType(DOC_TYPE_OWNERSHIP_PROOF)}>
                                            En ajouter un
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <ProfileDropdown />
                    </div>

                    {actionError && (
                        <div role="alert" className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2 shadow flex items-center gap-3">
                            {actionError}
                            <button onClick={() => setActionError(null)} className="font-bold" aria-label="Fermer">×</button>
                        </div>
                    )}

                    {/* Notepad Widget */}
                    <div className="absolute bottom-24 left-6 z-20">
                        <NotepadWidget propertyId={property.id} />
                    </div>
                </>
            )}
        </div>
    );
}
