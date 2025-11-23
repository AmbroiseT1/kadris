"use client";

import React from "react";
import {
    Compass,
    Map as MapIcon,
    TrendingUp,
    HardHat,
    TriangleAlert,
    FileText
} from "lucide-react";
import { cn } from "../../app/lib/utils";

type NavItem = {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
};

const NAV_ITEMS: NavItem[] = [
    { id: "overview", label: "VUE D'ENSEMBLE", description: "Synthèse du bien", icon: Compass },
    { id: "neighborhood", label: "QUARTIER & CARTE", description: "Cadastre & Services", icon: MapIcon },
    { id: "market", label: "ESTIMATION", description: "Valeur & Marché", icon: TrendingUp },
    { id: "works", label: "TRAVAUX & CARNET", description: "Suivi & Entretien", icon: HardHat },
    { id: "risks", label: "RISQUES", description: "Aléas Naturels", icon: TriangleAlert },
    { id: "documents", label: "DOCUMENTS", description: "Actes & Factures", icon: FileText },
];

interface TechnicalNavBarProps {
    activeId: string;
    onSelect: (id: string) => void;
}

export default function TechnicalNavBar({ activeId, onSelect }: TechnicalNavBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#fdfbf7] border-t border-black/20 h-20 px-4 flex items-center justify-center">
            {/* Texture overlay for the bar itself to match background */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="flex w-full max-w-7xl justify-between relative z-10">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeId === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={cn(
                                "group flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-300 relative rounded-sm",
                                "focus:outline-none",
                                isActive ? "bg-black/5" : "hover:bg-black/5"
                            )}
                        >
                            {/* Icon */}
                            <Icon
                                size={20}
                                strokeWidth={isActive ? 2.5 : 1.5}
                                className={cn(
                                    "text-black transition-all duration-200",
                                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                )}
                            />

                            {/* Label */}
                            <span className={cn(
                                "text-[9px] font-mono tracking-wide text-black uppercase transition-all duration-200",
                                isActive ? "font-bold opacity-100" : "font-medium opacity-50 group-hover:opacity-100"
                            )}>
                                {item.label}
                            </span>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
