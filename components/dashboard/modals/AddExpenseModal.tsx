import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { apiErrorMessage, expensesApi, type Expense, type ExpenseFrequency } from '@/app/lib/api';
import { emptyToNull, toNumberOrNull } from '../format';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    onSaved: (expense: Expense) => void;
}

const emptyForm = {
    name: '',
    type: 'OPEX',
    amount: '',
    frequency: 'mensuel' as ExpenseFrequency,
    provider: '',
};

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white";

export default function AddExpenseModal({ isOpen, onClose, propertyId, onSaved }: AddExpenseModalProps) {
    const [formData, setFormData] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const close = () => {
        setFormData(emptyForm);
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = toNumberOrNull(formData.amount);
        if (amount === null || amount < 0) {
            setError('Montant invalide.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const expense = await expensesApi.create(propertyId, {
                label: formData.name.trim(),
                category: formData.type,
                amount,
                frequency: formData.frequency,
                provider: emptyToNull(formData.provider),
            });
            onSaved(expense);
            close();
        } catch (err) {
            setError(apiErrorMessage(err, "L'enregistrement a échoué."));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#fdfbf7] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb]">
                        <h2 className="text-xl font-serif font-bold text-gray-900">Ajouter une charge</h2>
                        <button onClick={close} className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la dépense</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                maxLength={200}
                                placeholder="Ex: Contrat Chaudière"
                                className={inputClass}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                    <option value="OPEX">OPEX - Charges Courantes</option>
                                    <option value="CAPEX">CAPEX - Investissement</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                                <select name="frequency" value={formData.frequency} onChange={handleChange} className={inputClass}>
                                    <option value="mensuel">Mensuel</option>
                                    <option value="annuel">Annuel</option>
                                    <option value="ponctuel">Ponctuel</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="amount"
                                        min="0"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`${inputClass} pr-8`}
                                        required
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500">€</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                                <input
                                    type="text"
                                    name="provider"
                                    value={formData.provider}
                                    onChange={handleChange}
                                    maxLength={200}
                                    placeholder="Ex: Engie"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                onClick={close}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#c05621] rounded-lg hover:bg-[#9c4219] transition-colors shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                Ajouter la dépense
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
