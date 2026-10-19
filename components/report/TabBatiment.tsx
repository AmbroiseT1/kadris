"use client";

import React, { useState } from 'react';
import {
    Building, Hammer, Zap, FileText, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Info, Calendar, Move, Sun, type LucideIcon
} from 'lucide-react';
import { resolveAnneeConstruction } from '@/app/lib/bndb';
import { SourceInfo } from '@/app/lib/sources';
import { SourceBadge } from './SourceBadge';

// --- 1. CONFIGURATION INTELLIGENTE ---

const LABELS: Record<string, string> = {
    annee_construction: "Année Fiscale",
    annee_construction_dpe: "Année DPE (Estimée)",
    usage_niveau_1_txt: "Usage Principal",
    nb_log: "Nombre de Logements",
    mat_mur_txt: "Matériaux Murs (Famille)",
    materiaux_structure_mur_exterieur: "Structure Murs (Détail)",
    mat_toit_txt: "Matériaux Toiture",
    type_isolation_mur_exterieur: "Isolation Murs",
    type_isolation_plancher_bas: "Isolation Sol",
    type_isolation_plancher_haut: "Isolation Plafond/Toit",
    type_plancher_bas_deperditif: "Type Plancher Bas",
    type_plancher_haut_deperditif: "Type Plancher Haut",
    type_vitrage: "Type Vitrage",
    type_materiaux_menuiserie: "Cadres Fenêtres",
    type_fermeture: "Volets",
    type_gaz_lame: "Gaz Lame d'Air",
    epaisseur_lame: "Épaisseur Lame (mm)",
    vitrage_vir: "Vitrage à Isolation Renforcée (VIR)",
    uw: "Perf. Fenêtre Globale (Uw)",
    facteur_solaire_baie_vitree: "Facteur Solaire (Sw)",
    type_installation_chauffage: "Installation Chauffage",
    type_energie_chauffage: "Énergie Principale",
    type_generateur_chauffage: "Générateur Principal",
    type_generateur_ecs: "Générateur Eau Chaude",
    nb_installation_chauffage: "Nb Installations Chauffage",
    type_ventilation: "Ventilation (VMC)",
    classe_bilan_dpe: "Classe DPE (Lettre)",
    conso_5_usages_ep_m2: "Conso. 5 usages (Actuel)",
    emission_ges_5_usages_m2: "Émissions GES (kgCO2)",
    u_mur_exterieur: "Déperdition Murs (U)",
    u_plancher_haut_deperditif: "Déperdition Toit (U)",
    classe_inertie: "Confort d'Été (Inertie)",
    hauteur_mean: "Hauteur Moyenne (m)",
    nb_niveau: "Nombre de Niveaux",
    surface_emprise_sol: "Emprise au Sol (m²)",
    altitude_sol_mean: "Altitude (NGF)",
    libelle_commune_insee: "Commune",
    l_parcelle_id: "Parcelles Cadastrales",
    valeur_fonciere_m2_residentiel_rel_commune: "Ratio Valeur / Commune",
    alea_argiles: "Risque Argiles",
    alea_radon: "Risque Radon"
};

const TOOLTIPS: Record<string, string> = {
    uw: "Coefficient de transmission thermique de la fenêtre entière. Plus il est BAS (< 1.5), meilleure est l'isolation.",
    facteur_solaire_baie_vitree: "Capacité à laisser entrer la chaleur du soleil (Sw). Haut = Bien en hiver, Attention en été.",
    classe_inertie: "Capacité à stocker la chaleur/fraîcheur. 'Lourde' est excellent pour éviter la surchauffe en été.",
    conso_5_usages_ep_m2: "Consommation totale en énergie primaire (Chauffage, Eau, Clim, Éclairage, Auxiliaires). C'est le chiffre clé du DPE.",
    u_plancher_haut_deperditif: "Isolation du toit. Un chiffre < 0.2 est très bon (R > 5).",
    valeur_fonciere_m2_residentiel_rel_commune: "Indicateur de valeur relative : > 1 signifie que ce bien est estimé plus cher que la moyenne de la commune.",
    type_gaz_lame: "Le gaz entre les vitres (Air ou Argon). L'Argon est bien meilleur isolant que l'Air sec."
};

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
        icon: Sun,
        keys: ["classe_bilan_dpe", "conso_5_usages_ep_m2", "emission_ges_5_usages_m2", "classe_inertie", "type_dpe"]
    },
    admin: {
        title: "Administratif & Localisation",
        icon: FileText,
        description: "Références cadastrales et administratives.",
        keys: ["libelle_commune_insee", "l_parcelle_id", "alea_argiles", "alea_radon"]
    }
};

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

const DataRow = ({ label, value, tooltip }: { label: string, value: unknown, tooltip?: string }) => {
    let displayValue = value as React.ReactNode;
    let unit = '';

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

    if (typeof value === 'boolean') {
        displayValue = value ? (
            <span className="inline-flex items-center gap-1 text-ok bg-ok-soft px-2 py-0.5 rounded-sm text-xs font-bold border border-ok/30"><CheckCircle size={12} /> Oui</span>
        ) : (
            <span className="inline-flex items-center gap-1 text-texte-2 bg-papier px-2 py-0.5 rounded-sm text-xs border border-trait"><XCircle size={12} /> Non</span>
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
        <div className="group relative flex justify-between items-center py-3 border-b border-trait last:border-0 hover:bg-papier transition-colors px-2 -mx-2">
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-texte-2 font-medium flex items-center gap-1">{label}</span>
                {tooltip && (
                    <div className="relative group/tooltip">
                        <Info size={12} className="text-texte-2 hover:text-brique cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-encre text-white text-xs rounded-sm opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-20 text-center leading-relaxed font-light">
                            {tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bricq-slate"></div>
                        </div>
                    </div>
                )}
            </div>
            <span className="text-sm text-texte font-bold text-right max-w-[60%] break-words">
                {displayValue}
                {unit && <span className="font-normal text-texte-2 pl-1 font-mono text-xs">{unit}</span>}
            </span>
        </div>
    );
};

const BentoCard = ({ title, icon: Icon, description, data, keys }: {
    title: string;
    icon: LucideIcon;
    description?: string;
    data: Record<string, unknown>;
    keys: string[];
}) => {
    const validKeys = keys.filter((k: string) => data[k] !== null && data[k] !== undefined && data[k] !== "");
    if (!validKeys.length) return null;

    return (
        <div className="bg-white border border-trait rounded-sm p-5">
            <div className="flex items-start gap-3 mb-5 border-b border-trait pb-3">
                <div className="p-2 bg-papier rounded-sm text-brique border border-brique/30">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="font-serif font-bold text-texte text-base">{title}</h3>
                    <p className="text-xs text-texte-2 mt-0.5 leading-tight font-light">{description}</p>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TabBatiment = ({ data, sources }: { data: any; sources?: { bdnb?: SourceInfo; dpe?: SourceInfo } }) => {
    const [showAll, setShowAll] = useState(false);

    if (!data) return <div className="p-8 text-center text-texte-2">Données Bâtiment indisponibles.</div>;

    const annee = resolveAnneeConstruction(data);
    const smartYear = annee.source === 'inconnue' ? '--' : annee.label;
    const dpeMatch: string | undefined = data.dpe_reel?.match_label;

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
                <div className="bg-encre text-white p-8 rounded-sm border border-texte col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="p-3 bg-white/10 rounded-sm backdrop-blur-sm border border-white/10 inline-block">
                        <Building size={32} className="text-white" />
                    </div>
                    <div className="relative z-10 mt-4">
                        <div className="text-xs uppercase text-brique font-bold tracking-widest mb-2 flex items-center gap-2 font-mono">
                            <Info size={10} /> Fiche Technique Officielle
                        </div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                            {data.usage_niveau_1_txt || "Bâtiment"}
                        </h2>
                        <p className="text-white/80 text-sm font-mono bg-black/20 px-2 py-1 rounded-sm inline-block">
                            {data.libelle_adr_principale_ban}
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-trait p-6 rounded-sm flex flex-col justify-center items-center text-center relative group">
                    <div className="absolute top-3 right-3 text-texte-2 group-hover:text-brique transition-colors">
                        <Calendar size={18} />
                    </div>
                    <div className="text-xs uppercase text-texte-2 font-bold tracking-wider mb-2 font-mono">Année d’Origine</div>
                    <div className="text-5xl font-black text-texte group-hover:scale-105 transition-transform duration-300">
                        {smartYear}
                    </div>
                    <div className="text-xs text-texte-2 mt-1">
                        {annee.source === 'fiscale' ? 'Source : fichiers fonciers (BDNB)' : annee.source === 'dpe' ? 'Source : DPE (année déclarée)' : annee.source === 'periode' ? 'Période estimée' : ''}
                    </div>
                    {annee.source === 'fiscale' && annee.annee !== null && parseInt(data.annee_construction_dpe) === annee.annee && (
                        <div className="text-xs text-ok bg-ok-soft px-2 py-1 rounded-sm mt-2 font-bold border border-ok/30">
                            Confirmée par le DPE
                        </div>
                    )}
                </div>
            </div>

            {dpeMatch && (
                <div className={`p-3 rounded-sm border text-sm ${data.dpe_reel?.match === 'proximite' ? 'bg-vigil-soft border-vigil/30 text-vigil' : 'bg-papier border-trait text-texte-2'}`} role="note">
                    <strong>Performance énergétique :</strong> {dpeMatch}
                    {data.dpe_reel?.date_etablissement_dpe && <> — établi le {new Date(data.dpe_reel.date_etablissement_dpe).toLocaleDateString('fr-FR')}</>}
                </div>
            )}

            {/* GRILLE D'ANALYSE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard {...GROUPS.identite} data={data} />
                <BentoCard {...GROUPS.structure} data={data} />
                <BentoCard {...GROUPS.ouvertures} data={data} />
                <BentoCard {...GROUPS.cvc} data={data} />
                <BentoCard {...GROUPS.perf} data={data} />
                <BentoCard {...GROUPS.admin} data={data} />
            </div>

            <div className="space-y-1">
                <SourceBadge source={sources?.bdnb} />
                <SourceBadge source={sources?.dpe} />
            </div>

            {/* MODE EXPERT */}
            {remainingKeys.length > 0 && (
                <div className="border-t border-trait pt-8">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center justify-center gap-3 w-full py-4 text-sm font-bold text-texte bg-white border border-trait hover:bg-papier hover:border-trait-fort rounded-sm transition-all group"
                    >
                        {showAll ? "Masquer les données brutes" : `Afficher les ${remainingKeys.length} autres données techniques`}
                        <span className="bg-papier p-1 rounded-sm group-hover:bg-trait transition-colors">
                            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                    </button>

                    {showAll && (
                        <div className="mt-6 p-6 bg-papier rounded-sm border border-trait animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-xs">
                                {remainingKeys.map(key => (
                                    <div key={key} className="flex flex-col border-b border-trait pb-2">
                                        <span className="text-texte-2 font-mono mb-1 truncate" title={key}>{key}</span>
                                        <span className="font-bold text-texte break-all">
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
