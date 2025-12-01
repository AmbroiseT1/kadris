"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, Loader2, Shield, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddressAutocompleteSimple } from '@/components/ui/AddressAutocompleteSimple';
import { setCurrentUser, addPropertyToCurrentUser } from '@/utils/propertyStorage';
import { createUserProfile, getUserProfile } from '@/utils/userStorage';

type ViewState = 'LOGIN' | 'SIGNUP' | 'SUCCESS';

// Types for address and building data
interface AddressData {
    label: string;
    coordinates: [number, number]; // [lon, lat]
    city: string;
    postcode: string;
    context: string;
}

interface BuildingData {
    adresse_ban: string;
    annee_construction: string;
    dpe_lettre: string;
    materiaux_murs: string;
    materiaux_toiture: string;
    hauteur: number;
    nb_niveaux: number;
    surface_sol: number;
    nb_logements: number;
    usage: string;
    coords?: { lat: number; lon: number };
    cle_interop?: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [view, setView] = useState<ViewState>('LOGIN');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
    const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
    const [isFetchingBuilding, setIsFetchingBuilding] = useState(false);
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loginEmail, setLoginEmail] = useState('');

    // Admin bypass email
    const ADMIN_EMAIL = 'amb.torris@gmail.com';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Set current user to persist session
        setCurrentUser(loginEmail);

        // Simulate login delay
        setTimeout(() => {
            setIsLoading(false);
            router.push('/properties');
        }, 1500);
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedAddress || !buildingData) return;

        setIsLoading(true);

        // Create user profile
        createUserProfile(email, firstName, lastName);

        // Set current user
        setCurrentUser(email);

        // Create property object
        const propertyId = Date.now().toString();
        const newProperty = {
            id: propertyId,
            data: buildingData,
            claimedAt: new Date().toISOString()
        };

        // Add property to current user's collection
        addPropertyToCurrentUser(newProperty);

        // Check if user is admin - bypass validation
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        // Simulate upload and verification request
        setTimeout(() => {
            setIsLoading(false);
            if (isAdmin) {
                // Admin bypass - go directly to properties page
                router.push('/properties');
            } else {
                // Regular flow - show success message
                setView('SUCCESS');
            }
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAddressSelect = async (feature: any) => {
        const addressData: AddressData = {
            label: feature.properties.label,
            coordinates: feature.geometry.coordinates,
            city: feature.properties.city,
            postcode: feature.properties.postcode,
            context: feature.properties.context,
        };
        setSelectedAddress(addressData);

        // Fetch building data from BDNB using the coordinates
        setIsFetchingBuilding(true);
        try {
            const [lon, lat] = feature.geometry.coordinates;
            // Use BAN ID to construct the cle_interop for BDNB
            const cleInterop = feature.properties.id; // BAN ID can be used as cle_interop

            const response = await fetch(`https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse?limit=1&cle_interop_adr=eq.${cleInterop}`);

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const bat = data[0];
                    const buildingInfo: BuildingData = {
                        adresse_ban: bat.libelle_adr_principale_ban || addressData.label,
                        annee_construction: bat.annee_construction || "Non daté",
                        dpe_lettre: bat.classe_bilan_dpe || bat.classe_bilan_dpe_moyen || "Non noté",
                        materiaux_murs: bat.mat_mur_txt || "Non renseigné",
                        materiaux_toiture: bat.mat_toit_txt || "Non renseigné",
                        hauteur: bat.hauteur_mean,
                        nb_niveaux: bat.nb_niveau,
                        surface_sol: bat.surface_emprise_sol,
                        nb_logements: bat.nb_log,
                        usage: bat.usage_niveau_1_txt || "Non déterminé",
                        coords: { lat, lon },
                        cle_interop: cleInterop,
                    };
                    setBuildingData(buildingInfo);
                }
            }
        } catch (error) {
            console.error("Error fetching building data:", error);
        } finally {
            setIsFetchingBuilding(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex flex-col md:flex-row">

            {/* Left Side - Visual / Brand */}
            <div className="w-full md:w-1/2 bg-bricq-slate text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors mb-12">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-12 h-12 object-contain rounded-sm" />
                        <span className="text-4xl font-bold font-serif tracking-tighter">bricq</span>
                    </Link>

                    <div className="max-w-md">
                        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            L'intelligence immobilière au service de votre patrimoine.
                        </h1>
                        <p className="text-white/60 text-lg font-light leading-relaxed">
                            Rejoignez les propriétaires qui valorisent leur bien grâce à la transparence et à la donnée certifiée.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 mt-12 md:mt-0">
                    <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-white/40">
                        <span>Sécurité</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span>Confidentialité</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span>Conformité</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12">
                <div className="w-full max-w-md">
                    <AnimatePresence mode="wait">

                        {/* LOGIN VIEW */}
                        {view === 'LOGIN' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="font-serif text-3xl font-bold text-bricq-slate mb-2">Connexion</h2>
                                    <p className="text-bricq-slate/60">Accédez à votre espace propriétaire sécurisé.</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-bricq-slate mb-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-bricq-slate/20 rounded-sm focus:outline-none focus:border-bricq-terracotta transition-colors"
                                                placeholder="nom@exemple.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-bricq-slate mb-1">Mot de passe</label>
                                            <input
                                                type="password"
                                                required
                                                className="w-full px-4 py-3 bg-white border border-bricq-slate/20 rounded-sm focus:outline-none focus:border-bricq-terracotta transition-colors"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Se connecter'}
                                    </button>
                                </form>

                                <div className="pt-6 border-t border-bricq-slate/10 text-center">
                                    <p className="text-sm text-bricq-slate/60 mb-4">Vous n'avez pas encore de compte ?</p>
                                    <button
                                        onClick={() => setView('SIGNUP')}
                                        className="text-bricq-terracotta font-bold hover:underline decoration-2 underline-offset-4"
                                    >
                                        Demander un accès propriétaire
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* SIGNUP VIEW */}
                        {view === 'SIGNUP' && (
                            <motion.div
                                key="signup"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <button
                                    onClick={() => setView('LOGIN')}
                                    className="flex items-center gap-2 text-sm text-bricq-slate/50 hover:text-bricq-slate transition-colors mb-4"
                                >
                                    <ArrowLeft size={16} /> Retour
                                </button>

                                <div>
                                    <h2 className="font-serif text-3xl font-bold text-bricq-slate mb-2">Créer un compte propriétaire</h2>
                                    <p className="text-bricq-slate/60">Remplissez vos informations pour revendiquer votre bien immobilier.</p>
                                </div>

                                <form onSubmit={handleSignup} className="space-y-6">
                                    {/* User Information Section */}
                                    <div className="pb-6 border-b border-bricq-slate/10">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-bricq-slate/60 mb-4">Vos informations</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-bricq-slate mb-1">Prénom *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-bricq-slate/20 rounded-sm focus:outline-none focus:border-bricq-terracotta transition-colors"
                                                        placeholder="Jean"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-bricq-slate mb-1">Nom *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-bricq-slate/20 rounded-sm focus:outline-none focus:border-bricq-terracotta transition-colors"
                                                        placeholder="Dupont"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-bricq-slate mb-1">Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-bricq-slate/20 rounded-sm focus:outline-none focus:border-bricq-terracotta transition-colors"
                                                    placeholder="nom@exemple.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property Information Section */}
                                    <div className="pb-6 border-b border-bricq-slate/10">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-bricq-slate/60 mb-4">Votre propriété</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-bricq-slate mb-2">Adresse du bien *</label>
                                            <p className="text-xs text-bricq-slate/50 mb-3 flex items-center gap-1">
                                                <Shield size={12} /> L'adresse sera vérifiée avec votre titre de propriété
                                            </p>

                                            {/* Address Autocomplete - Compact version for form */}
                                            <div className="relative">
                                                {!selectedAddress ? (
                                                    <AddressAutocompleteSimple onSelect={handleAddressSelect} />
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3 p-4 bg-bricq-sage/5 border border-bricq-sage/20 rounded-sm">
                                                            <MapPin className="text-bricq-sage mt-1 flex-shrink-0" size={18} />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-bricq-slate">{selectedAddress.label}</div>
                                                                <div className="text-xs text-bricq-slate/50 mt-1">{selectedAddress.context}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedAddress(null);
                                                                    setBuildingData(null);
                                                                }}
                                                                className="text-xs text-bricq-slate/50 hover:text-bricq-slate underline"
                                                            >
                                                                Modifier
                                                            </button>
                                                        </div>

                                                        {/* Building Data Preview */}
                                                        {isFetchingBuilding && (
                                                            <div className="flex items-center gap-2 text-sm text-bricq-slate/60 p-3 bg-white border border-bricq-slate/10 rounded-sm">
                                                                <Loader2 className="animate-spin" size={16} />
                                                                <span>Récupération des données du bien...</span>
                                                            </div>
                                                        )}

                                                        {buildingData && !isFetchingBuilding && (
                                                            <div className="p-4 bg-white border border-bricq-slate/10 rounded-sm">
                                                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-bricq-slate/5">
                                                                    <CheckCircle size={16} className="text-bricq-sage" />
                                                                    <span className="text-xs font-bold uppercase tracking-wider text-bricq-slate/60">Aperçu du bien</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                    <div>
                                                                        <span className="text-bricq-slate/50">Construction:</span>
                                                                        <span className="ml-2 text-bricq-slate font-medium">{buildingData.annee_construction}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-bricq-slate/50">DPE:</span>
                                                                        <span className="ml-2 text-bricq-slate font-medium">{buildingData.dpe_lettre}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-bricq-slate/50">Surface:</span>
                                                                        <span className="ml-2 text-bricq-slate font-medium">{buildingData.surface_sol} m²</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-bricq-slate/50">Logements:</span>
                                                                        <span className="ml-2 text-bricq-slate font-medium">{buildingData.nb_logements}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-bricq-slate/50 mt-3 italic">
                                                                    Ces données seront utilisées pour pré-remplir votre tableau de bord
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property Title Upload Section */}
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-bricq-slate/60 mb-4">Vérification d'identité</h3>
                                        <label className="block text-sm font-medium text-bricq-slate mb-2">Titre de propriété *</label>
                                        <p className="text-xs text-bricq-slate/60 mb-3">
                                            Pour garantir votre identité et la propriété du bien, veuillez télécharger un titre de propriété valide à votre nom.
                                        </p>
                                        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-bricq-sage bg-bricq-sage/5' : 'border-bricq-slate/20 hover:border-bricq-slate/40'}`}>
                                            <input
                                                type="file"
                                                id="title-upload"
                                                className="hidden"
                                                accept=".pdf,.jpg,.png"
                                                onChange={handleFileChange}
                                                required
                                            />
                                            <label htmlFor="title-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                                {file ? (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-bricq-sage/20 flex items-center justify-center text-bricq-sage">
                                                            <CheckCircle size={24} />
                                                        </div>
                                                        <span className="font-medium text-bricq-slate">{file.name}</span>
                                                        <span className="text-xs text-bricq-slate/50">Cliquez pour changer</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-bricq-slate/5 flex items-center justify-center text-bricq-slate/40">
                                                            <Upload size={24} />
                                                        </div>
                                                        <span className="font-medium text-bricq-slate">Cliquez pour télécharger</span>
                                                        <span className="text-xs text-bricq-slate/50">PDF, JPG ou PNG (Max 10Mo)</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                        <p className="mt-2 text-xs text-bricq-slate/50 flex items-center gap-1">
                                            <Shield size={12} /> Vos documents sont chiffrés et traités confidentiellement.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !file || !selectedAddress || !buildingData}
                                        className="w-full py-4 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Créer mon compte'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* SUCCESS VIEW */}
                        {view === 'SUCCESS' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 py-8"
                            >
                                <div className="w-20 h-20 bg-bricq-sage/10 rounded-full flex items-center justify-center mx-auto text-bricq-sage mb-6">
                                    <Mail size={40} />
                                </div>

                                <h2 className="font-serif text-3xl font-bold text-bricq-slate">Demande reçue !</h2>

                                <div className="bg-white p-6 rounded-sm border border-bricq-slate/10 shadow-sm text-left">
                                    <p className="text-bricq-slate/80 leading-relaxed mb-4">
                                        Votre titre de propriété et vos informations sont en cours de vérification par nos équipes.
                                    </p>
                                    <p className="text-bricq-slate/80 leading-relaxed font-medium mb-4">
                                        Vous recevrez votre lien d'accès sécurisé par email sous <span className="text-bricq-terracotta">10 minutes</span>.
                                    </p>
                                    <div className="pt-4 border-t border-bricq-slate/10">
                                        <p className="text-sm text-bricq-slate/70 flex items-center gap-2">
                                            <CheckCircle size={16} className="text-bricq-sage flex-shrink-0" />
                                            <span>Votre tableau de bord sera pré-rempli avec les données de votre bien !</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <Link
                                        href="/"
                                        className="inline-block px-8 py-3 border border-bricq-slate/20 hover:bg-bricq-slate hover:text-white transition-colors font-bold uppercase tracking-wider text-sm"
                                    >
                                        Retour à l'accueil
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
