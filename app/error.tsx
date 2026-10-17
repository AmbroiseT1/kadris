'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="min-h-screen bg-bricq-cream text-bricq-slate flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-6">
                <p className="font-mono text-sm uppercase tracking-widest text-bricq-terracotta">Erreur</p>
                <h1 className="font-serif text-4xl font-bold leading-tight">Une erreur est survenue</h1>
                <p className="text-bricq-slate/70 font-light leading-relaxed">
                    Un problème inattendu est survenu. Vous pouvez réessayer ; si le problème persiste, revenez plus tard.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-bricq-slate text-white rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate/90 transition-all"
                    >
                        Réessayer
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 border border-bricq-slate/20 rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-bricq-slate hover:text-white transition-colors"
                    >
                        Accueil
                    </Link>
                </div>
            </div>
        </main>
    );
}
