"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/app/lib/api';

interface User {
    id: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    /** Indicatif pour l'interface : les droits admin sont toujours vérifiés par l'API. */
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes publiques qui ne nécessitent pas d'être connecté
const PUBLIC_ROUTES = ['/login', '/register', '/', '/how-it-works'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser'); // ancienne clé, plus utilisée
        setUser(null);
        router.push('/login');
    }, [router]);

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch {
            // Token invalide ou expiré : on repart déconnecté (rien n'est journalisé)
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        // Chargement initial : le state n'est modifié que dans le callback asynchrone
        const init = async () => {
            if (localStorage.getItem('token')) {
                await fetchUser();
            } else {
                setIsLoading(false);
            }
        };
        void init();
    }, [fetchUser]);

    // Protection des routes (Client-Side)
    useEffect(() => {
        if (!isLoading) {
            const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/report/');
            if (!user && !isPublicRoute) {
                router.push('/login');
            } else if (user && pathname === '/login') {
                // Si connecté et tente d'aller sur login, on redirige vers dashboard
                router.push('/dashboard');
            }
        }
    }, [user, isLoading, pathname, router]);

    const login = (token: string) => {
        if (!token) return;
        localStorage.setItem('token', token);
        // On recharge l'utilisateur immédiatement
        setIsLoading(true);
        fetchUser();
        router.push('/dashboard');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: !!user?.is_admin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
