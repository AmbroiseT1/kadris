"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '@/app/context/AuthContext';

const LINKS = [
    { href: '/#rapport', label: 'Le rapport' },
    { href: '/#proprietaire', label: 'Espace propriétaire' },
    { href: '/#professionnels', label: 'Professionnels' },
    { href: '/how-it-works', label: 'Méthode et sources' },
];

/** En-tête commun à toutes les pages publiques. `children` s'insère au centre (ex. recherche dans le rapport). */
export default function SiteHeader({ children }: { children?: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-trait no-print">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                <Logo />
                {children ? <div className="hidden md:flex flex-1 min-w-0 justify-center">{children}</div> : <div className="flex-1" />}
                <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-6 text-sm">
                    {!children && LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className="text-texte-2 hover:text-texte hover:underline underline-offset-4">
                            {l.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {pathname !== '/dashboard' && <Link href="/dashboard" className="btn btn-secondary btn-sm">Mon espace</Link>}
                            <ProfileDropdown />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-secondary btn-sm">Se connecter</Link>
                            <Link href="/register" className="btn btn-encre btn-sm">Créer un compte</Link>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    className="md:hidden ml-auto btn btn-secondary btn-sm"
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-controls="menu-mobile"
                >
                    <Menu size={18} aria-hidden /> Menu
                </button>
            </div>

            {open && (
                <div id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 bg-papier flex flex-col">
                    <div className="h-16 px-4 flex items-center justify-between border-b border-trait bg-surface">
                        <Logo />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
                            <X size={18} aria-hidden /> Fermer
                        </button>
                    </div>
                    <nav aria-label="Navigation mobile" className="flex flex-col p-4 gap-1 text-lg">
                        {LINKS.map((l) => (
                            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="min-h-[48px] flex items-center px-2 border-b border-trait font-display font-bold">
                                {l.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-auto p-4 grid gap-2">
                        {isAuthenticated ? (
                            <Link href="/dashboard" onClick={() => setOpen(false)} className="btn btn-primary">Mon espace propriétaire</Link>
                        ) : (
                            <>
                                <Link href="/register" onClick={() => setOpen(false)} className="btn btn-primary">Créer un compte</Link>
                                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary">Se connecter</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
