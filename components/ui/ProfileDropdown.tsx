"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, LogOut, Settings, Home, Shield } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDropdown() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [isOpen]);

    if (!user) return null;

    const displayName = user.email.split('@')[0];
    const item = "flex items-center gap-3 px-3 min-h-[44px] text-sm text-texte hover:bg-encre-soft rounded-md transition-colors";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-trait-fort bg-surface hover:border-texte transition-colors"
                aria-label="Menu du compte"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <User size={18} aria-hidden />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-72 bg-surface border border-trait rounded-lg shadow-overlay z-50 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-trait">
                            <p className="font-display font-bold text-texte capitalize">{displayName}</p>
                            <p className="text-xs text-texte-2 mt-0.5 font-mono break-all">{user.email}</p>
                        </div>
                        <div className="p-2 grid gap-0.5">
                            <Link role="menuitem" href="/dashboard" onClick={() => setIsOpen(false)} className={item}>
                                <Home size={16} aria-hidden /> Mon espace propriétaire
                            </Link>
                            <Link role="menuitem" href="/profile" onClick={() => setIsOpen(false)} className={item}>
                                <Settings size={16} aria-hidden /> Mon profil
                            </Link>
                            <Link role="menuitem" href="/confidentialite" onClick={() => setIsOpen(false)} className={item}>
                                <Shield size={16} aria-hidden /> Données et confidentialité
                            </Link>
                            <div className="h-px bg-trait my-1 mx-2" />
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { logout(); setIsOpen(false); }}
                                className={`${item} w-full text-alerte hover:bg-alerte-soft`}
                            >
                                <LogOut size={16} aria-hidden /> Se déconnecter
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
