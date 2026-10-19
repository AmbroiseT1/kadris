"use client";

import React, { useEffect, useMemo, useState } from 'react';

const BW = 64;
const BH = 28;

/**
 * Transitions de page en briques.
 * - « fall » : un mur couvre l'écran puis s'écroule (arrivée sur une page).
 * - « build » : un mur se monte rang par rang (départ vers une page), puis `onDone`.
 * Non bloquant (pointer-events: none), 900 ms environ, ignoré si l'animation est réduite.
 */
export default function BrickWall({ onDone, mode = 'fall' }: { onDone?: () => void; mode?: 'fall' | 'build' }) {
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSize({ w: window.innerWidth, h: window.innerHeight });
        const t = setTimeout(() => onDone?.(), mode === 'build' ? 760 : 1300);
        return () => clearTimeout(t);
    }, [onDone, mode]);

    const bricks = useMemo(() => {
        if (!size) return [];
        const rows = Math.ceil(size.h / BH);
        const out: { x: number; y: number; d: number; dx: number; rot: number; shade: number }[] = [];
        // Valeurs pseudo-aléatoires stables (pas de Math.random au rendu)
        let seed = 7;
        const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let r = 0; r < rows; r++) {
            const off = r % 2 ? -BW / 2 : 0;
            for (let x = off; x < size.w; x += BW) {
                out.push({ x, y: size.h - (r + 1) * BH, d: mode === 'build' ? (r / rows) * 420 + (x / size.w) * 60 : (rows - r) * 18 + rnd() * 220, dx: rnd() * 60 - 30, rot: rnd() * 60 - 30, shade: 0.86 + rnd() * 0.24 });
            }
        }
        return out;
    }, [size, mode]);

    if (!size) return null;
    return (
        <div aria-hidden className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
            {bricks.map((b, i) => (
                <span
                    key={i}
                    className="absolute bg-brique rounded-[2px]"
                    style={{
                        left: b.x + 1, top: b.y + 1, width: BW - 2, height: BH - 2,
                        filter: `brightness(${b.shade.toFixed(2)})`,
                        animation: mode === 'build'
                            ? `brique-monte 260ms var(--ease-rebond) ${Math.round(b.d)}ms both`
                            : `brique-tombe 820ms cubic-bezier(.5,0,.9,.5) ${Math.round(b.d)}ms both`,
                        ['--dx' as string]: `${b.dx.toFixed(0)}px`,
                        ['--rot' as string]: `${b.rot.toFixed(0)}deg`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}
