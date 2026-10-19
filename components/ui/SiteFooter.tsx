import Link from 'next/link';
import Logo from './Logo';

export default function SiteFooter() {
    return (
        <footer className="bg-surface border-t border-trait no-print">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
                <div className="grid gap-3 content-start">
                    <Logo />
                    <p className="text-sm text-texte-2 max-w-xs">
                        Le passeport du logement : les données publiques rassemblées, puis le carnet de santé tenu par le propriétaire.
                    </p>
                </div>
                <div className="grid gap-2 content-start text-sm">
                    <p className="label">Bricq</p>
                    <Link href="/#rapport" className="text-texte-2 hover:text-texte hover:underline">Le rapport</Link>
                    <Link href="/#proprietaire" className="text-texte-2 hover:text-texte hover:underline">Espace propriétaire</Link>
                    <Link href="/#professionnels" className="text-texte-2 hover:text-texte hover:underline">Professionnels</Link>
                    <Link href="/how-it-works" className="text-texte-2 hover:text-texte hover:underline">Méthode et sources</Link>
                </div>
                <div className="grid gap-2 content-start text-sm">
                    <p className="label">Légal</p>
                    <Link href="/mentions-legales" className="text-texte-2 hover:text-texte hover:underline">Mentions légales</Link>
                    <Link href="/confidentialite" className="text-texte-2 hover:text-texte hover:underline">Confidentialité</Link>
                    <Link href="/cgu" className="text-texte-2 hover:text-texte hover:underline">Conditions d&apos;utilisation</Link>
                </div>
                <div className="grid gap-2 content-start text-sm">
                    <p className="label">Contact</p>
                    <span className="text-texte-2 select-all">contact@bricq.fr</span>
                </div>
            </div>
            <div className="border-t border-trait">
                <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap gap-2 justify-between text-xs text-texte-2 font-mono">
                    <span>© {new Date().getFullYear()} Bricq</span>
                    <span>Données : BDNB, ADEME, DGFiP (DVF), Géorisques, IGN, Arcep, Hub&apos;Eau, OpenStreetMap</span>
                </div>
            </div>
        </footer>
    );
}
