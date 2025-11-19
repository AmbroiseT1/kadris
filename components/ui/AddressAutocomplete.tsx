"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

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
    <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto">
      {/* Barre de recherche */}
      <div className="relative flex flex-col md:flex-row shadow-xl shadow-kadris-slate/5 rounded-lg md:rounded-full bg-white p-2 border border-kadris-slate/10 group focus-within:border-kadris-slate/30 transition-all z-20">
        <div className="flex-1 flex items-center px-4 py-3 md:py-2">
          {isLoading ? (
            <Loader2 className="text-kadris-terracotta mr-3 animate-spin" size={24} />
          ) : (
            <Search className="text-kadris-slate/40 mr-3" size={24} />
          )}
          <input 
            type="text" 
            placeholder="Entrez une adresse, une parcelle..." 
            className="w-full bg-transparent outline-none text-lg text-kadris-slate placeholder:text-kadris-slate/30"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          />
        </div>
        <button 
          className="bg-kadris-terracotta hover:bg-[#A04530] text-white font-medium text-lg px-8 py-3 rounded-lg md:rounded-full transition-all duration-300 shadow-md hover:shadow-lg mt-2 md:mt-0"
          onClick={() => console.log("Recherche manuelle déclenchée")}
        >
          Découvrir
        </button>
      </div>

      {/* Liste des suggestions */}
      {showSuggestions && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-kadris-slate/10 overflow-hidden z-30 animate-in fade-in zoom-in-95 duration-100">
          <ul>
            {results.map((feature) => (
              <li 
                key={feature.properties.id}
                onClick={() => handleSelect(feature)}
                className="px-6 py-4 hover:bg-kadris-cream/50 cursor-pointer border-b border-kadris-slate/5 last:border-0 transition-colors flex items-start gap-3"
              >
                <MapPin className="text-kadris-sage mt-1 flex-shrink-0" size={18} />
                <div className="text-left">
                  <div className="font-medium text-kadris-slate">{feature.properties.label}</div>
                  <div className="text-xs text-kadris-slate/50">{feature.properties.context}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-kadris-cream/30 px-4 py-2 text-[10px] text-kadris-slate/40 text-center uppercase tracking-widest font-bold">
            Source : Base Adresse Nationale
          </div>
        </div>
      )}
    </div>
  );
};