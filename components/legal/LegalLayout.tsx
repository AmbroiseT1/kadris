import { LogoMark } from "@/components/ui/Logo";
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
        <main className="min-h-screen bg-papier text-texte">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-papier/95 backdrop-blur-sm border-b border-trait">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3">
                        <LogoMark className="w-10 h-10 text-encre" />
                        <span className="text-2xl font-bold font-serif tracking-tighter text-texte">bricq</span>
                    </Link>
                    <Link href="/" className="text-sm text-texte-2 hover:text-texte transition-colors">
                        ← Retour à l’accueil
                    </Link>
                </div>
            </nav>

            <article className="container mx-auto px-6 pt-32 pb-24 max-w-3xl">
                <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">{title}</h1>
                {intro && <p className="text-lg text-texte-2 font-light leading-relaxed mb-12">{intro}</p>}
                <div className="space-y-6">{children}</div>
            </article>

            <footer className="bg-white border-t border-trait py-8">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-texte-2">
                    <span>&copy; bricq. Tous droits réservés.</span>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/mentions-legales" className="hover:text-brique hover:underline">Mentions légales</Link>
                        <Link href="/cgu" className="hover:text-brique hover:underline">CGU</Link>
                        <Link href="/confidentialite" className="hover:text-brique hover:underline">Politique de confidentialité</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-texte pt-4 border-b border-trait pb-2">{title}</h2>
            <div className="space-y-4 text-texte leading-relaxed font-light">{children}</div>
        </section>
    );
}
