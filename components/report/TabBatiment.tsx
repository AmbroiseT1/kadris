"use client";

import React, { useState } from 'react';
import {
    Building, Hammer, Ruler, Zap, FileText, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Info, Calendar, Move, Sun // <--- FIX ICÔNE (Sun au lieu de ThermometerSun)
} from 'lucide-react';

// --- 1. CONFIGURATION INTELLIGENTE ---

// Traduction des clés techniques en français
const LABELS: Record<string, string> = {
    // Identité
    annee_construction: "Année Fiscale",
    annee_construction_dpe: "Année DPE (Estimée)",
    usage_niveau_1_txt: "Usage Principal",
    nb_log: "Nombre de Logements",

    // Structure & Enveloppe
    mat_mur_txt: "Matériaux Murs (Famille)",
    materiaux_structure_mur_exterieur: "Structure Murs (Détail)",
    mat_toit_txt: "Matériaux Toiture",
    type_isolation_mur_exterieur: "Isolation Murs",
    type_isolation_plancher_bas: "Isolation Sol",
    type_isolation_plancher_haut: "Isolation Plafond/Toit",
    type_plancher_bas_deperditif: "Type Plancher Bas",
    type_plancher_haut_deperditif: "Type Plancher Haut",

    // Menuiseries (Fenêtres)
    type_vitrage: "Type Vitrage",
    type_materiaux_menuiserie: "Cadres Fenêtres",
    type_fermeture: "Volets",
    type_gaz_lame: "Gaz Lame d'Air", // <--- AJOUTÉ ICI
    epaisseur_lame: "Épaisseur Lame (mm)",
    vitrage_vir: "Vitrage à Isolation Renforcée (VIR)",
    uw: "Perf. Fenêtre Globale (Uw)",
    facteur_solaire_baie_vitree: "Facteur Solaire (Sw)",

    // CVC (Chauffage, Eau, Air)
    type_installation_chauffage: "Installation Chauffage",
    type_energie_chauffage: "Énergie Principale",
    type_generateur_chauffage: "Générateur Principal",
    type_generateur_ecs: "Générateur Eau Chaude",
    nb_installation_chauffage: "Nb Installations Chauffage",
    type_ventilation: "Ventilation (VMC)",

    // Performance & DPE
    classe_bilan_dpe: "Classe DPE (Lettre)",
    conso_5_usages_ep_m2: "Conso. 5 usages (Actuel)",
    emission_ges_5_usages_m2: "Émissions GES (kgCO2)",
    u_mur_exterieur: "Déperdition Murs (U)",
    u_plancher_haut_deperditif: "Déperdition Toit (U)",
    classe_inertie: "Confort d'Été (Inertie)",

    // Dimensions & Terrain
    hauteur_mean: "Hauteur Moyenne (m)",
    nb_niveau: "Nombre de Niveaux",
    surface_emprise_sol: "Emprise au Sol (m²)",
    altitude_sol_mean: "Altitude (NGF)",

    // Admin / Contexte
    libelle_commune_insee: "Commune",
    l_parcelle_id: "Parcelles Cadastrales",
    valeur_fonciere_m2_residentiel_rel_commune: "Ratio Valeur / Commune",
    alea_argiles: "Risque Argiles",
    alea_radon: "Risque Radon"
};

// Tooltips pédagogiques (L'intelligence pour le client)
const TOOLTIPS: Record<string, string> = {
    uw: "Coefficient de transmission thermique de la fenêtre entière. Plus il est BAS (< 1.5), meilleure est l'isolation.",
    facteur_solaire_baie_vitree: "Capacité à laisser entrer la chaleur du soleil (Sw). Haut = Bien en hiver, Attention en été.",
    classe_inertie: "Capacité à stocker la chaleur/fraîcheur. 'Lourde' est excellent pour éviter la surchauffe en été.",
    conso_5_usages_ep_m2: "Consommation totale en énergie primaire (Chauffage, Eau, Clim, Éclairage, Auxiliaires). C'est le chiffre clé du DPE.",
    u_plancher_haut_deperditif: "Isolation du toit. Un chiffre < 0.2 est très bon (R > 5).",
    valeur_fonciere_m2_residentiel_rel_commune: "Indicateur de valeur relative : > 1 signifie que ce bien est estimé plus cher que la moyenne de la commune.",
    type_gaz_lame: "Le gaz entre les vitres (Air ou Argon). L'Argon est bien meilleur isolant que l'Air sec." // <--- TOOLTIP AJOUTÉ
};

// Définition des cartes thématiques
const GROUPS = {
    identite: {
        title: "Identité & Volumétrie",
        icon: Building,
        description: "Dimensions physiques du bâtiment.",
        keys: ["usage_niveau_1_txt", "nb_log", "nb_niveau", "hauteur_mean", "surface_emprise_sol"]
    },
    structure: {
        title: "Gros Œuvre & Isolation",
        icon: Hammer,
        description: "Qualité de l'enveloppe thermique.",
        keys: ["materiaux_structure_mur_exterieur", "mat_toit_txt", "type_isolation_mur_exterieur", "type_plancher_haut_deperditif", "u_mur_exterieur", "u_plancher_haut_deperditif", "classe_inertie"]
    },
    ouvertures: {
        title: "Fenêtres & Vitrages",
        icon: Move,
        description: "Performance des menuiseries.",
        // AJOUT DE 'type_gaz_lame' ICI 👇
        keys: ["type_materiaux_menuiserie", "type_vitrage", "type_gaz_lame", "uw", "facteur_solaire_baie_vitree", "type_fermeture", "epaisseur_lame"]
    },
    cvc: {
        title: "Chauffage & Eau Chaude",
        icon: Zap,
        description: "Systèmes installés.",
        keys: ["type_installation_chauffage", "type_energie_chauffage", "type_generateur_chauffage", "type_generateur_ecs", "nb_installation_chauffage"]
    },
    perf: {
        title: "Bilan Énergétique",
        icon: Sun, // <--- UTILISATION DE L'ICÔNE CORRIGÉE
        keys: ["classe_bilan_dpe", "conso_5_usages_ep_m2", "emission_ges_5_usages_m2", "classe_inertie", "type_dpe"]
    },
    admin: {
        title: "Administratif & Localisation",
        icon: FileText,
        description: "Références cadastrales et administratives.",
        keys: ["libelle_commune_insee", "l_parcelle_id", "alea_argiles", "alea_radon"]
    }
};

// Clés à cacher totalement (Blacklist)
const BLACKLIST = [
    "geom_groupe", "batiment_groupe_id", "cle_interop_adr", "batiment_groupe_id", "fiabilite_cr_adr_niv_1",
    "fiabilite_cr_adr_niv_2", "fiabilite_emprise_sol", "fiabilite_hauteur", "lien_valide", "croisement_geospx_reussi", "code_departement_insee", "code_region_insee", "cle_interop_adr_principale_ban",
    "libelle_adr_principale_ban", "code_epci_insee", "code_commune_insee", "contient_fictive_geom_groupe",
    "nb_adresse_valid_ban", "mat_mur_txt", "type_plancher_bas_deperditif", "type_plancher_haut_deperditif",
    "u_baie_vitree", "epaisseur_lame", "conso_3_usages_ep_m2_arrete_2012", "emission_ges_3_usages_ep_m2_arrete_2012",
    "type_energie_chauffage_tertiaire", "type_isolation_plancher_bas_deperditif",
    "nb_classe_bilan_dpe_a", "nb_classe_bilan_dpe_b", "nb_classe_bilan_dpe_c", "nb_classe_bilan_dpe_d",
    "nb_classe_bilan_dpe_e", "nb_classe_bilan_dpe_f", "nb_classe_bilan_dpe_g",
    "nb_classe_conso_energie_arrete_2012_a", "nb_classe_conso_energie_arrete_2012_b", "nb_classe_conso_energie_arrete_2012_c",
    "nb_classe_conso_energie_arrete_2012_d", "nb_classe_conso_energie_arrete_2012_e", "nb_classe_conso_energie_arrete_2012_f", "nb_classe_conso_energie_arrete_2012_g", "nb_classe_conso_energie_arrete_2012_nc",
    "nb_log_rnc", "nb_lot_garpark_rnc", "nb_lot_tertiaire_rnc", "type_generateur_chauffage_appoint", "type_generateur_ecs_anciennete",
    "nb_pdl_pro_dle_elec_2020", "nb_pdl_pro_dle_gaz_2020", "nb_pdl_res_dle_elec_2020", "nb_pdl_res_dle_gaz_2020",
    "conso_pro_dle_elec_2020", "conso_pro_dle_gaz_2020", "conso_res_dle_elec_2020", "conso_res_dle_gaz_2020",
    "nom_batiment_historique_plus_proche", "distance_batiment_historique_plus_proche", "perimetre_bat_historique",
    "numero_immat_principal", "s_geom_groupe", "date_reception_dpe", "arrete_2021",
    "annee_construction_dpe", "usage_principal_bdnb_open"
];

// --- 2. SOUS-COMPOSANTS UI ---

const DataRow = ({ label, value, tooltip }: { label: string, value: any, tooltip?: string }) => {
    let displayValue = value;
    let unit = '';

    // Détermination de l'unité
    if (label.includes("Conso. Énergie Primaire") || label.includes("Conso. 5 usages")) {
        unit = ' kWhEP/m².an';
    } else if (label.includes("Émissions GES")) {
        unit = ' kgCO2/m².an';
    } else if (label.includes("Hauteur") || label.includes("Altitude")) {
        unit = ' m';
    } else if (label.includes("Emprise au Sol") || label.includes("Surface Géométrique")) {
        unit = ' m²';
    } else if (label.includes("Lame")) {
        unit = ' mm';
    } else if (label.includes("Déperdition") || label.includes("Perf. Fenêtre") || label.includes("Déperdition Toit")) {
        unit = ' W/m².K';
    } else if (label.includes("Facteur Solaire")) {
        unit = ' (Sw)';
    }

    // Formatage des valeurs
    if (typeof value === 'boolean') {
        displayValue = value ? (
            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold"><CheckCircle size={12} /> Oui</span>
        ) : (
            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-xs"><XCircle size={12} /> Non</span>
        );
        unit = '';
    } else if (Array.isArray(value)) {
        displayValue = value.join(", ").replace(/_/g, " ");
    } else if (typeof value === 'number') {
        displayValue = (Math.round(value * 100) / 100).toLocaleString('fr-FR');
    } else if (typeof value === 'string') {
        displayValue = value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
    } else if (value === null || value === undefined || value === "") {
        return null;
    }

    return (
        <div className="group relative flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors px-2 -mx-2 rounded-lg">
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-500 font-medium flex items-center gap-1">{label}</span>
                {tooltip && (
                    <div className="relative group/tooltip">
                        <Info size={14} className="text-slate-300 hover:text-kadris-terracotta cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 text-center leading-relaxed">
                            {tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                )}
            </div>
            <span className="text-sm text-slate-900 font-bold text-right max-w-[60%] break-words">
                {displayValue}
                {unit && <span className="font-normal text-slate-500 pl-1">{unit}</span>}
            </span>
        </div>
    );
};

const BentoCard = ({ title, icon: Icon, description, data, keys }: any) => {
    const validKeys = keys.filter((k: string) => data[k] !== null && data[k] !== undefined && data[k] !== "");
    if (!validKeys.length) return null;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-kadris-cream/50 rounded-xl text-kadris-terracotta">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-kadris-slate text-base uppercase tracking-wide">{title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-tight">{description}</p>
                </div>
            </div>
            <div className="space-y-1">
                {validKeys.map((key: string) => (
                    <DataRow
                        key={key}
                        label={LABELS[key] || key.replace(/_/g, " ")}
                        value={data[key]}
                        tooltip={TOOLTIPS[key]}
                    />
                ))}
            </div>
        </div>
    );
};

// --- 3. COMPOSANT PRINCIPAL ---

export const TabBatiment = ({ data }: { data: any }) => {
    const [showAll, setShowAll] = useState(false);

    if (!data) return <div className="p-8 text-center text-slate-400">Données Bâtiment indisponibles.</div>;

    // Calcul de l'année intelligente
    const dates = [data.annee_construction, data.annee_construction_reelle_t, data.annee_construction_dpe]
        .map(d => parseInt(d)).filter(d => !isNaN(d) && d > 1000);
    const smartYear = dates.length > 0 ? Math.min(...dates) : (data.annee_construction || "--");

    const usedKeys = new Set(Object.values(GROUPS).flatMap(g => g.keys));
    const remainingKeys = Object.keys(data).filter(key =>
        !usedKeys.has(key) &&
        !BLACKLIST.includes(key) &&
        data[key] !== null &&
        data[key] !== "" &&
        !key.startsWith("nb_classe_")
    );

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">

            {/* HERO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-kadris-slate text-white p-8 rounded-2xl shadow-lg flex items-center gap-6 col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                        <Building size={40} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs uppercase text-kadris-terracotta font-bold tracking-widest mb-1 flex items-center gap-2">
                            <Info size={12} /> Fiche Technique Officielle
                        </div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                            {data.usage_niveau_1_txt || "Bâtiment"}
                        </h2>
                        <p className="text-white/80 text-sm font-mono bg-black/20 px-2 py-1 rounded inline-block">
                            {data.libelle_adr_principale_ban}
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center relative group">
                    <div className="absolute top-3 right-3 text-slate-200 group-hover:text-kadris-terracotta transition-colors">
                        <Calendar size={20} />
                    </div>
                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-2">Année d'Origine</div>
                    <div className="text-5xl font-black text-kadris-slate group-hover:scale-110 transition-transform duration-300">
                        {smartYear}
                    </div>
                    {data.annee_construction_dpe && (
                        <div className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded mt-2 font-bold">
                            Validée par DPE
                        </div>
                    )}
                </div>
            </div>

            {/* GRILLE D'ANALYSE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard {...GROUPS.identite} data={data} />
                <BentoCard {...GROUPS.structure} data={data} />
                <BentoCard {...GROUPS.ouvertures} data={data} />
                <BentoCard {...GROUPS.cvc} data={data} />
                <BentoCard {...GROUPS.perf} data={data} />
                <BentoCard {...GROUPS.admin} data={data} />
            </div>

            {/* MODE EXPERT */}
            {remainingKeys.length > 0 && (
                <div className="border-t border-slate-100 pt-8">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center justify-center gap-3 w-full py-4 text-sm font-bold text-kadris-slate bg-white border border-slate-200 hover:bg-slate-50 hover:border-kadris-slate/30 rounded-xl transition-all shadow-sm group"
                    >
                        {showAll ? "Masquer les données brutes" : `Afficher les ${remainingKeys.length} autres données techniques`}
                        <span className="bg-slate-100 p-1 rounded-full group-hover:bg-slate-200 transition-colors">
                            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                    </button>

                    {showAll && (
                        <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-xs">
                                {remainingKeys.map(key => (
                                    <div key={key} className="flex flex-col border-b border-slate-200/50 pb-2">
                                        <span className="text-slate-400 font-mono mb-1 truncate" title={key}>{key}</span>
                                        <span className="font-bold text-slate-700 break-all">
                                            {typeof data[key] === 'object' ? 'Donnée Complexe' : String(data[key])}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};