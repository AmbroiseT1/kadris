"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building, Ruler, BrickWall, Shield, Home, CheckCircle, MapPin, TrendingUp, FileText, AlertTriangle, Download } from "lucide-react";
import { MOCK_BUILDING_DATA } from "./mockData";

interface DetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
}

export default function DetailDrawer({ isOpen, onClose, category }: DetailDrawerProps) {
    const data = MOCK_BUILDING_DATA;

    const renderContent = () => {
        switch (category) {
            case "overview":
                return (
                    <div className="space-y-8">
                        {/* Identity Section */}
                        <section>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <Building size={20} /> IDENTITÉ STRUCTURELLE
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <InfoItem label="Adresse" value={data.adresse_ban} colSpan={2} />
                                <InfoItem label="Construction" value={data.annee_construction} />
                                <InfoItem label="Usage" value={data.usage} />
                                <InfoItem label="Murs" value={data.materiaux_murs} />
                                <InfoItem label="Toiture" value={data.materiaux_toiture} />
                            </div>
                        </section>

                        {/* Dimensions Section */}
                        <section>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <Ruler size={20} /> DIMENSIONS
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <InfoItem label="Surface Sol" value={`${data.surface_sol} m²`} />
                                <InfoItem label="Hauteur" value={`${data.hauteur} m`} />
                                <InfoItem label="Niveaux" value={data.nb_niveaux} />
                            </div>
                        </section>

                        {/* Verdict Section */}
                        <section className="border-2 border-black p-4 relative">
                            <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs font-mono font-bold">
                                DPE ESTIMÉ
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-6xl font-black font-serif">{data.dpe_lettre}</div>
                                <div className="text-right">
                                    <p className="font-mono text-xs text-gray-500">CONSO PRIMAIRE</p>
                                    <p className="font-bold text-xl">{data.dpe_reel?.conso_primaire} <span className="text-sm font-normal">kWh/m²/an</span></p>
                                </div>
                            </div>
                        </section>
                    </div>
                );

            case "neighborhood":
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <MapPin size={20} /> QUARTIER : {data.quartier?.nom?.toUpperCase()}
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <InfoItem label="Zone Urbanisme" value={data.urbanisme?.zone} />
                                <InfoItem label="Transports" value={`${data.quartier?.transports} lignes`} />
                                <InfoItem label="Commerces" value={`${data.quartier?.commerces} à proximité`} />
                                <InfoItem label="Écoles" value={`${data.quartier?.ecoles} établissements`} />
                            </div>
                        </section>

                        <div className="h-48 bg-gray-100 border border-black flex items-center justify-center relative overflow-hidden">
                            {/* Pattern background to simulate map */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                            <p className="font-mono text-sm text-gray-500">CARTE INTERACTIVE DU QUARTIER</p>
                        </div>
                    </div>
                );

            case "market":
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} /> VALEUR ESTIMÉE
                            </h3>
                            <div className="text-4xl font-bold font-serif mb-2">1 250 000 €</div>
                            <p className="font-mono text-sm text-gray-500">Soit 8 620 € / m²</p>

                            <div className="mt-6 p-4 bg-black/5 border border-black/20">
                                <p className="font-handwriting text-sm italic">
                                    "Marché dynamique sur ce secteur. +4% sur les 12 derniers mois."
                                </p>
                            </div>
                        </section>
                    </div>
                );

            case "works":
                return (
                    <div className="relative border-l-2 border-black/20 ml-4 space-y-12">
                        {/* Timeline Item 1 */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-black rounded-full" />
                            <div className="font-mono text-sm text-gray-500 mb-1">2024 - EN COURS</div>
                            <h3 className="text-xl font-bold font-serif mb-2">Ravalement Façade Nord</h3>
                            <p className="font-handwriting text-gray-700 italic mb-4">
                                "Traitement des fissures et reprise des enduits à la chaux."
                            </p>
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
                    </div>
                );

            case "risks":
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} /> VIGILANCE
                            </h3>
                            <div className="space-y-4">
                                <RiskItem label="Argiles" level={data.risques_detailles?.argiles || "Inconnu"} />
                                <RiskItem label="Inondation" level={data.risques_detailles?.inondation || "Inconnu"} />
                                <RiskItem label="Sismicité" level={data.risques_detailles?.sismicite || "Inconnu"} />
                            </div>
                        </section>

                        <button className="w-full border-2 border-black p-4 flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors group">
                            <Download size={18} />
                            <span className="font-bold font-mono uppercase">Télécharger l'ERP Officiel</span>
                        </button>
                    </div>
                );

            case "documents":
                return (
                    <div className="space-y-4">
                        <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                            <FileText size={20} /> COFFRE-FORT
                        </h3>
                        <DocItem title="Titre de Propriété" date="12/05/2018" type="PDF" />
                        <DocItem title="DPE Validé" date="24/01/2023" type="PDF" />
                        <DocItem title="Facture Toiture" date="10/09/2020" type="PDF" />
                        <DocItem title="Taxe Foncière 2023" date="15/10/2023" type="PDF" />
                    </div>
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
                    className="fixed top-0 right-0 bottom-40 w-1/2 z-40 bg-white/90 backdrop-blur-sm border-l border-black shadow-2xl"
                    style={{
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

                    {/* Content */}
                    <div className="p-8 h-full overflow-y-auto pb-32">
                        {renderContent()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Helper Components

const InfoItem = ({ label, value, colSpan = 1 }: { label: string, value: any, colSpan?: number }) => (
    <div className={`flex flex-col ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</span>
        <span className="font-serif text-lg font-medium border-b border-gray-200 pb-1">{value || "--"}</span>
    </div>
);

const RiskItem = ({ label, level }: { label: string, level: string }) => {
    const isHigh = level === "Fort" || level === "Moyen";
    return (
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-serif">{label}</span>
            <span className={`font-mono text-xs font-bold px-2 py-1 border ${isHigh ? 'border-red-500 text-red-600 bg-red-50' : 'border-green-500 text-green-600 bg-green-50'}`}>
                {level.toUpperCase()}
            </span>
        </div>
    );
}

const DocItem = ({ title, date, type }: { title: string, date: string, type: string }) => (
    <div className="flex items-center justify-between p-3 border border-gray-200 hover:border-black transition-colors cursor-pointer group">
        <div className="flex items-center gap-3">
            <FileText size={16} className="text-gray-400 group-hover:text-black" />
            <span className="font-serif font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-400">{date}</span>
            <span className="font-mono text-[10px] border border-black px-1">{type}</span>
        </div>
    </div>
);
