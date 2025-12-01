"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, LogOut, Settings, FileText, Shield } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDropdown() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) return null;

    // On extrait le nom de l'email pour l'affichage (en attendant d'avoir un champ nom)
    const displayName = user.email.split('@')[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-bricq-slate/5 transition-colors group"
                aria-label="Profile menu"
            >
                <div className="w-8 h-8 rounded-full bg-bricq-terracotta/10 flex items-center justify-center text-bricq-terracotta border border-bricq-terracotta/20 group-hover:bg-bricq-terracotta group-hover:text-white transition-colors">
                    <User size={16} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white border border-bricq-slate/10 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        {/* User Info Header */}
                        <div className="px-5 py-4 border-b border-bricq-slate/5 bg-bricq-cream/30">
                            <p className="font-serif font-bold text-bricq-slate text-lg capitalize">
                                {displayName}
                            </p>
                            <p className="text-xs text-bricq-slate/60 mt-0.5 font-mono">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 space-y-1">
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-bricq-slate hover:bg-bricq-sage/10 rounded-lg transition-colors group"
                            >
                                <Settings size={16} className="text-bricq-slate/50 group-hover:text-bricq-slate" />
                                <span className="font-medium">Mon Profil</span>
                            </Link>

                            <Link
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-bricq-slate hover:bg-bricq-sage/10 rounded-lg transition-colors group"
                            >
                                <FileText size={16} className="text-bricq-slate/50 group-hover:text-bricq-slate" />
                                <span className="font-medium">Mes Documents</span>
                            </Link>

                            <Link
                                href="/privacy"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-bricq-slate hover:bg-bricq-sage/10 rounded-lg transition-colors group"
                            >
                                <Shield size={16} className="text-bricq-slate/50 group-hover:text-bricq-slate" />
                                <span className="font-medium">Données & Confidentialité</span>
                            </Link>

                            <div className="h-px bg-bricq-slate/5 my-1 mx-2"></div>

                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                            >
                                <LogOut size={16} className="text-red-400 group-hover:text-red-600" />
                                <span className="font-medium">Déconnexion</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
