"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings } from 'lucide-react';
import { getCurrentUserProfile } from '@/utils/userStorage';
import { clearCurrentUser } from '@/utils/propertyStorage';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const profile = getCurrentUserProfile();
        setUserProfile(profile);
    }, []);

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

    const handleLogout = () => {
        clearCurrentUser();
        router.push('/');
    };

    if (!userProfile) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Profile menu"
            >
                <User size={20} className="text-black" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white border border-black/10 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-black/10 bg-bricq-sage/5">
                            <p className="font-serif font-bold text-bricq-slate">
                                {userProfile.firstName} {userProfile.lastName}
                            </p>
                            <p className="text-xs text-bricq-slate/60 mt-0.5">{userProfile.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-bricq-slate hover:bg-bricq-sage/10 transition-colors"
                            >
                                <Settings size={16} />
                                <span>Mon Profil</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={16} />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
