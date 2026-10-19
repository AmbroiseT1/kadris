"use client";

import React, { useEffect, useRef, useState } from 'react';

/**
 * « Pose de brique » : le bloc se pose quand il entre dans l'écran.
 * Rendu visible côté serveur ; seuls les blocs encore sous la ligne de flottaison sont animés.
 */
export default function Reveal({ children, className = '', as = 'div', delay = 0 }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' | 'li' | 'article'; delay?: number }) {
    const ref = useRef<HTMLElement>(null);
    const [state, setState] = useState<'idle' | 'pending' | 'play'>('idle');

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) return; // déjà visible : on n'anime pas
        setState('pending');
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                setState('play');
                io.disconnect();
            }
        }, { rootMargin: '0px 0px -10% 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const props = {
        ref: ref as React.Ref<HTMLDivElement>,
        className: `${className} ${state === 'pending' ? 'reveal-pending' : state === 'play' ? 'reveal-play' : ''}`,
        style: delay && state === 'play' ? { animationDelay: `${delay}ms` } : undefined,
    };
    return React.createElement(as, props, children);
}
