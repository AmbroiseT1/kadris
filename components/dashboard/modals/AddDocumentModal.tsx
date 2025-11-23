import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function AddDocumentModal({ isOpen, onClose, onSave }: AddDocumentModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        type: 'AUTRE',
        date: new Date().toISOString().split('T')[0],
        file: null as File | null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        setFormData({
            title: '',
            type: 'AUTRE',
            date: new Date().toISOString().split('T')[0],
            file: null
        });
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
                        <h2 className="text-xl font-serif font-bold text-gray-900">Ajouter un document</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du document</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex: Facture Entretien Chaudière"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                >
                                    <option value="DEVIS">Devis</option>
                                    <option value="FACTURE">Facture</option>
                                    <option value="ACTE">Acte</option>
                                    <option value="DPE">DPE</option>
                                    <option value="AUTRE">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-black transition-colors text-center cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.png"
                                />
                                {formData.file ? (
                                    <div className="flex items-center justify-center gap-2 text-black font-medium">
                                        <FileText size={20} />
                                        <span className="truncate max-w-[200px]">{formData.file.name}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-sm">Cliquez pour déposer un fichier</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg"
                            >
                                Ajouter au coffre
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
