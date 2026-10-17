import Link from "next/link";

/** Marque Bricq : maison, K et flèche, redessinés en SVG (couleur pilotée par `currentColor`). */
export function LogoMark({ className = "w-7 h-7" }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.6} className={className} aria-hidden focusable="false">
            <path d="M5 28V13.5L16 5l11 8.5V28" />
            <path d="M11.5 28V12M11.5 21l8-8M14.6 18l6.4 10" />
            <path strokeWidth={2} d="M24 23v-6.5M21.5 18.5 24 15.5l2.5 3" />
        </svg>
    );
}

export default function Logo({ href = "/", size = "md", label }: { href?: string; size?: "sm" | "md" | "lg"; label?: string }) {
    const mark = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-9 h-9" : "w-7 h-7";
    const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
    return (
        <Link href={href} className="inline-flex items-center gap-2 text-texte no-underline group" aria-label={label ?? "Bricq, accueil"}>
            <LogoMark className={`${mark} text-encre`} />
            <span className={`font-display font-extrabold tracking-tight ${text} group-hover:text-encre transition-colors`}>bricq</span>
        </Link>
    );
}
