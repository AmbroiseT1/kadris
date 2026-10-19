import React from 'react';
import { AlertTriangle, Check, CircleAlert, HelpCircle } from 'lucide-react';

export type Status = 'ok' | 'vigil' | 'alerte' | 'inconnu';

const STYLES: Record<Status, string> = {
    ok: 'bg-ok-soft text-ok',
    vigil: 'bg-vigil-soft text-vigil',
    alerte: 'bg-alerte-soft text-alerte',
    inconnu: 'text-inconnu border border-dashed border-inconnu bg-[repeating-linear-gradient(135deg,var(--color-inconnu-soft)_0_6px,transparent_6px_9px)]',
};

const ICONS: Record<Status, React.ComponentType<{ size?: number; 'aria-hidden'?: boolean; strokeWidth?: number }>> = {
    ok: Check,
    vigil: AlertTriangle,
    alerte: CircleAlert,
    inconnu: HelpCircle,
};

/** Pastille de statut : couleur + icône + mot, jamais la couleur seule. */
export default function StatusChip({ status, children, className = '' }: { status: Status; children: React.ReactNode; className?: string }) {
    const Icon = ICONS[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-xs font-bold leading-none whitespace-nowrap ${STYLES[status]} ${className}`}>
            <Icon size={12} strokeWidth={2.5} aria-hidden />
            {children}
        </span>
    );
}
