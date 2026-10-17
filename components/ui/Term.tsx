"use client";

import React, { useEffect, useId, useRef, useState } from 'react';

/** Glossaire : deux phrases pour chaque terme technique du rapport. */
export const GLOSSAIRE: Record<string, { terme: string; definition: string }> = {
    dpe: { terme: 'DPE', definition: "Diagnostic de performance énergétique. Il classe le logement de A (très économe) à G (très énergivore) selon sa consommation et ses émissions de gaz à effet de serre." },
    ges: { terme: 'GES', definition: "Émissions de gaz à effet de serre liées au chauffage, à l'eau chaude et au refroidissement, en kg de CO₂ par m² et par an." },
    plu: { terme: 'PLU', definition: "Plan local d'urbanisme. Il fixe ce qu'on a le droit de construire ou de modifier sur chaque parcelle de la commune." },
    dvf: { terme: 'DVF', definition: "Demandes de valeurs foncières : les ventes immobilières enregistrées par les notaires et publiées par l'État. Elles ne couvrent pas l'Alsace et la Moselle." },
    alea: { terme: 'Aléa', definition: "Probabilité qu'un phénomène naturel (inondation, argiles, séisme) se produise à cet endroit. Ce n'est pas un dommage constaté." },
    argiles: { terme: 'Retrait-gonflement des argiles', definition: "Les sols argileux gonflent quand ils sont humides et se rétractent en sécheresse. Cela peut fissurer les murs et les fondations." },
    servitude: { terme: 'Servitude', definition: "Contrainte attachée à une parcelle au profit d'un service public ou d'un voisin, par exemple un passage de réseau ou un périmètre de monument historique." },
    bdnb: { terme: 'BDNB', definition: "Base de données nationale des bâtiments, produite par le CSTB. Elle rassemble pour chaque bâtiment l'année, la hauteur, les matériaux et les diagnostics connus." },
    radon: { terme: 'Radon', definition: "Gaz radioactif naturel issu du sous-sol. Le potentiel va de 1 (faible) à 3 (significatif) ; une bonne aération suffit souvent à le réduire." },
    emprise: { terme: 'Emprise au sol', definition: "Surface que le bâtiment occupe au sol, mesurée à partir de son contour. Ce n'est pas la surface habitable." },
};

/** Petit « ? » qui ouvre la définition d'un terme. Accessible au clavier, se ferme avec Échap. */
export default function Term({ id }: { id: string }) {
    const entry = GLOSSAIRE[id];
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const tipId = useId();

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);

    if (!entry) return null;
    return (
        <span ref={ref} className="relative inline-block align-middle ml-1 normal-case tracking-normal">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={tipId}
                aria-label={`Qu'est-ce que ${entry.terme} ?`}
                className="inline-grid place-items-center w-5 h-5 rounded-full border border-trait-fort text-[0.7rem] font-bold font-sans text-texte-2 hover:border-texte hover:text-texte bg-surface"
            >
                ?
            </button>
            {open && (
                <span id={tipId} role="tooltip" className="absolute left-0 top-full mt-2 z-30 w-72 max-w-[80vw] card shadow-overlay p-3 text-sm font-sans text-texte text-left">
                    <b className="block font-display mb-1">{entry.terme}</b>
                    {entry.definition}
                </span>
            )}
        </span>
    );
}
