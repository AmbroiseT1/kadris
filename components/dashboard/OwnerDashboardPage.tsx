"use client";

import React, { useState } from "react";
import ArchitecturalViewer from "./ArchitecturalViewer";
import TechnicalNavBar from "./TechnicalNavBar";
import DetailDrawer from "./DetailDrawer";

export default function OwnerDashboardPage() {
    const [activeCategory, setActiveCategory] = useState<string>("works");
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

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
            {/* LAYER 1: 3D Background */}
            <div className="absolute inset-0 z-0">
                <ArchitecturalViewer />
            </div>

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
            />

            {/* Header / Title Overlay (Optional) */}
            <div className="absolute top-8 left-8 z-10 pointer-events-none">
                <h1 className="text-4xl font-bold font-serif tracking-tighter text-black">
                    BRIQUE<span className="font-light">BY</span>BRIQUE
                </h1>
                <p className="font-mono text-xs tracking-[0.3em] mt-2 border-t border-black pt-2 inline-block">
                    DASHBOARD PROPRIÉTAIRE v2.0
                </p>
            </div>
        </div>
    );
}
