import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-papier text-texte flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-6">
                <p className="font-mono text-sm uppercase tracking-widest text-brique">Erreur 404</p>
                <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">Page introuvable</h1>
                <p className="text-texte-2 font-light leading-relaxed">
                    La page que vous cherchez n’existe pas, a été déplacée ou l’adresse est incorrecte.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 px-6 py-3 bg-encre text-white rounded-sm font-serif font-bold uppercase tracking-wider hover:bg-encre/90 transition-all"
                >
                    Retour à l’accueil
                    <ArrowRight size={18} />
                </Link>
            </div>
        </main>
    );
}
