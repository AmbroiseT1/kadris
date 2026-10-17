"use client";
import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

/** Passage du rapport vers l'espace propriétaire. */
export const TabOwner = () => (
    <div className="card p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center motif-briques">
        <div className="grid gap-2 bg-surface/90 rounded-md">
            <span className="label inline-flex items-center gap-2"><Lock size={14} aria-hidden /> Réservé au propriétaire</span>
            <h3 className="text-xl font-bold">C&apos;est votre logement ? Ce rapport devient la première page de son carnet.</h3>
            <p className="text-texte-2 max-w-[60ch]">
                Ajoutez vos travaux, factures et diagnostics : la maquette 3D se colore selon l&apos;état de chaque partie, et vous recevez les échéances d&apos;entretien. Une pièce justificative est demandée pour vérifier que vous êtes propriétaire.
            </p>
        </div>
        <Link href="/properties/add" className="btn btn-primary">Ajouter mon logement</Link>
    </div>
);
