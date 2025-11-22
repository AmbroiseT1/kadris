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
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#fdfbf7] border-t-2 border-black h-40 px-8 flex items-center justify-center">
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
                                "group flex flex-col items-center justify-center w-40 h-32 transition-all duration-300 relative",
                                "focus:outline-none"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "relative z-10 p-2 transition-all duration-300 transform",
                                isActive || "group-hover:scale-110" ? "scale-110" : "scale-100",
                                isActive ? "-translate-y-2" : "group-hover:-translate-y-1"
                            )}>
                                <Icon
                                    size={60}
                                    strokeWidth={isActive ? 2.5 : 1}
                                    className={cn(
                                        "text-black transition-all duration-300",
                                        isActive ? "drop-shadow-lg" : "group-hover:drop-shadow-md"
                                    )}
                                />
                            </div>

                            {/* Label */}
                            <span className={cn(
                                "mt-3 text-[12px] font-mono tracking-widest text-black uppercase transition-all duration-300",
                                isActive ? "font-black opacity-100" : "font-medium opacity-60 group-hover:font-bold group-hover:opacity-100"
                            )}>
                                {item.label}
                            </span>

                            {/* Description */}
                            <span className={cn(
                                "text-[10px] font-mono text-gray-600 tracking-wide mt-1 transition-all duration-300",
                                isActive ? "opacity-100 font-bold" : "opacity-0 group-hover:opacity-100"
                            )}>
                                {item.description}
                            </span>

                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute bottom-0 w-12 h-1 bg-black" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
