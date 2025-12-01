"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/context/AuthContext';
import { api } from '@/app/lib/api';
import Link from 'next/link';
import { ArrowRight, Loader2, Check } from 'lucide-react';

const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Inscription
            await api.post('/auth/register', {
                email: data.email,
                password: data.password,
            });

            // 2. Connexion automatique après inscription
            const formData = new FormData();
            formData.append('username', data.email);
            formData.append('password', data.password);

            const loginResponse = await api.post('/auth/login', formData);
            login(loginResponse.data.access_token);

        } catch (err: any) {
            console.error("Register error:", err);
            if (err.response?.status === 400) {
                setError(err.response.data.detail || "Une erreur est survenue.");
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
            <div className="hidden md:flex w-1/2 bg-bricq-terracotta text-white items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-8">
                        <img src="/bricq-logo.png" alt="bricq Logo" className="w-10 h-10 object-contain mix-blend-screen brightness-0 invert" />
                        <span className="text-3xl font-bold font-serif tracking-tighter">bricq</span>
                    </div>
                    <h1 className="font-serif text-4xl font-bold mb-6 leading-tight">
                        Rejoignez la communauté des propriétaires éclairés.
                    </h1>
                    <ul className="space-y-4 text-white/90 text-lg font-light">
                        <li className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full"><Check size={16} /></div>
                            Centralisation de vos documents
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full"><Check size={16} /></div>
                            Suivi de la valeur de votre bien
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="bg-white/20 p-1 rounded-full"><Check size={16} /></div>
                            Carnet d'entretien intelligent
                        </li>
                    </ul>
                </div>
            </div>

            {/* Colonne de Droite (Formulaire) */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <Link href="/" className="md:hidden inline-flex items-center gap-2 mb-8">
                            <img src="/bricq-logo.png" alt="bricq Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
                            <span className="text-2xl font-bold font-serif tracking-tighter text-bricq-slate">bricq</span>
                        </Link>
                        <h2 className="text-3xl font-bold text-bricq-slate font-serif">Créer un compte</h2>
                        <p className="mt-2 text-bricq-slate/60">
                            Commencez à gérer votre patrimoine immobilier simplement.
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
                                <label htmlFor="password" class="block text-sm font-medium text-bricq-slate mb-1">
                                    Mot de passe
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className="appearance-none block w-full px-4 py-3 border border-bricq-slate/20 rounded-lg placeholder-bricq-slate/30 text-bricq-slate focus:outline-none focus:ring-2 focus:ring-bricq-terracotta/20 focus:border-bricq-terracotta transition-colors bg-white"
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" class="block text-sm font-medium text-bricq-slate mb-1">
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    className="appearance-none block w-full px-4 py-3 border border-bricq-slate/20 rounded-lg placeholder-bricq-slate/30 text-bricq-slate focus:outline-none focus:ring-2 focus:ring-bricq-terracotta/20 focus:border-bricq-terracotta transition-colors bg-white"
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
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
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-bricq-terracotta hover:bg-bricq-terracotta/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bricq-terracotta disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-bricq-terracotta/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    S'inscrire gratuitement <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-bricq-slate/60">
                            Déjà un compte ?{' '}
                            <Link href="/login" className="font-bold text-bricq-slate hover:text-bricq-slate/80 transition-colors">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
