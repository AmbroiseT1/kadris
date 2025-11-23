"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HardHat } from "lucide-react";
import { MOCK_BUILDING_DATA } from "./mockData";
import { TabSynthese } from "@/components/report/TabSynthese";
import { TabQuartier } from "@/components/report/TabQuartier";
import { TabRisks } from "@/components/report/TabRisks";
import { TabDVF } from "@/components/report/TabDVF";
import { TransactionDVF } from "@/app/lib/dvf";
import TimelineFeed from "./widgets/TimelineFeed";
import SmartActionPlan from "./widgets/SmartActionPlan";
import DocumentsVault from "./widgets/DocumentsVault";

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    onAddWork: () => void;
    onAddTask: () => void;
    onAddExpense: () => void;
    documents: any[];
    onAddDocument: () => void;
    propertyData: any;
    dvfData: TransactionDVF[];
    loadingDVF: boolean;
}

export default function DetailDrawer({
    isOpen,
    onClose,
    category,
    onAddWork,
    onAddTask,
    onAddExpense,
    documents,
    onAddDocument,
    propertyData,
    dvfData,
    loadingDVF
}: DetailDrawerProps) {
    const data = propertyData || MOCK_BUILDING_DATA;

    const renderContent = () => {
        switch (category) {
            case "overview":
                return <TabSynthese data={data} dvf={dvfData} loading={loadingDVF} />;

            case "neighborhood":
                return <TabQuartier data={data} />;

            case "market":
                return (
                    <TabDVF
                        transactions={dvfData}
                        loading={loadingDVF}
                        surface={data.surface_sol}
                        surface_terrain={data.surface_terrain}
                    />
                );

            case "works":
                return (
                    <div className="space-y-12">
                        <SmartActionPlan onAddClick={onAddTask} />
                        <div>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-6 flex items-center gap-2">
                                <HardHat size={20} /> HISTORIQUE
                            </h3>
                            <TimelineFeed onAddClick={onAddWork} />
                        </div>
                    </div>
                );

            case "risks":
                return <TabRisks data={data} />;

            case "documents":
                return <DocumentsVault documents={documents} onAddClick={onAddDocument} />;

            default:
                return <div>Sélectionnez une catégorie</div>;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 bottom-20 w-[65%] z-40 bg-white/90 backdrop-blur-sm border-l border-black shadow-2xl overflow-hidden"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                        <h2 className="text-xl font-mono font-bold uppercase tracking-tight">
                            {category === "works" ? "Travaux & Carnet" :
                                category === "market" ? "Estimation" :
                                    category === "neighborhood" ? "Quartier" :
                                        category === "risks" ? "Risques" :
                                            category === "documents" ? "Documents" :
                                                "Vue d'ensemble"}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-6 h-full overflow-y-auto pb-24">
                        {renderContent()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
