import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import type { OwnershipStatus } from '@/app/lib/api';

const STYLES: Record<OwnershipStatus, { label: string; className: string; Icon: React.ComponentType<{ size?: number }> }> = {
    pending: { label: 'Vérification en cours', className: 'bg-vigil-soft text-vigil border-vigil/30', Icon: Clock },
    verified: { label: 'Propriété vérifiée', className: 'bg-ok-soft text-ok border-ok/30', Icon: ShieldCheck },
    rejected: { label: 'Justificatif refusé', className: 'bg-alerte-soft text-alerte border-alerte/30', Icon: ShieldAlert },
};

export default function OwnershipBadge({ status, comment }: { status: OwnershipStatus; comment?: string | null }) {
    const s = STYLES[status] ?? STYLES.pending;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold uppercase tracking-wide border rounded-full ${s.className}`}
            title={comment || undefined}
        >
            <s.Icon size={12} />
            {s.label}
        </span>
    );
}
