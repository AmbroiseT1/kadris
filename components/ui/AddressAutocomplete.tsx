"use client";

import React, { useState, useEffect, useRef, useId } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

// Résultat de l'API Adresse (Base Adresse Nationale)
export interface AddressFeature {
  properties: {
    id: string;
    label: string;
    context: string; // ex : "59, Nord, Hauts-de-France"
    city: string;
    postcode: string;
    citycode?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface Props {
  onSelect: (address: AddressFeature) => void;
  /** « lg » pour la recherche principale de l'accueil, « sm » dans un en-tête ou un formulaire. */
  size?: 'lg' | 'sm';
  /** Libellé du bouton ; aucun bouton si vide. */
  buttonLabel?: string;
  placeholder?: string;
  label?: string;
}

/** Recherche d'adresse accessible (combobox ARIA) : ↑ ↓ pour parcourir, Entrée pour choisir, Échap pour fermer. */
export const AddressAutocomplete: React.FC<Props> = ({
  onSelect,
  size = 'lg',
  buttonLabel = 'Voir le rapport',
  placeholder = 'Saisissez une adresse',
  label = 'Adresse du logement',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        setResults(data.features || []);
        setActive(-1);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError("La recherche d'adresse ne répond pas. Réessayez dans un instant.");
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => { clearTimeout(timeoutId); controller.abort(); };
  }, [query]);

  const choose = (feature: AddressFeature) => {
    setQuery(feature.properties.label);
    setOpen(false);
    onSelect(feature);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      const pick = results[active >= 0 ? active : 0];
      if (pick) { e.preventDefault(); choose(pick); }
    } else if (e.key === 'Escape') setOpen(false);
  };

  const lg = size === 'lg';
  const showList = open && results.length > 0 && query.trim().length >= 3;

  return (
    <div ref={wrapperRef} className={`relative w-full ${lg ? 'max-w-2xl' : 'max-w-md'}`}>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <div className={`flex items-center gap-2 bg-surface rounded-sm ${lg ? 'border-2 border-encre p-1 pl-4' : 'border border-trait-fort p-0.5 pl-3'} focus-within:shadow-[0_0_0_3px_var(--color-brique-soft)]`}>
        {isLoading ? <Loader2 className="text-brique animate-spin shrink-0" size={lg ? 20 : 16} aria-hidden /> : <Search className="text-texte-2 shrink-0" size={lg ? 20 : 16} aria-hidden />}
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent outline-none text-texte placeholder:text-texte-2 ${lg ? 'text-lg min-h-[44px]' : 'text-base min-h-[38px]'}`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 3) { setResults([]); setOpen(false); }
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {buttonLabel && (
          <button
            type="button"
            className={`btn btn-primary shrink-0 ${lg ? '' : 'btn-sm'}`}
            onClick={() => results[0] ? choose(results[active >= 0 ? active : 0]) : setOpen(true)}
            disabled={query.trim().length < 3}
          >
            {buttonLabel}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-alerte" role="alert">{error}</p>}

      {showList && (
        <div className="absolute top-full left-0 right-0 mt-1 card shadow-overlay z-30 overflow-hidden text-left">
          <ul id={listId} role="listbox" aria-label="Adresses proposées">
            {results.map((feature, i) => (
              <li
                key={feature.properties.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); choose(feature); }}
                onMouseEnter={() => setActive(i)}
                className={`px-4 min-h-[48px] py-2.5 cursor-pointer border-b border-trait last:border-0 flex items-start gap-3 ${i === active ? 'bg-encre-soft' : ''}`}
              >
                <MapPin className="text-encre mt-0.5 shrink-0" size={16} aria-hidden />
                <div>
                  <div className="font-bold text-texte text-sm">{feature.properties.label}</div>
                  <div className="text-xs text-texte-2 font-mono mt-0.5">{feature.properties.context}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 text-xs text-texte-2 font-mono border-t border-trait bg-papier">Source : Base Adresse Nationale</div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
