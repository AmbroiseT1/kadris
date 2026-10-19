import React from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import type { Expense } from '@/app/lib/api';
import { formatEuro } from '../format';
import { WidgetStatus, type ResourceState } from './WidgetState';

interface FinanceBentoProps extends ResourceState {
    expenses: Expense[];
    onAddClick: () => void;
    onDelete: (expense: Expense) => void;
}

const FREQUENCY_LABEL: Record<string, string> = { mensuel: 'Mensuel', annuel: 'Annuel', ponctuel: 'Ponctuel' };

/** Coût annuel des charges récurrentes (mensuel × 12 + annuel). */
const annualTotal = (expenses: Expense[]) =>
    expenses.reduce((sum, e) => sum + (e.frequency === 'mensuel' ? e.amount * 12 : e.frequency === 'annuel' ? e.amount : 0), 0);

export default function FinanceBento({ expenses, onAddClick, onDelete, ...state }: FinanceBentoProps) {
    const total = annualTotal(expenses);
    return (
        <section>
            <div className="flex justify-between items-center border-b border-texte pb-2 mb-4">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                    <Wallet size={20} /> CHARGES & FINANCE
                </h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-papier text-texte rounded-lg hover:bg-trait transition-colors text-xs font-mono font-bold uppercase"
                >
                    <Plus size={14} />
                    <span>Ajouter une charge</span>
                </button>
            </div>

            {state.loading || state.error || expenses.length === 0 ? (
                <WidgetStatus {...state} isEmpty={expenses.length === 0} emptyText="Aucune charge enregistrée." />
            ) : (
                <>
                    {total > 0 && (
                        <p className="font-mono text-sm text-texte-2 mb-4">
                            Charges récurrentes : <span className="font-bold text-texte">{formatEuro(total)} / an</span>
                        </p>
                    )}
                    <div className="space-y-3">
                        {expenses.map((e) => (
                            <div key={e.id} className="group flex items-center justify-between p-3 border border-trait bg-white hover:border-texte transition-colors">
                                <div>
                                    <p className="font-serif font-medium">{e.label}</p>
                                    <div className="flex gap-2 mt-1">
                                        {e.category && <span className="text-xs font-mono font-bold text-texte-2 bg-papier px-1.5 py-0.5 rounded">{e.category}</span>}
                                        {e.frequency && <span className="text-xs font-mono text-texte-2">{FREQUENCY_LABEL[e.frequency] ?? e.frequency}</span>}
                                        {e.provider && <span className="text-xs font-mono text-texte-2">{e.provider}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold">{formatEuro(e.amount)}</span>
                                    <button
                                        onClick={() => onDelete(e)}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-texte-2 hover:text-alerte transition"
                                        aria-label={`Supprimer ${e.label}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
