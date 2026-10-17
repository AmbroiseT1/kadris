"use client";

import React, { useEffect, useRef, useState } from 'react';

/** Le chiffre monte jusqu'à sa valeur (900 ms). Affiche directement la valeur si l'animation est réduite. */
export default function CountUp({ value, decimals = 0, duration = 900, format }: { value: number; decimals?: number; duration?: number; format?: (n: number) => string }) {
    const [shown, setShown] = useState(value);
    const started = useRef(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || started.current) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        started.current = true;
        let raf = 0;
        const t0 = performance.now();
        const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            const e = 1 - Math.pow(1 - p, 3);
            setShown(value * e);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    const n = Number(shown.toFixed(decimals));
    return <span ref={ref} className="tabular">{format ? format(n) : n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}
