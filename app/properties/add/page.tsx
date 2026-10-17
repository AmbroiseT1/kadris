"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, Loader2, Shield, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddressAutocompleteSimple } from '@/components/ui/AddressAutocompleteSimple';
import { getCurrentUser, isAdminUser, addPropertyToCurrentUser } from '@/utils/propertyStorage';
import { fetchRnbBuilding } from '@/app/lib/rnb';
import { fetchBdnbRaw, isValidCleInterop, mapBdnbToBuilding } from '@/app/lib/bndb';

interface AddressData {
    label: string;
    coordinates: [number, number];
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
    rnb_id?: string;
}

export default function AddPropertyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
    const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
    const [isFetchingBuilding, setIsFetchingBuilding] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check authentication on mount
        const user = getCurrentUser();
        if (!user) {
            // No user logged in, redirect to login
            router.push('/login');
            return;
        }
        setCurrentUser(user);
        setIsAdmin(isAdminUser());
    }, [router]);

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

        // Fetch building data from BDNB
        setIsFetchingBuilding(true);
        try {
            const [lon, lat] = feature.geometry.coordinates;
            const cleInterop = feature.properties.id;

            // Validation + encodage de la clé BAN et règle d'année : centralisées dans lib/bndb.ts
            const bat = isValidCleInterop(cleInterop) ? await fetchBdnbRaw(cleInterop) : null;
            if (bat) {
                const mapped = mapBdnbToBuilding(bat);

                // Fetch RNB ID
                const rnbBuilding = await fetchRnbBuilding(lat, lon);

                const buildingInfo: BuildingData = {
                    adresse_ban: mapped.adresse_ban || addressData.label,
                    annee_construction: mapped.annee_construction || "Non daté",
                    dpe_lettre: mapped.dpe_lettre || "Non noté",
                    materiaux_murs: mapped.materiaux_murs || "Non renseigné",
                    materiaux_toiture: mapped.materiaux_toiture || "Non renseigné",
                    hauteur: bat.hauteur_mean,
                    nb_niveaux: bat.nb_niveau,
                    surface_sol: bat.surface_emprise_sol,
                    nb_logements: bat.nb_log,
                    usage: mapped.usage || "Non déterminé",
                    coords: { lat, lon },
                    cle_interop: cleInterop,
                    rnb_id: rnbBuilding?.rnb_id
                };
                setBuildingData(buildingInfo);
            }
        } catch (error) {
            console.error("Error fetching building data:", error);
        } finally {
            setIsFetchingBuilding(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAddress || !buildingData) return;
        if (!isAdmin && !file) return; // Require file upload for non-admin users

        setIsLoading(true);

        // Create property object
        const propertyId = Date.now().toString();
        const newProperty = {
            id: propertyId,
            data: buildingData,
            claimedAt: new Date().toISOString()
        };

        // Add to current user's properties
        addPropertyToCurrentUser(newProperty);

        setTimeout(() => {
            setIsLoading(false);
            // Redirect to the new property's dashboard
            router.push(`/dashboard?propertyId=${propertyId}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
            {/* Header */}
            <header className="border-b border-bricq-slate/10 bg-white">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/properties" className="flex items-center gap-3 text-bricq-slate hover:opacity-70 transition-opacity">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Retour à mes biens</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
                        <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                    <div className="mb-8">
                        <h1 className="font-serif text-4xl font-bold text-bricq-slate mb-4">Revendiquer un nouveau bien</h1>
                        <p className="text-bricq-slate/60 text-lg">
                            {isAdmin
                                ? "En tant qu'admin, vous pouvez ajouter un bien simplement en saisissant son adresse."
                                : "Renseignez l'adresse et le titre de propriété pour ajouter un nouveau bien à votre portefeuille."
                            }
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-sm border border-bricq-slate/10 shadow-sm">
                        {/* Address Section */}
                        <div>
                            <label className="block text-sm font-medium text-bricq-slate mb-2">Adresse du bien *</label>
                            <p className="text-xs text-bricq-slate/50 mb-3 flex items-center gap-1">
                                <Shield size={12} /> Recherchez l'adresse exacte de votre propriété
                            </p>

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
                                                {buildingData.rnb_id && (
                                                    <div className="col-span-2 mt-2 pt-2 border-t border-bricq-slate/5">
                                                        <span className="text-bricq-slate/50">ID RNB:</span>
                                                        <span className="ml-2 text-bricq-slate font-medium font-mono text-xs bg-bricq-slate/5 px-1 py-0.5 rounded">{buildingData.rnb_id}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Property Title Upload - Only for non-admin users */}
                        {!isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-bricq-slate mb-2">Titre de propriété *</label>
                                <p className="text-xs text-bricq-slate/60 mb-3">
                                    Pour garantir la propriété du bien, veuillez télécharger un titre de propriété valide à votre nom.
                                </p>
                                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-bricq-sage bg-bricq-sage/5' : 'border-bricq-slate/20 hover:border-bricq-slate/40'}`}>
                                    <input
                                        type="file"
                                        id="title-upload"
                                        className="hidden"
                                        accept=".pdf,.jpg,.png"
                                        onChange={handleFileChange}
                                        required={!isAdmin}
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
                        )}

                        {/* Admin Notice */}
                        {isAdmin && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                                <p className="text-sm text-blue-800">
                                    <strong>Mode développeur activé</strong> - Le titre de propriété n'est pas requis pour votre compte.
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !selectedAddress || !buildingData || (!isAdmin && !file)}
                            className="w-full py-4 bg-bricq-slate text-white font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Ajouter ce bien'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
