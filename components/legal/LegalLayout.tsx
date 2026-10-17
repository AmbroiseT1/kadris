import Link from 'next/link';
import React from 'react';

/**
 * Mise en page commune aux pages juridiques (mentions légales, CGU, confidentialité).
 * Composant serveur : pas de hooks, pour rester compatible avec `export const metadata`.
 */
export function LegalLayout({
    title,
    intro,
    children,
}: {
    title: string;
    intro?: string;
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-bricq-cream text-bricq-slate">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-bricq-cream/95 backdrop-blur-sm border-b border-bricq-slate/10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
                        <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                    </Link>
                    <Link href="/" className="text-sm text-bricq-slate/60 hover:text-bricq-slate transition-colors">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </nav>

            <article className="container mx-auto px-6 pt-32 pb-24 max-w-3xl">
                <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">{title}</h1>
                {intro && <p className="text-lg text-bricq-slate/70 font-light leading-relaxed mb-12">{intro}</p>}
                <div className="space-y-6">{children}</div>
            </article>

            <footer className="bg-white border-t border-bricq-slate/10 py-8">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-bricq-slate/60">
                    <span>&copy; bricq. Tous droits réservés.</span>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/mentions-legales" className="hover:text-bricq-terracotta hover:underline">Mentions légales</Link>
                        <Link href="/cgu" className="hover:text-bricq-terracotta hover:underline">CGU</Link>
                        <Link href="/confidentialite" className="hover:text-bricq-terracotta hover:underline">Politique de confidentialité</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-bricq-slate pt-4 border-b border-bricq-slate/10 pb-2">{title}</h2>
            <div className="space-y-4 text-bricq-slate/80 leading-relaxed font-light">{children}</div>
        </section>
    );
}
