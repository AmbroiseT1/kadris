"use client";

import React, { useState, useEffect } from "react";
import ArchitecturalViewer from "./ArchitecturalViewer";
import TechnicalNavBar from "./TechnicalNavBar";
import DetailDrawer from "./DetailDrawer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCurrentUser, getCurrentUserProperties, type PropertyData as StoredProperty } from "@/utils/propertyStorage";
import AddWorkModal from "./modals/AddWorkModal";
import AddTaskModal from "./modals/AddTaskModal";
import AddExpenseModal from "./modals/AddExpenseModal";
import AddDocumentModal from "./modals/AddDocumentModal";
import { fetchDVF, TransactionDVF } from "@/app/lib/dvf";
import { fetchRisks } from "@/app/lib/georisques";
import { fetchQuartier } from "@/app/lib/quartier";
import NotepadWidget from "./widgets/NotepadWidget";
import ProfileDropdown from "@/components/ui/ProfileDropdown";

interface PropertyData {
    adresse_ban: string;
    annee_construction: string;
    dpe_lettre: string;
    materiaux_murs: string;
    materiaux_toiture: string;
    hauteur: number;
    nb_niveaux: number;
    surface_sol: number;
    nb_logements: number;
    usage: string;
    coords?: { lat: number; lon: number };
    cle_interop?: string;
    risques_detailles?: any;
    quartier?: any;
}

export default function OwnerDashboardPage() {
    const searchParams = useSearchParams();
    const [activeCategory, setActiveCategory] = useState<string>("overview");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dvfData, setDvfData] = useState<TransactionDVF[]>([]);
    const [loadingDVF, setLoadingDVF] = useState(false);

    // Mock Documents State
    const [documents, setDocuments] = useState([
        { id: '1', title: "Titre de Propriété", date: "12/05/2018", type: "ACTE" },
        { id: '2', title: "DPE Validé", date: "24/01/2023", type: "DPE" },
        { id: '3', title: "Facture Toiture", date: "10/09/2020", type: "FACTURE" },
        { id: '4', title: "Taxe Foncière 2023", date: "15/10/2023", type: "AUTRE" },
    ]);

    // Modal States
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);

    // Load property data on mount
    useEffect(() => {
        async function loadPropertyData() {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                setIsLoading(false);
                return;
            }

            const propertyId = searchParams.get('propertyId');
            let selectedProperty: PropertyData | null = null;

            if (propertyId) {
                const userProperties = getCurrentUserProperties();
                const property = userProperties.find((p: StoredProperty) => p.id === propertyId);
                if (property) {
                    selectedProperty = property.data as PropertyData;
                }
            } else {
                const userProperties = getCurrentUserProperties();
                if (userProperties.length > 0) {
                    selectedProperty = userProperties[0].data as PropertyData;
                }
            }

            setPropertyData(selectedProperty);
            setIsLoading(false);

            // Load supplementary data if coordinates are available
            if (selectedProperty?.coords) {
                setLoadingDVF(true);
                try {
                    const [dvf, risques, quartier] = await Promise.all([
                        fetchDVF(selectedProperty.coords.lat, selectedProperty.coords.lon),
                        fetchRisks(selectedProperty.coords.lat, selectedProperty.coords.lon),
                        fetchQuartier(selectedProperty.coords.lat, selectedProperty.coords.lon)
                    ]);

                    setDvfData(dvf || []);

                    // Update property data with supplementary info
                    const updatedProperty = { ...selectedProperty };
                    if (risques) updatedProperty.risques_detailles = risques;
                    if (quartier) updatedProperty.quartier = quartier;

                    setPropertyData(updatedProperty);
                } catch (error) {
                    console.error('Error loading supplementary data:', error);
                } finally {
                    setLoadingDVF(false);
                }
            }
        }

        loadPropertyData();
    }, [searchParams]);

    // Mock Save Handlers
    const handleSaveWork = (data: any) => {
        console.log("Work saved:", data);
        if (data.title) {
            const newDoc = {
                id: Date.now().toString(),
                title: `Devis - ${data.title}`,
                date: new Date().toISOString().split('T')[0],
                type: 'DEVIS'
            };
            setDocuments(prev => [newDoc, ...prev]);
        }
    };

    const handleSaveTask = (data: any) => {
        console.log("Task saved:", data);
    };

    const handleSaveExpense = (data: any) => {
        console.log("Expense saved:", data);
    };

    const handleSaveDocument = (data: any) => {
        console.log("Document saved:", data);
        const newDoc = {
            id: Date.now().toString(),
            title: data.title,
            date: data.date,
            type: data.type,
            description: data.description
        };
        setDocuments(prev => [newDoc, ...prev]);
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

            {/* No Property Message */}
            {!isLoading && !propertyData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                    <div className="text-center max-w-md px-6">
                        <h2 className="text-2xl font-serif font-bold text-bricq-slate mb-4">Aucun bien revendiqué</h2>
                        <p className="text-bricq-slate/60 mb-6">Vous n'avez pas encore revendiqué de propriété. Commencez par créer un compte propriétaire.</p>
                        <Link href="/properties/add" className="inline-block px-6 py-3 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors">
                            Revendiquer un bien
                        </Link>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && propertyData && (
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
                        onAddWork={() => setIsAddWorkOpen(true)}
                        onAddTask={() => setIsAddTaskOpen(true)}
                        onAddExpense={() => setIsAddExpenseOpen(true)}
                        documents={documents}
                        onAddDocument={() => setIsAddDocumentOpen(true)}
                        propertyData={propertyData}
                        dvfData={dvfData}
                        loadingDVF={loadingDVF}
                    />

                    {/* Modals */}
                    <AddWorkModal
                        isOpen={isAddWorkOpen}
                        onClose={() => setIsAddWorkOpen(false)}
                        onSave={handleSaveWork}
                    />
                    <AddTaskModal
                        isOpen={isAddTaskOpen}
                        onClose={() => setIsAddTaskOpen(false)}
                        onSave={handleSaveTask}
                    />
                    <AddExpenseModal
                        isOpen={isAddExpenseOpen}
                        onClose={() => setIsAddExpenseOpen(false)}
                        onSave={handleSaveExpense}
                    />
                    <AddDocumentModal
                        isOpen={isAddDocumentOpen}
                        onClose={() => setIsAddDocumentOpen(false)}
                        onSave={handleSaveDocument}
                    />

                    {/* Header / Title Overlay */}
                    <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
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
                        <ProfileDropdown />
                    </div>

                    {/* Notepad Widget */}
                    <div className="absolute bottom-24 left-6 z-20">
                        <NotepadWidget />
                    </div>
                </>
            )}
        </div>
    );
}
