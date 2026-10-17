"use client";

import React from "react";
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

export type OwnerSection = "overview" | "todo" | "works" | "expenses" | "documents" | "neighborhood" | "market" | "risks" | "analyse";

export const SECTION_TITLES: Record<OwnerSection, string> = {
    overview: "Vue d'ensemble",
    todo: "À faire",
    works: "Travaux",
    expenses: "Charges",
    documents: "Documents",
    neighborhood: "Quartier",
    market: "Prix du marché",
    risks: "Risques",
    analyse: "Analyse",
};

interface OwnerSectionContentProps {
    section: Exclude<OwnerSection, "overview">;
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

/** Contenu d'une rubrique de l'espace propriétaire (la vue d'ensemble est composée à part). */
export default function OwnerSectionContent({
    section,
    propertyData: data,
    dvfData,
    marketStats,
    loadingDVF,
    works,
    tasks,
    expenses,
    documents,
    actions,
}: OwnerSectionContentProps) {
    switch (section) {
        case "todo":
            return <SmartActionPlan tasks={tasks.items} {...state(tasks)} onAddClick={actions.onAddTask} onToggle={actions.onToggleTask} onDelete={actions.onDeleteTask} />;
        case "works":
            return <TimelineFeed works={works.items} {...state(works)} onAddClick={actions.onAddWork} onDelete={actions.onDeleteWork} />;
        case "expenses":
            return <FinanceBento expenses={expenses.items} {...state(expenses)} onAddClick={actions.onAddExpense} onDelete={actions.onDeleteExpense} />;
        case "documents":
            return <DocumentsVault documents={documents.items} {...state(documents)} onAddClick={actions.onAddDocument} onDownload={actions.onDownloadDocument} onDelete={actions.onDeleteDocument} />;
        case "neighborhood":
            return <TabQuartier data={data} />;
        case "market":
            return (
                <TabDVF
                    transactions={dvfData}
                    loading={loadingDVF}
                    marketStats={marketStats}
                    surface={data.dpe_reel?.surface_habitable_logement}
                    surface_terrain={(data as BuildingData & { surface_terrain?: number }).surface_terrain}
                />
            );
        case "risks":
            return <TabRisks data={data} />;
        case "analyse":
            return <TabAnalyse data={data} dvf={dvfData} />;
    }
}
