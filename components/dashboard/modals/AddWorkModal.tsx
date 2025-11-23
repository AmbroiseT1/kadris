import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, ArrowLeft } from 'lucide-react';

interface AddWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

type Mode = 'SELECT' | 'MANUAL' | 'UPLOAD';

export default function AddWorkModal({ isOpen, onClose, onSave }: AddWorkModalProps) {
    const [mode, setMode] = useState<Mode>('SELECT');
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'TRAVAUX',
        endDate: '',
        amount: '',
        contractor: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        resetModal();
    };

    const resetModal = () => {
        onClose();
        setTimeout(() => {
            setMode('SELECT');
            setFormData({
                title: '',
                type: 'TRAVAUX',
                endDate: '',
                amount: '',
                contractor: '',
                description: ''
            });
            setIsProcessing(false);
        }, 300);
    };

    const handleFileUpload = () => {
        setIsProcessing(true);
        // Mock OCR Process
        setTimeout(() => {
            setFormData({
                title: 'Rénovation Toiture (Détecté)',
                type: 'TRAVAUX',
                endDate: '2023-11-15',
                amount: '12500',
                contractor: 'Toiture Express SAS',
                description: 'Réfection complète de la toiture selon devis #12345. (Données extraites du document)'
            });
            setIsProcessing(false);
            setMode('MANUAL'); // Go to manual mode for validation
        }, 2000);
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
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb]">
                        <div className="flex items-center gap-2">
                            {mode !== 'SELECT' && (
                                <button
                                    onClick={() => setMode('SELECT')}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-1"
                                >
                                    <ArrowLeft size={20} className="text-gray-500" />
                                </button>
                            )}
                            <h2 className="text-xl font-serif font-bold text-gray-900">Ajouter des Travaux</h2>
                        </div>
                        <button onClick={resetModal} className="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {mode === 'SELECT' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setMode('UPLOAD')}
                                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#c05621] hover:bg-[#c05621]/5 transition-all group flex flex-col items-center text-center"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#c05621]/10 transition-colors">
                                        <Upload size={24} className="text-gray-600 group-hover:text-[#c05621]" />
                                    </div>
                                    <h3 className="font-serif font-bold text-lg text-gray-900">Importer un document</h3>
                                    <p className="text-sm text-gray-500 mt-1">Devis ou Facture (PDF, JPG)</p>
                                    <span className="text-xs font-mono text-[#c05621] mt-3 bg-[#c05621]/10 px-2 py-1 rounded">IA : Remplissage automatique</span>
                                </button>

                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <span className="relative bg-[#fdfbf7] px-4 text-sm text-gray-500 font-mono">OU</span>
                                </div>

                                <button
                                    onClick={() => setMode('MANUAL')}
                                    className="w-full p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <FileText size={20} className="text-gray-600" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-serif font-bold text-gray-900">Saisie Manuelle</h3>
                                        <p className="text-xs text-gray-500">Remplir le formulaire soi-même</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {mode === 'UPLOAD' && (
                            <div className="text-center py-8">
                                {!isProcessing ? (
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#c05621] hover:bg-[#c05621]/5 transition-all cursor-pointer"
                                        onClick={handleFileUpload}
                                    >
                                        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                        <p className="font-serif font-bold text-lg text-gray-900">Cliquez pour déposer un fichier</p>
                                        <p className="text-sm text-gray-500 mt-2">PDF, JPG, PNG (Max 10Mo)</p>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <Loader2 size={48} className="mx-auto text-[#c05621] animate-spin mb-4" />
                                        <p className="font-serif font-bold text-lg text-gray-900">Analyse du document...</p>
                                        <p className="text-sm text-gray-500 mt-2 font-mono">Extraction des données via OCR</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'MANUAL' && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Ex: Rénovation Toiture"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white"
                                        >
                                            <option value="TRAVAUX">Travaux</option>
                                            <option value="ENTRETIEN">Entretien</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="SINISTRE">Sinistre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant TTC</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white pr-8"
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500">€</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Artisan / Entreprise</label>
                                        <input
                                            type="text"
                                            name="contractor"
                                            value={formData.contractor}
                                            onChange={handleChange}
                                            placeholder="Nom de l'entreprise"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Détails supplémentaires..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white resize-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-4 space-x-3">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#c05621] rounded-lg hover:bg-[#9c4219] transition-colors shadow-md hover:shadow-lg"
                                    >
                                        Ajouter l'événement
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
