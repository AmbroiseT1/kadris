"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrickWall, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simulate network delay
        setTimeout(() => {
            if (email.toLowerCase() === "amb.torris@gmail.com") {
                router.push("/dashboard");
            } else {
                setError("Accès refusé. Cette adresse n'est pas reconnue comme propriétaire.");
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture */}
            <div
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="w-full max-w-md bg-white border-2 border-black p-8 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 border-2 border-black rounded-full mb-4">
                        <BrickWall size={32} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-mono font-bold tracking-tighter uppercase">Espace Propriétaire</h1>
                    <p className="text-sm font-mono text-gray-500 mt-2">Authentification sécurisée</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest mb-2 font-mono">
                            Email du compte
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nom@exemple.com"
                            className="w-full bg-gray-50 border-2 border-black p-3 font-mono focus:outline-none focus:bg-white transition-colors placeholder:text-gray-300"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                            <Lock size={12} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black text-white border-2 border-black p-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Vérification..." : "Accéder au Dashboard"}
                        {!isLoading && <ArrowRight size={16} />}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <Link href="/" className="text-xs font-mono text-gray-400 hover:text-black underline decoration-1 underline-offset-4">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-8 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Kadris Secure Gateway v2.0
            </div>
        </div>
    );
}
