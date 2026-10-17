"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Home, ListChecks, HardHat, Wallet, FileText, Map as MapIcon, TrendingUp, TriangleAlert, Sparkles, MoreHorizontal, X,
    type LucideIcon,
} from "lucide-react";
import OwnerSectionContent, { SECTION_TITLES, type OwnerActions, type OwnerSection } from "./OwnerSectionContent";
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
    type Property, type Task, type Work,
} from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import NotepadWidget from "./widgets/NotepadWidget";
import ProfileDropdown from "@/components/ui/ProfileDropdown";
import { LogoMark } from "@/components/ui/Logo";
import StatusChip, { type Status } from "@/components/ui/StatusChip";
import DpeLabel from "@/components/ui/DpeLabel";
import PlanTrace from "@/components/motion/PlanTrace";
import BrickLoader from "@/components/motion/BrickLoader";

const Building3D = dynamic(() => import("@/components/building3d/Building3D"), { ssr: false, loading: () => <PlanTrace /> });

const NAV: { id: OwnerSection; icon: LucideIcon; primary?: boolean }[] = [
    { id: "overview", icon: Home, primary: true },
    { id: "todo", icon: ListChecks, primary: true },
    { id: "works", icon: HardHat, primary: true },
    { id: "documents", icon: FileText, primary: true },
    { id: "expenses", icon: Wallet },
    { id: "market", icon: TrendingUp },
    { id: "risks", icon: TriangleAlert },
    { id: "neighborhood", icon: MapIcon },
    { id: "analyse", icon: Sparkles },
];

const ZONES = {
    toit: /toit|toiture|couverture|charpente|goutti|tuile|ardoise|zinguerie/i,
    murs: /mur|fa[çc]ade|ravalement|isolation|enduit|fissure|humidit/i,
};

/** État d'une zone de la maquette, déduit des tâches ouvertes et des travaux récents. */
function zoneState(zone: keyof typeof ZONES, tasks: Task[], works: Work[]): Status {
    const re = ZONES[zone];
    const match = (t?: string | null) => !!t && re.test(t);
    const open = tasks.filter((t) => !t.done && (match(t.title) || match(t.category)));
    if (open.some((t) => t.priority === "URGENTE")) return "alerte";
    if (open.length) return "vigil";
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const recent = works.some((w) => w.status === "done" && (match(w.title) || match(w.category)) && (!w.date || new Date(w.date) >= tenYearsAgo));
    return recent ? "ok" : "inconnu";
}

const STATE_TEXT: Record<Status, string> = { ok: "Entretenu", vigil: "À surveiller", alerte: "À traiter", inconnu: "Non renseigné" };

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
    const [section, setSection] = useState<OwnerSection>("overview");
    const [moreOpen, setMoreOpen] = useState(false);
    const [property, setProperty] = useState<Property | null>(null);
    const [extraData, setExtraData] = useState<Partial<BuildingData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
    const [marketStats, setMarketStats] = useState<BackendMarketStats | null>(null);
    const [dvfLoadedKey, setDvfLoadedKey] = useState<string | null>(null);
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
    const geoId = property?.id;
    const geoLat = property?.lat;
    const geoLon = property?.lon;
    const geoKey = geoLat != null && geoLon != null ? `${geoId}:${geoLat}:${geoLon}` : null;
    // Chargement en cours tant que la clé du bien courant n'a pas été chargée
    const loadingDVF = geoKey !== null && dvfLoadedKey !== geoKey;

    useEffect(() => {
        if (geoLat == null || geoLon == null || geoKey === null) return;
        const lat = geoLat;
        const lon = geoLon;
        let cancelled = false;
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
            .finally(() => { if (!cancelled) setDvfLoadedKey(geoKey); });
        return () => { cancelled = true; };
    }, [geoKey, geoLat, geoLon]);

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

    const go = (id: OwnerSection) => {
        setSection(id);
        setMoreOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const states = useMemo(() => ({
        murs: zoneState("murs", tasks.items, works.items),
        toit: zoneState("toit", tasks.items, works.items),
    }), [tasks.items, works.items]);

    const openTasks = tasks.items.filter((t) => !t.done);
    const yearExpenses = expenses.items.reduce((sum, e) => {
        const f = e.frequency === "mensuel" ? 12 : 1;
        if (e.frequency === "ponctuel" && e.date && new Date(e.date).getFullYear() !== new Date().getFullYear()) return sum;
        return sum + e.amount * f;
    }, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-papier grid place-items-center p-6">
                <div className="w-full max-w-md grid gap-4 text-center">
                    <p className="font-display text-xl font-bold">Chargement de votre logement…</p>
                    <BrickLoader sources={[{ key: "bien", label: "Votre bien", state: "loading" }]} />
                </div>
            </div>
        );
    }

    if (loadError || !property || !propertyData) {
        return (
            <div className="min-h-screen bg-papier grid place-items-center p-6">
                <div role={loadError ? "alert" : undefined} className="card p-8 max-w-md text-center grid gap-4">
                    <LogoMark className="w-12 h-12 mx-auto" />
                    <h1 className="text-2xl font-extrabold">{loadError ? "Logement indisponible" : "Ajoutez votre logement"}</h1>
                    <p className="text-texte-2">
                        {loadError ?? "Ajoutez votre logement pour suivre ses travaux, ses charges et ranger ses documents au même endroit."}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {loadError ? (
                            <>
                                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-primary">Réessayer</button>
                                <Link href="/properties" className="btn btn-secondary">Mes logements</Link>
                            </>
                        ) : (
                            <Link href="/properties/add" className="btn btn-primary">Ajouter mon logement</Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const dpe = propertyData.dpe_reel?.classe_bilan_dpe || propertyData.dpe_lettre;
    const contentProps = { propertyData, dvfData, marketStats, loadingDVF, works, tasks, expenses, documents, actions };

    return (
        <div className="min-h-screen bg-papier text-texte lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* BARRE LATÉRALE (ordinateur) */}
            <aside className="hidden lg:flex flex-col sticky top-0 h-screen bg-encre text-papier">
                <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
                    <LogoMark className="w-8 h-8 text-papier" />
                    <span className="font-display text-xl font-extrabold">bricq</span>
                </Link>
                <nav aria-label="Espace propriétaire" className="flex-1 overflow-y-auto p-3 grid gap-0.5 content-start">
                    {NAV.map(({ id, icon: Icon }, i) => (
                        <React.Fragment key={id}>
                            {i === 5 && <p className="px-3 pt-4 pb-1 text-xs font-mono uppercase tracking-wider text-papier/60">Données publiques</p>}
                            <button type="button" onClick={() => go(id)} aria-current={section === id ? "page" : undefined}
                                className={`flex items-center gap-3 px-3 min-h-[44px] rounded-md text-left text-sm ${section === id ? "bg-white/12 font-bold shadow-[inset_3px_0_0_var(--color-brique)]" : "text-papier/80 hover:bg-white/5 hover:text-papier"}`}>
                                <Icon size={18} aria-hidden /> {SECTION_TITLES[id]}
                                {id === "todo" && openTasks.length > 0 && <span className="ml-auto text-xs font-mono bg-brique text-white rounded-full px-2 py-0.5">{openTasks.length}</span>}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>
                <div className="p-3 border-t border-white/10 grid gap-1 text-sm">
                    <Link href="/properties" className="px-3 min-h-[40px] flex items-center rounded-md text-papier/80 hover:bg-white/5">Mes logements</Link>
                    <Link href={`/report/${encodeURIComponent(property.cle_interop ?? property.id)}`} className="px-3 min-h-[40px] flex items-center rounded-md text-papier/80 hover:bg-white/5">Rapport public</Link>
                </div>
            </aside>

            <div className="min-w-0 pb-24 lg:pb-0">
                {/* EN-TÊTE */}
                <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-trait">
                    <div className="px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex items-center gap-3">
                        <Link href="/" className="lg:hidden" aria-label="Accueil Bricq"><LogoMark className="w-8 h-8" /></Link>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{property.address_label}</p>
                            <div className="mt-0.5"><OwnershipBadge status={property.ownership_status} comment={property.ownership_comment} /></div>
                        </div>
                        <ProfileDropdown />
                    </div>
                </header>

                <main id="contenu" className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1100px] grid gap-6">
                    {property.ownership_status === "rejected" && (
                        <div role="alert" className="p-4 bg-alerte-soft border-l-4 border-alerte rounded-sm text-sm">
                            <p className="font-bold">Justificatif refusé</p>
                            {property.ownership_comment && <p className="mt-1">{property.ownership_comment}</p>}
                            <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => setDocumentModalType(DOC_TYPE_OWNERSHIP_PROOF)}>Envoyer un nouveau justificatif</button>
                        </div>
                    )}
                    {property.ownership_status === "pending" && !property.has_ownership_proof && (
                        <div className="p-4 bg-vigil-soft border-l-4 border-vigil rounded-sm text-sm flex flex-wrap items-center gap-3 justify-between">
                            <p><span className="font-bold">Aucun justificatif de propriété.</span> Ajoutez-en un pour faire vérifier votre logement.</p>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDocumentModalType(DOC_TYPE_OWNERSHIP_PROOF)}>Ajouter un justificatif</button>
                        </div>
                    )}
                    {actionError && (
                        <div role="alert" className="p-3 bg-alerte-soft border-l-4 border-alerte rounded-sm text-sm flex items-center justify-between gap-3">
                            {actionError}
                            <button type="button" onClick={() => setActionError(null)} className="btn btn-ghost btn-sm" aria-label="Fermer le message"><X size={16} aria-hidden /></button>
                        </div>
                    )}

                    <h1 className="text-3xl font-extrabold">{SECTION_TITLES[section]}</h1>

                    {section === "overview" ? (
                        <div className="grid gap-6">
                            <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 items-start">
                                <section aria-labelledby="maquette-titre" className="card overflow-hidden">
                                    <div className="px-5 pt-4 flex flex-wrap items-baseline justify-between gap-2">
                                        <h2 id="maquette-titre" className="text-lg font-bold">État du logement</h2>
                                        <span className="text-xs text-texte-2">Couleurs déduites de vos tâches et travaux</span>
                                    </div>
                                    <div className="h-[320px] md:h-[380px]">
                                        {propertyData.coords ? (
                                            <Building3D
                                                lat={propertyData.coords.lat}
                                                lon={propertyData.coords.lon}
                                                hints={{
                                                    hauteur: propertyData.hauteur,
                                                    nb_niveaux: propertyData.nb_niveaux,
                                                    surface_sol: propertyData.surface_sol,
                                                    materiaux_murs: propertyData.materiaux_murs,
                                                    materiaux_toiture: propertyData.materiaux_toiture,
                                                }}
                                                mode="etat"
                                                states={states}
                                                className="h-full"
                                                label="Maquette 3D de votre logement colorée selon son état d'entretien"
                                            />
                                        ) : (
                                            <div className="h-full grid place-items-center text-sm text-texte-2 p-6 text-center">Coordonnées du logement inconnues : maquette indisponible.</div>
                                        )}
                                    </div>
                                    <ul className="grid grid-cols-2 border-t border-trait">
                                        {(["toit", "murs"] as const).map((z) => (
                                            <li key={z} className="p-4 grid gap-1.5 border-r last:border-r-0 border-trait">
                                                <span className="label">{z === "toit" ? "Toiture" : "Murs et façades"}</span>
                                                <StatusChip status={states[z]} className="justify-self-start">{STATE_TEXT[states[z]]}</StatusChip>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <div className="grid gap-4 content-start">
                                    <div className="card p-5 grid gap-3">
                                        <span className="label">Repères</span>
                                        <dl className="grid grid-cols-2 gap-4">
                                            <div><dt className="text-xs text-texte-2">Énergie</dt><dd className="mt-1">{dpe ? <DpeLabel classe={dpe} compact /> : <span className="text-texte-2">Non évalué</span>}</dd></div>
                                            <div><dt className="text-xs text-texte-2">Construction</dt><dd className="mt-1 font-display text-xl font-bold">{propertyData.annee_construction ?? "—"}</dd></div>
                                            <div><dt className="text-xs text-texte-2">Charges / an</dt><dd className="mt-1 font-display text-xl font-bold">{expenses.items.length ? `${Math.round(yearExpenses).toLocaleString("fr-FR")} €` : "—"}</dd></div>
                                            <div><dt className="text-xs text-texte-2">Documents</dt><dd className="mt-1 font-display text-xl font-bold">{documents.items.length}</dd></div>
                                        </dl>
                                    </div>
                                    <div className="card p-5 grid gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="label">À faire</span>
                                            <button type="button" onClick={() => go("todo")} className="text-sm font-bold text-encre underline underline-offset-4">Tout voir</button>
                                        </div>
                                        {tasks.loading ? <p className="text-sm text-texte-2">Chargement…</p> : openTasks.length === 0 ? (
                                            <p className="text-sm text-texte-2">Rien en attente. Ajoutez une tâche pour ne rien oublier.</p>
                                        ) : (
                                            <ul className="grid gap-2">
                                                {openTasks.slice(0, 4).map((t) => (
                                                    <li key={t.id} className="flex items-start gap-3">
                                                        <input type="checkbox" checked={false} onChange={() => actions.onToggleTask(t)} aria-label={`Marquer « ${t.title} » comme faite`} className="mt-1 w-5 h-5 accent-[var(--color-brique)]" />
                                                        <span className="text-sm flex-1">{t.title}{t.due_date && <span className="block text-xs text-texte-2 font-mono">{new Date(t.due_date).toLocaleDateString("fr-FR")}</span>}</span>
                                                        {t.priority === "URGENTE" && <StatusChip status="alerte">Urgent</StatusChip>}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <button type="button" onClick={actions.onAddTask} className="btn btn-secondary btn-sm justify-self-start">Ajouter une tâche</button>
                                    </div>
                                    <NotepadWidget propertyId={property.id} />
                                </div>
                            </div>

                            <section aria-labelledby="derniers-travaux" className="grid gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 id="derniers-travaux" className="text-xl font-bold">Derniers travaux</h2>
                                    <button type="button" onClick={() => go("works")} className="text-sm font-bold text-encre underline underline-offset-4">Carnet complet</button>
                                </div>
                                <OwnerSectionContent section="works" {...contentProps} works={{ ...works, items: works.items.slice(0, 3) }} />
                            </section>
                        </div>
                    ) : (
                        <OwnerSectionContent section={section} {...contentProps} />
                    )}
                </main>
            </div>

            {/* BARRE D'ONGLETS (mobile) */}
            <nav aria-label="Espace propriétaire" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-trait grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
                {NAV.filter((n) => n.primary).map(({ id, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => go(id)} aria-current={section === id ? "page" : undefined}
                        className={`min-h-[60px] grid place-items-center content-center gap-1 text-xs ${section === id ? "text-brique font-bold" : "text-texte-2"}`}>
                        <Icon size={20} aria-hidden />
                        {id === "overview" ? "Accueil" : SECTION_TITLES[id]}
                    </button>
                ))}
                <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen}
                    className={`min-h-[60px] grid place-items-center content-center gap-1 text-xs ${!NAV.find((n) => n.id === section)?.primary ? "text-brique font-bold" : "text-texte-2"}`}>
                    <MoreHorizontal size={20} aria-hidden /> Plus
                </button>
            </nav>
            {moreOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-texte/40" onClick={() => setMoreOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-label="Autres rubriques" className="absolute bottom-0 inset-x-0 bg-surface rounded-t-lg p-4 pb-8 grid gap-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-display font-bold text-lg">Autres rubriques</p>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMoreOpen(false)}><X size={18} aria-hidden /> Fermer</button>
                        </div>
                        {NAV.filter((n) => !n.primary).map(({ id, icon: Icon }) => (
                            <button key={id} type="button" onClick={() => go(id)} className="flex items-center gap-3 min-h-[48px] px-2 border-b border-trait text-left">
                                <Icon size={18} aria-hidden /> {SECTION_TITLES[id]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Fenêtres d'ajout */}
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
        </div>
    );
}
