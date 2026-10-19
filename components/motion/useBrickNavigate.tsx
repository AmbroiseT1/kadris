"use client";

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrickWall from './BrickWall';

/**
 * Navigation avec « le mur se monte » : le mur se construit, puis la page suivante s'ouvre
 * et son mur tombe. Sans animation (mouvement réduit), navigation immédiate.
 */
export function useBrickNavigate() {
    const router = useRouter();
    const [target, setTarget] = useState<string | null>(null);

    const navigate = useCallback((href: string) => {
        const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { router.push(href); return; }
        try { sessionStorage.setItem('bricq:mur:suite', '1'); } catch { /* navigation sans transition */ }
        router.prefetch(href);
        setTarget(href);
    }, [router]);

    const onBuilt = useCallback(() => {
        if (target) router.push(target);
    }, [router, target]);

    const overlay: React.ReactNode = target ? <BrickWall mode="build" onDone={onBuilt} /> : null;
    return { navigate, overlay };
}
