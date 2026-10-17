"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HardHat } from "lucide-react";
import { TabSynthese } from "@/components/report/TabSynthese";
import { TabQuartier } from "@/components/report/TabQuartier";
import { TabRisks } from "@/components/report/TabRisks";
import { TabDVF } from "@/components/report/TabDVF";
import { TabAnalyse } from "@/components/report/TabAnalyse";
import { TransactionDVF, BackendMarketStats } from "@/app/lib/dvf";
import type { BuildingData } from "@/app/lib/types";
import type { Expense, PropertyDocument, Task, Work } from "@/app/lib/api";
import TimelineFeed from "./widgets/TimelineFeed";
import SmartActionPlan from "./widgets/SmartActionPlan";
import DocumentsVault from "./widgets/DocumentsVault";
import FinanceBento from "./widgets/FinanceBento";
import type { Resource } from "./useResource";

export interface OwnerActions {
    onAddWork: () => void;
    onAddTask: () => void;
    onAddExpense: () => void;
    onAddDocument: () => void;
    onDeleteWork: (w: Work) => void;
    onToggleTask: (t: Task) => void;
    onDeleteTask: (t: Task) => void;
    onDeleteExpense: (e: Expense) => void;
    onDownloadDocument: (d: PropertyDocument) => void;
    onDeleteDocument: (d: PropertyDocument) => void;
}

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    propertyData: BuildingData;
    dvfData: TransactionDVF[];
    marketStats: BackendMarketStats | null;
    loadingDVF: boolean;
    works: Resource<Work>;
    tasks: Resource<Task>;
    expenses: Resource<Expense>;
    documents: Resource<PropertyDocument>;
    actions: OwnerActions;
}

const state = <T,>(r: Resource<T>) => ({ loading: r.loading, error: r.error, onRetry: r.reload });

export default function DetailDrawer({
    isOpen,
    onClose,
    category,
    propertyData: data,
    dvfData,
    marketStats,
    loadingDVF,
    works,
    tasks,
    expenses,
    documents,
    actions,
}: DetailDrawerProps) {
    const renderContent = () => {
        switch (category) {
            case "overview":
                return <TabSynthese data={data} dvf={dvfData} loading={loadingDVF} />;

            case "neighborhood":
                return <TabQuartier data={data} />;

            case "market":
                return (
                    <div className="space-y-12">
                        <TabDVF
                            transactions={dvfData}
                            loading={loadingDVF}
                            marketStats={marketStats}
                            surface={data.surface_sol}
                            surface_terrain={(data as BuildingData & { surface_terrain?: number }).surface_terrain}
                        />
                        <FinanceBento
                            expenses={expenses.items}
                            {...state(expenses)}
                            onAddClick={actions.onAddExpense}
                            onDelete={actions.onDeleteExpense}
                        />
                    </div>
                );

            case "works":
                return (
                    <div className="space-y-12">
                        <SmartActionPlan
                            tasks={tasks.items}
                            {...state(tasks)}
                            onAddClick={actions.onAddTask}
                            onToggle={actions.onToggleTask}
                            onDelete={actions.onDeleteTask}
                        />
                        <div>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-6 flex items-center gap-2">
                                <HardHat size={20} /> HISTORIQUE
                            </h3>
                            <TimelineFeed
                                works={works.items}
                                {...state(works)}
                                onAddClick={actions.onAddWork}
                                onDelete={actions.onDeleteWork}
                            />
                        </div>
                    </div>
                );

            case "risks":
                return <TabRisks data={data} />;

            case "analyse":
                return <TabAnalyse data={data} dvf={dvfData} />;

            case "documents":
                return (
                    <DocumentsVault
                        documents={documents.items}
                        {...state(documents)}
                        onAddClick={actions.onAddDocument}
                        onDownload={actions.onDownloadDocument}
                        onDelete={actions.onDeleteDocument}
                    />
                );

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
                                category === "market" ? "Estimation & Charges" :
                                    category === "neighborhood" ? "Quartier" :
                                        category === "risks" ? "Risques" :
                                            category === "analyse" ? "Analyse 360°" :
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
