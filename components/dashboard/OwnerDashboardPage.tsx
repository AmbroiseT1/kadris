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
}

export default function OwnerDashboardPage() {
    const searchParams = useSearchParams();
    const [activeCategory, setActiveCategory] = useState<string>("overview");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock Documents State
    const [documents, setDocuments] = useState([
        { id: '1', title: "Titre de Propriété", date: "12/05/2018", type: "ACTE" },
        { id: '2', title: "DPE Validé", date: "24/01/2023", type: "DPE" },
        { id: '3', title: "Facture Toiture", date: "10/09/2020", type: "FACTURE" },
        { id: ' 4', title: "Taxe Foncière 2023", date: "15/10/2023", type: "AUTRE" },
    ]);

    // Modal States
    const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);

    // Load property data on mount
    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const propertyId = searchParams.get('propertyId');

        if (propertyId) {
            const userProperties = getCurrentUserProperties();
            const property = userProperties.find((p: StoredProperty) => p.id === propertyId);
            if (property) {
                setPropertyData(property.data);
            }
        } else {
            const userProperties = getCurrentUserProperties();
            if (userProperties.length > 0) {
                setPropertyData(userProperties[0].data);
            }
        }

        setIsLoading(false);
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
            type: data.type
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
                        <div className="w-16 h-16 border-4 border-kadris-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-kadris-slate font-medium">Chargement de votre bien...</p>
                    </div>
                </div>
            )}

            {/* No Property Message */}
            {!isLoading && !propertyData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
                    <div className="text-center max-w-md px-6">
                        <h2 className="text-2xl font-serif font-bold text-kadris-slate mb-4">Aucun bien revendiqué</h2>
                        <p className="text-kadris-slate/60 mb-6">Vous n'avez pas encore revendiqué de propriété. Commencez par créer un compte propriétaire.</p>
                        <Link href="/properties/add" className="inline-block px-6 py-3 bg-kadris-slate text-white font-bold uppercase tracking-wider hover:bg-kadris-slate/90 transition-colors">
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
                            width: isDrawerOpen ? "50%" : "100%",
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

                    {/* LAYER 3: Detail Drawer (Slide-in) */}
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
                    <div className="absolute top-8 left-8 z-10">
                        <Link href="/properties" className="group flex items-center gap-4">
                            <img src="/kadris-logo.png" alt="Kadris Logo" className="w-16 h-16 object-contain mix-blend-multiply opacity-90" />
                            <div>
                                <h1 className="text-4xl font-bold font-serif tracking-tighter text-black group-hover:opacity-70 transition-opacity">
                                    Kadris
                                </h1>
                                <p className="font-mono text-xs tracking-[0.3em] mt-1 border-t border-black pt-1 inline-block group-hover:border-gray-400 transition-colors">
                                    ESPACE PROPRIÉTAIRE
                                </p>
                            </div>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
