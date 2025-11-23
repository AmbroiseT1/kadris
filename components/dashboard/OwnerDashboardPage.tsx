"use client";

import React, { useState } from "react";
import ArchitecturalViewer from "./ArchitecturalViewer";
import TechnicalNavBar from "./TechnicalNavBar";
import DetailDrawer from "./DetailDrawer";
import { motion } from "framer-motion";
import Link from "next/link";

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
            {/* We animate the container width/position to shift the center of the 3D view */}
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
            />

            {/* Header / Title Overlay */}
            <div className="absolute top-8 left-8 z-10">
                <Link href="/" className="group">
                    <h1 className="text-4xl font-bold font-serif tracking-tighter text-black group-hover:opacity-70 transition-opacity">
                        Kadris
                    </h1>
                    <p className="font-mono text-xs tracking-[0.3em] mt-2 border-t border-black pt-2 inline-block group-hover:border-gray-400 transition-colors">
                        ESPACE PROPRIÉTAIRE
                    </p>
                </Link>
            </div>
        </div>
    );
}
