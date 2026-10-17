"use client";

import React from 'react';
import { AddressAutocomplete, type AddressFeature } from './AddressAutocomplete';

export type { AddressFeature };

/** Variante compacte, sans bouton, pour les formulaires (ajout d'un bien). */
export const AddressAutocompleteSimple: React.FC<{ onSelect: (address: AddressFeature) => void }> = ({ onSelect }) => (
    <AddressAutocomplete onSelect={onSelect} size="sm" buttonLabel="" placeholder="Ex. 12 rue des Tanneurs, Strasbourg" />
);
