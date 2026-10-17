import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { OwnershipStatus } from '@/app/lib/api';

const STYLES: Record<OwnershipStatus, { label: string; className: string; Icon: React.ComponentType<{ size?: number }> }> = {
    pending: { label: 'Vérification en cours', className: 'bg-amber-50 text-amber-800 border-amber-200', Icon: Clock },
    verified: { label: 'Propriété vérifiée', className: 'bg-green-50 text-green-800 border-green-200', Icon: ShieldCheck },
    rejected: { label: 'Justificatif refusé', className: 'bg-red-50 text-red-800 border-red-200', Icon: ShieldAlert },
};

export default function OwnershipBadge({ status, comment }: { status: OwnershipStatus; comment?: string | null }) {
    const s = STYLES[status] ?? STYLES.pending;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border rounded-full ${s.className}`}
            title={comment || undefined}
        >
            <s.Icon size={12} />
            {s.label}
        </span>
    );
}
