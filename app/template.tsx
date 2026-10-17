"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrickWall from '@/components/motion/BrickWall';

/** Sections du site qui ont droit à la transition « le mur tombe », une fois par visite. */
function sectionOf(pathname: string): string | null {
    if (pathname === '/') return 'accueil';
    if (pathname.startsWith('/report/')) return 'rapport';
    if (pathname.startsWith('/dashboard')) return 'espace';
    return null;
}

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [wall, setWall] = useState(false);

    useEffect(() => {
        const section = sectionOf(pathname);
        if (!section) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        try {
            const key = `bricq:mur:${section}`;
            // « Le mur se monte » sur la page de départ demande au mur de tomber à l'arrivée
            const forced = sessionStorage.getItem('bricq:mur:suite') === '1';
            sessionStorage.removeItem('bricq:mur:suite');
            if (!forced && sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWall(true);
    }, [pathname]);

    const done = useCallback(() => setWall(false), []);

    return (
        <>
            {children}
            {wall && <BrickWall onDone={done} />}
        </>
    );
}
