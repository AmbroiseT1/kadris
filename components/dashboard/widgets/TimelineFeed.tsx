import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Work } from '@/app/lib/api';
import { formatDate, formatEuro } from '../format';
import { WidgetStatus, type ResourceState } from './WidgetState';

interface TimelineFeedProps extends ResourceState {
    works: Work[];
    onAddClick: () => void;
    onDelete: (work: Work) => void;
}

const STATUS_LABEL: Record<string, string> = {
    planned: 'PRÉVU',
    in_progress: 'EN COURS',
    done: 'TERMINÉ',
};

export default function TimelineFeed({ works, onAddClick, onDelete, ...state }: TimelineFeedProps) {
    const status = <WidgetStatus {...state} isEmpty={works.length === 0} emptyText="Aucun travaux enregistré pour l'instant." />;

    return (
        <div className="relative">
            {/* Header Action */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-texte text-white rounded-full hover:bg-texte transition-colors text-sm font-mono font-bold uppercase"
                >
                    <Plus size={16} />
                    <span>Ajouter</span>
                </button>
            </div>

            {state.loading || state.error || works.length === 0 ? status : (
                <div className="relative border-l-2 border-black/20 ml-4 space-y-12">
                    {works.map((work) => (
                        <div key={work.id} className="relative pl-8 group">
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 border-2 border-texte rounded-full ${work.status === 'done' ? 'bg-texte' : 'bg-white'}`} />
                            <div className="flex items-start justify-between gap-4">
                                <div className="font-mono text-sm text-texte-2 mb-1">
                                    {work.date ? formatDate(work.date) : 'Sans date'} - {STATUS_LABEL[work.status] ?? work.status}
                                    {work.category && <span className="ml-2 text-xs bg-papier px-1.5 py-0.5 rounded">{work.category}</span>}
                                </div>
                                <button
                                    onClick={() => onDelete(work)}
                                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-texte-2 hover:text-alerte transition"
                                    title="Supprimer"
                                    aria-label={`Supprimer ${work.title}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold font-serif mb-2">{work.title}</h3>
                            {work.description && (
                                <p className="font-handwriting text-texte italic mb-2 whitespace-pre-line">{work.description}</p>
                            )}
                            {(work.provider || work.cost !== null && work.cost !== undefined) && (
                                <p className="font-mono text-xs text-texte-2">
                                    {[work.provider, formatEuro(work.cost)].filter(Boolean).join(' · ')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
