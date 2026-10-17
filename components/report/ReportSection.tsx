import React from 'react';
import Term from '@/components/ui/Term';
import Reveal from '@/components/motion/Reveal';

/** Section du rapport : ancre partageable, titre, glossaire et source en en-tête. */
export default function ReportSection({ id, title, term, meta, children }: { id: string; title: string; term?: string; meta?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-32 grid gap-4 break-inside-avoid-page">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-texte pb-2">
                <h2 id={`${id}-titre`} className="text-2xl font-bold">
                    <a href={`#${id}`} className="hover:underline decoration-2 underline-offset-4">{title}</a>
                    {term && <Term id={term} />}
                </h2>
                {meta && <div className="font-mono text-xs text-texte-2">{meta}</div>}
            </div>
            <Reveal>{children}</Reveal>
        </section>
    );
}
