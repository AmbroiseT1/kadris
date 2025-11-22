"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
}

export default function DetailDrawer({ isOpen, onClose, category }: DetailDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (optional, maybe we want to keep 3D visible without dimming too much) */}
                    {/* <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-30"
          /> */}

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 bottom-24 w-[450px] z-40 bg-white/90 backdrop-blur-sm border-l border-black shadow-2xl"
                        style={{
                            // Paper texture overlay
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E")`,
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-black/10">
                            <h2 className="text-2xl font-mono font-bold uppercase tracking-tighter">
                                {category === "works" ? "Historique Rénovations" : category.toUpperCase()}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content - Example for "works" */}
                        <div className="p-8 h-full overflow-y-auto pb-32">
                            {category === "works" ? (
                                <div className="relative border-l-2 border-black/20 ml-4 space-y-12">
                                    {/* Timeline Item 1 */}
                                    <div className="relative pl-8">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-black rounded-full" />
                                        <div className="font-mono text-sm text-gray-500 mb-1">2024 - EN COURS</div>
                                        <h3 className="text-xl font-bold font-serif mb-2">Ravalement Façade Nord</h3>
                                        <p className="font-handwriting text-gray-700 italic mb-4">
                                            "Traitement des fissures et reprise des enduits à la chaux."
                                        </p>
                                        {/* Progress Bar Sketch */}
                                        <div className="w-full h-4 border border-black p-0.5 relative">
                                            <div
                                                className="h-full bg-black/80"
                                                style={{ width: "65%", maskImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)" }}
                                            />
                                        </div>
                                        <div className="text-right font-mono text-xs mt-1">65%</div>
                                    </div>

                                    {/* Timeline Item 2 */}
                                    <div className="relative pl-8">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-black rounded-full" />
                                        <div className="font-mono text-sm text-gray-500 mb-1">2020 - TERMINÉ</div>
                                        <h3 className="text-xl font-bold font-serif mb-2">Isolation Combles</h3>
                                        <p className="font-handwriting text-gray-700 italic">
                                            "Pose de laine de verre 300mm. R = 7.5."
                                        </p>
                                    </div>

                                    {/* Timeline Item 3 */}
                                    <div className="relative pl-8">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-black rounded-full" />
                                        <div className="font-mono text-sm text-gray-500 mb-1">2015 - TERMINÉ</div>
                                        <h3 className="text-xl font-bold font-serif mb-2">Remplacement Chaudière</h3>
                                        <p className="font-handwriting text-gray-700 italic">
                                            "Installation chaudière gaz condensation Viessmann."
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400 font-mono">
                                    <p>DONNÉES EN ATTENTE DE SYNCHRONISATION...</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
