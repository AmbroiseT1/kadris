import React from 'react';
import Link from 'next/link';

/** Consentement explicite avant tout envoi d'un document à Gemini pour analyse. */
export default function AiConsent({ checked, onChange, disabled }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
                type="checkbox"
                className="mt-0.5 accent-black"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span>
                J&apos;accepte que ce document soit envoyé à Google (Gemini) pour analyse.{' '}
                <Link href="/confidentialite" target="_blank" className="underline hover:text-black">
                    En savoir plus
                </Link>
            </span>
        </label>
    );
}
