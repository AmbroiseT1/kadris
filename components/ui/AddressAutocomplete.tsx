"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, ArrowRight } from 'lucide-react';

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

export const AddressAutocomplete: React.FC<Props> = ({ onSelect }) => {
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

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto font-sans">
      {/* Barre de recherche - Style Sharp & Mineral */}
      <div className="relative flex flex-col md:flex-row bg-white border-2 border-kadris-slate/10 focus-within:border-kadris-slate/30 transition-colors z-20">
        <div className="flex-1 flex items-center px-4 py-4">
          {isLoading ? (
            <Loader2 className="text-kadris-terracotta mr-4 animate-spin" size={20} />
          ) : (
            <Search className="text-kadris-slate/40 mr-4" size={20} />
          )}
          <input
            type="text"
            placeholder="Entrez une adresse, une parcelle..."
            className="w-full bg-transparent outline-none text-lg text-kadris-slate placeholder:text-kadris-slate/30 font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          />
        </div>
        <button
          className="bg-kadris-terracotta hover:bg-[#A04530] text-white font-serif font-bold text-sm uppercase tracking-wider px-8 py-4 transition-all duration-300 flex items-center justify-center gap-2 md:border-l-2 md:border-white/10"
          onClick={() => console.log("Recherche manuelle déclenchée")}
        >
          Découvrir <ArrowRight size={16} />
        </button>
      </div>

      {/* Liste des suggestions - Style Dossier */}
      {showSuggestions && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-kadris-slate/10 z-30 animate-in fade-in zoom-in-95 duration-100 shadow-none">
          <ul>
            {results.map((feature) => (
              <li
                key={feature.properties.id}
                onClick={() => handleSelect(feature)}
                className="px-6 py-4 hover:bg-kadris-cream cursor-pointer border-b border-kadris-slate/5 last:border-0 transition-colors flex items-start gap-3 group"
              >
                <MapPin className="text-kadris-sage mt-1 flex-shrink-0 group-hover:text-kadris-terracotta transition-colors" size={16} />
                <div className="text-left">
                  <div className="font-bold text-kadris-slate text-sm">{feature.properties.label}</div>
                  <div className="text-xs text-kadris-slate/50 font-mono mt-0.5">{feature.properties.context}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-kadris-cream/50 px-4 py-2 text-[10px] text-kadris-slate/30 text-center uppercase tracking-widest font-bold border-t border-kadris-slate/5">
            Source : Base Adresse Nationale
          </div>
        </div>
      )}
    </div>
  );
};