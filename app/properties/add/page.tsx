"use client";

import { LogoMark } from "@/components/ui/Logo";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, Loader2, Shield, MapPin } from 'lucide-react';
import { AddressAutocompleteSimple, type AddressFeature } from '@/components/ui/AddressAutocompleteSimple';
import { useAuth } from '@/app/context/AuthContext';
import { apiErrorMessage, propertiesApi } from '@/app/lib/api';
import { fetchRnbBuilding } from '@/app/lib/rnb';
import { fetchBdnbRaw, isValidCleInterop, mapBdnbToBuilding } from '@/app/lib/bndb';

interface AddressData {
    label: string;
    coordinates: [number, number];
    city: string;
    postcode: string;
    citycode?: string;
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
    const [submitError, setSubmitError] = useState<string | null>(null);
    // Indicatif pour l'interface (is_admin de /users/me) : l'API exige elle-même le
    // justificatif pour tout compte non administrateur.
    // La redirection des visiteurs non connectés vers /login est faite par AuthContext.
    const { isAdmin } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAddressSelect = async (feature: AddressFeature) => {
        const addressData: AddressData = {
            label: feature.properties.label,
            coordinates: feature.geometry.coordinates,
            city: feature.properties.city,
            postcode: feature.properties.postcode,
            citycode: feature.properties.citycode,
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
        } catch {
            // Données bâtiment indisponibles : le bien peut être ajouté sans elles
        } finally {
            setIsFetchingBuilding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAddress) return;
        if (!isAdmin && !file) return;

        setIsLoading(true);
        setSubmitError(null);
        const [lon, lat] = selectedAddress.coordinates;
        try {
            const property = await propertiesApi.create(
                {
                    address_label: buildingData?.adresse_ban || selectedAddress.label,
                    cle_interop: buildingData?.cle_interop ?? null,
                    lat,
                    lon,
                    code_insee: selectedAddress.citycode ?? null,
                    building_data: buildingData ? { ...buildingData } : null,
                },
                file,
            );
            router.push(`/dashboard?propertyId=${encodeURIComponent(property.id)}`);
        } catch (error) {
            setSubmitError(apiErrorMessage(error, "Impossible d'ajouter ce bien. Veuillez réessayer."));
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-papier flex flex-col">
            {/* Header */}
            <header className="border-b border-trait bg-white">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/properties" className="flex items-center gap-3 text-texte hover:opacity-70 transition-opacity">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Retour à mes biens</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2">
                        <LogoMark className="w-8 h-8 text-encre" />
                        <span className="text-2xl font-bold font-serif tracking-tighter text-texte">bricq</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                    <div className="mb-8">
                        <h1 className="font-serif text-4xl font-bold text-texte mb-4">Revendiquer un nouveau bien</h1>
                        <p className="text-texte-2 text-lg">
                            {isAdmin
                                ? "En tant qu'administrateur, vous pouvez ajouter un bien simplement en saisissant son adresse."
                                : "Renseignez l'adresse et un justificatif de propriété. Votre bien sera ensuite vérifié par notre équipe."
                            }
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-sm border border-trait shadow-sm">
                        {/* Address Section */}
                        <div>
                            <label className="block text-sm font-medium text-texte mb-2">Adresse du bien *</label>
                            <p className="text-xs text-texte-2 mb-3 flex items-center gap-1">
                                <Shield size={12} /> Recherchez l’adresse exacte de votre propriété
                            </p>

                            {!selectedAddress ? (
                                <AddressAutocompleteSimple onSelect={handleAddressSelect} />
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-4 bg-ok-soft border border-ok/30 rounded-sm">
                                        <MapPin className="text-ok mt-1 flex-shrink-0" size={18} />
                                        <div className="flex-1">
                                            <div className="font-medium text-texte">{selectedAddress.label}</div>
                                            <div className="text-xs text-texte-2 mt-1">{selectedAddress.context}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedAddress(null);
                                                setBuildingData(null);
                                            }}
                                            className="text-xs text-texte-2 hover:text-texte underline"
                                        >
                                            Modifier
                                        </button>
                                    </div>

                                    {/* Building Data Preview */}
                                    {isFetchingBuilding && (
                                        <div className="flex items-center gap-2 text-sm text-texte-2 p-3 bg-white border border-trait rounded-sm">
                                            <Loader2 className="animate-spin" size={16} />
                                            <span>Récupération des données du bien...</span>
                                        </div>
                                    )}

                                    {buildingData && !isFetchingBuilding && (
                                        <div className="p-4 bg-white border border-trait rounded-sm">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-trait">
                                                <CheckCircle size={16} className="text-ok" />
                                                <span className="text-xs font-bold uppercase tracking-wider text-texte-2">Aperçu du bien</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                <div>
                                                    <span className="text-texte-2">Construction:</span>
                                                    <span className="ml-2 text-texte font-medium">{buildingData.annee_construction}</span>
                                                </div>
                                                <div>
                                                    <span className="text-texte-2">DPE:</span>
                                                    <span className="ml-2 text-texte font-medium">{buildingData.dpe_lettre}</span>
                                                </div>
                                                <div>
                                                    <span className="text-texte-2">Surface:</span>
                                                    <span className="ml-2 text-texte font-medium">{buildingData.surface_sol} m²</span>
                                                </div>
                                                <div>
                                                    <span className="text-texte-2">Logements:</span>
                                                    <span className="ml-2 text-texte font-medium">{buildingData.nb_logements}</span>
                                                </div>
                                                {buildingData.rnb_id && (
                                                    <div className="col-span-2 mt-2 pt-2 border-t border-trait">
                                                        <span className="text-texte-2">ID RNB:</span>
                                                        <span className="ml-2 text-texte font-medium font-mono text-xs bg-encre-soft px-1 py-0.5 rounded">{buildingData.rnb_id}</span>
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
                                <label className="block text-sm font-medium text-texte mb-2">Titre de propriété *</label>
                                <p className="text-xs text-texte-2 mb-3">
                                    Pour garantir la propriété du bien, veuillez télécharger un titre de propriété valide à votre nom.
                                </p>
                                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-ok/30 bg-ok-soft' : 'border-trait hover:border-trait-fort'}`}>
                                    <input
                                        type="file"
                                        id="title-upload"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                                        onChange={handleFileChange}
                                        required={!isAdmin}
                                    />
                                    <label htmlFor="title-upload" className="cursor-pointer flex flex-col items-center gap-3">
                                        {file ? (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-ok-soft flex items-center justify-center text-ok">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <span className="font-medium text-texte">{file.name}</span>
                                                <span className="text-xs text-texte-2">Cliquez pour changer</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-encre-soft flex items-center justify-center text-texte-2">
                                                    <Upload size={24} />
                                                </div>
                                                <span className="font-medium text-texte">Cliquez pour télécharger</span>
                                                <span className="text-xs text-texte-2">PDF, JPG ou PNG (Max 10Mo)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <p className="mt-2 text-xs text-texte-2 flex items-center gap-1">
                                    <Shield size={12} /> Votre justificatif n’est visible que par vous et par l’équipe chargée de la vérification.
                                </p>
                            </div>
                        )}

                        {/* Admin Notice */}
                        {isAdmin && (
                            <div className="p-4 bg-encre-soft border border-encre/20 rounded-sm">
                                <p className="text-sm text-encre">
                                    <strong>Compte administrateur</strong> - Le justificatif est facultatif et le bien est vérifié d’office.
                                </p>
                            </div>
                        )}

                        {submitError && (
                            <div role="alert" className="p-3 text-sm text-alerte bg-alerte-soft border border-alerte/30 rounded-sm">
                                {submitError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !selectedAddress || isFetchingBuilding || (!isAdmin && !file)}
                            className="w-full py-4 bg-encre text-white font-bold uppercase tracking-wider hover:bg-encre/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Ajouter ce bien'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
