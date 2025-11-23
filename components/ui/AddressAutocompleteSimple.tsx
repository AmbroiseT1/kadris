"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

// Type pour les résultats de l'API Adresse
interface AddressFeature {
    properties: {
        id: string;
        label: string;
        context: string; // ex: "59, Nord, Hauts-de-France"
        city: string;
        postcode: string;
    };
    geometry: {
        coordinates: [number, number]; // [lon, lat]
    };
}

interface Props {
    onSelect: (address: any) => void; // Callback quand l'utilisateur choisit
}

export const AddressAutocompleteSimple: React.FC<Props> = ({ onSelect }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AddressFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Gestion du clic en dehors pour fermer la liste
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Appel API quand l'utilisateur tape (Debounce simulé par le délai de frappe)
    useEffect(() => {
        const fetchAddresses = async () => {
            if (query.length < 3) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Appel à l'API Nationale (BAN)
                const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();
                setResults(data.features || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Erreur API Adresse:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchAddresses, 300); // Attendre 300ms d'arrêt de frappe
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (feature: AddressFeature) => {
        setQuery(feature.properties.label);
        setShowSuggestions(false);
        onSelect(feature); // On renvoie la donnée au parent (page.tsx)
    };

    const clearQuery = () => {
        setQuery("");
        setResults([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            {/* Simple Input Field */}
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="Tapez une adresse..."
                    className="w-full px-4 py-3 pr-20 bg-white border border-kadris-slate/20 rounded-sm focus:outline-none focus:border-kadris-terracotta transition-colors text-kadris-slate"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                />
                <div className="absolute right-3 flex items-center gap-2">
                    {isLoading && <Loader2 className="text-kadris-terracotta animate-spin" size={16} />}
                    {query && !isLoading && (
                        <button
                            type="button"
                            onClick={clearQuery}
                            className="text-kadris-slate/40 hover:text-kadris-slate transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des suggestions */}
            {showSuggestions && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-kadris-slate/20 rounded-sm z-50 shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                        {results.map((feature) => (
                            <li
                                key={feature.properties.id}
                                onClick={() => handleSelect(feature)}
                                className="px-4 py-3 hover:bg-kadris-cream cursor-pointer border-b border-kadris-slate/5 last:border-0 transition-colors flex items-start gap-3 group"
                            >
                                <MapPin className="text-kadris-sage mt-0.5 flex-shrink-0 group-hover:text-kadris-terracotta transition-colors" size={14} />
                                <div className="text-left">
                                    <div className="font-medium text-kadris-slate text-sm">{feature.properties.label}</div>
                                    <div className="text-xs text-kadris-slate/50 mt-0.5">{feature.properties.context}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
