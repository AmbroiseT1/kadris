import React from 'react';
import { Plus, TrendingUp, Wallet } from 'lucide-react';

interface FinanceBentoProps {
    onAddClick: () => void;
}

export default function FinanceBento({ onAddClick }: FinanceBentoProps) {
    return (
        <div className="space-y-8">
            {/* Market Value Section (Existing) */}
            <section>
                <h3 className="font-serif text-xl font-bold border-b border-black pb-2 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} /> VALEUR ESTIMÉE
                </h3>
                <div className="text-4xl font-bold font-serif mb-2">1 250 000 €</div>
                <p className="font-mono text-sm text-gray-500">Soit 8 620 € / m²</p>

                <div className="mt-6 p-4 bg-black/5 border border-black/20">
                    <p className="font-handwriting text-sm italic">
                        "Marché dynamique sur ce secteur. +4% sur les 12 derniers mois."
                    </p>
                </div>
            </section>

            {/* Expenses Section (New) */}
            <section>
                <div className="flex justify-between items-center border-b border-black pb-2 mb-4">
                    <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                        <Wallet size={20} /> CHARGES & FINANCE
                    </h3>
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-xs font-mono font-bold uppercase"
                    >
                        <Plus size={14} />
                        <span>Ajouter une charge</span>
                    </button>
                </div>

                <div className="space-y-3">
                    <ExpenseItem name="Taxe Foncière" amount="2 450 €" type="CAPEX" frequency="Annuel" />
                    <ExpenseItem name="Assurance PNO" amount="35 €" type="OPEX" frequency="Mensuel" />
                    <ExpenseItem name="Entretien Chaudière" amount="180 €" type="OPEX" frequency="Annuel" />
                </div>
            </section>
        </div>
    );
}

const ExpenseItem = ({ name, amount, type, frequency }: { name: string, amount: string, type: string, frequency: string }) => (
    <div className="flex items-center justify-between p-3 border border-gray-200 bg-white hover:border-black transition-colors">
        <div>
            <p className="font-serif font-medium">{name}</p>
            <div className="flex gap-2 mt-1">
                <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{type}</span>
                <span className="text-[10px] font-mono text-gray-400">{frequency}</span>
            </div>
        </div>
        <span className="font-mono font-bold">{amount}</span>
    </div>
);
