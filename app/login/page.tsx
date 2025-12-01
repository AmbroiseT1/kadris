"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/app/lib/api';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        setIsLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const response = await api.post('/auth/login', formData);
            login(response.data.access_token);
        } catch (err: any) {
            console.error("Login error:", err);
            if (err.response?.status === 400 || err.response?.status === 401 || err.response?.status === 422) {
                setError("Email ou mot de passe incorrect.");
            } else {
                setError("Une erreur est survenue. Veuillez réessayer.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-bricq-cream">
            {/* Colonne de Gauche (Visuel) */}
            <div className="hidden md:flex w-1/2 bg-bricq-slate text-white items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-lg">
                    <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity cursor-pointer">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-screen" />
                        <span className="text-3xl font-bold font-serif tracking-tighter">bricq</span>
                    </Link>
                    <h1 className="font-serif text-4xl font-bold mb-6 leading-tight">
                        Retrouvez l'histoire de votre logement.
                    </h1>
                    <p className="text-white/70 text-lg font-light leading-relaxed">
                        Connectez-vous pour accéder à votre carnet numérique, vos documents sécurisés et l'analyse de risques de votre propriété.
                    </p>
                </div>
            </div>

            {/* Colonne de Droite (Formulaire) */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 mb-8">
                            <img src="/bricq-logo.png" alt="bricq Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
                            <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                        </Link>
                        <h2 className="text-3xl font-bold text-bricq-slate font-serif">Bon retour parmi nous</h2>
                        <p className="mt-2 text-bricq-slate/60">
                            Saisissez vos identifiants pour accéder à votre espace.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-bricq-slate mb-1">
                                    Adresse Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className="appearance-none block w-full px-4 py-3 border border-bricq-slate/20 rounded-lg placeholder-bricq-slate/30 text-bricq-slate focus:outline-none focus:ring-2 focus:ring-bricq-terracotta/20 focus:border-bricq-terracotta transition-colors bg-white"
                                    placeholder="vous@exemple.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-bricq-slate">
                                        Mot de passe
                                    </label>
                                    <a href="#" className="text-xs font-medium text-bricq-terracotta hover:text-bricq-terracotta/80">
                                        Mot de passe oublié ?
                                    </a>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className="appearance-none block w-full px-4 py-3 border border-bricq-slate/20 rounded-lg placeholder-bricq-slate/30 text-bricq-slate focus:outline-none focus:ring-2 focus:ring-bricq-terracotta/20 focus:border-bricq-terracotta transition-colors bg-white"
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-bricq-slate hover:bg-bricq-slate/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bricq-slate disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-bricq-slate/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Se connecter <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-bricq-slate/60">
                            Pas encore de compte ?{' '}
                            <Link href="/register" className="font-bold text-bricq-terracotta hover:text-bricq-terracotta/80 transition-colors">
                                Créer un compte gratuitement
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
