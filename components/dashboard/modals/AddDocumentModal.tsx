import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/app/lib/api';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function AddDocumentModal({ isOpen, onClose, onSave }: AddDocumentModalProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'AUTRE',
        date: new Date().toISOString().split('T')[0],
        description: '',
        file: null as File | null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const analyzeFileWithAI = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const upload = new FormData();
            upload.append('file', file);

            // Appel authentifié à l'API (URL via NEXT_PUBLIC_API_URL, token ajouté par l'intercepteur)
            const response = await api.post('/documents/analyze', upload);
            const data = response.data;

            // Mapping intelligent des données
            let newTitle = formData.title;
            let newType = formData.type;
            let newDate = formData.date;
            let newDesc = formData.description;

            switch (data.detected_type) {
                case 'INVOICE':
                    newType = 'FACTURE';
                    newTitle = data.artisan_nom ? `Facture ${data.artisan_nom}` : 'Nouvelle Facture';
                    if (data.date_facture) newDate = data.date_facture;
                    newDesc = `Montant: ${data.montant_ttc || '?'}€\n${data.description_travaux || ''}`;
                    break;
                case 'QUOTE':
                    newType = 'DEVIS';
                    newTitle = data.artisan_nom ? `Devis ${data.artisan_nom}` : 'Nouveau Devis';
                    if (data.validite_date) newDate = data.validite_date;
                    newDesc = `Montant: ${data.montant_total || '?'}€`;
                    break;
                case 'TAX_NOTICE':
                    newType = 'TAXE'; // ou IMPOT
                    newTitle = `Avis ${data.type_taxe || 'Impôt'} ${data.annee || ''}`;
                    newDesc = `Montant à payer: ${data.montant_total || '?'}€`;
                    break;
                case 'INSURANCE':
                    newType = 'ASSURANCE';
                    newTitle = data.assureur ? `Assurance ${data.assureur}` : 'Assurance Habitation';
                    if (data.date_echeance) newDate = data.date_echeance;
                    newDesc = `Contrat N° ${data.numero_contrat || 'Non détecté'}`;
                    break;
                case 'PROPERTY_DEED':
                    newType = 'OFFICIEL';
                    newTitle = data.notaire_nom ? `Acte de vente - Me ${data.notaire_nom}` : 'Acte de Propriété';
                    if (data.date_acte) newDate = data.date_acte;
                    newDesc = data.prix_acquisition ? `Prix d'acquisition: ${data.prix_acquisition}€` : '';
                    break;
                case 'DPE':
                    newType = 'AUTRE'; // Pas de catégorie DPE par défaut dans le select actuel
                    newTitle = `DPE (Classe ${data.classe_energetique || '?'})`;
                    newDesc = `Étiquette Énergie: ${data.classe_energetique}\nÉtiquette GES: ${data.classe_ges}`;
                    break;
            }

            setFormData(prev => ({
                ...prev,
                title: newTitle,
                type: newType,
                date: newDate,
                description: newDesc.trim()
            }));

        } catch (error) {
            console.error("Erreur IA:", error);
            // On ne bloque pas l'utilisateur, on le laisse remplir à la main
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, file }));
            // Déclenche l'analyse IA
            analyzeFileWithAI(file);
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
            description: '',
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
                        <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-2">
                            Ajouter un document
                            {isAnalyzing && <Sparkles size={18} className="text-yellow-500 animate-pulse" />}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du document</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Ex: Facture Entretien Chaudière"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white ${isAnalyzing ? 'animate-pulse bg-gray-50' : 'border-gray-300'}`}
                                    required
                                />
                                {isAnalyzing && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 size={16} className="animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>
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
                                    <option value="FACTURE">Factures</option>
                                    <option value="DEVIS">Devis</option>
                                    <option value="OFFICIEL">Document officiel</option>
                                    <option value="TAXE">Taxes</option>
                                    <option value="IMPOT">Impôts</option>
                                    <option value="ASSURANCE">Assurances</option>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ajoutez une description optionnelle..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier</label>
                            <div className={`border-2 border-dashed rounded-lg p-4 transition-colors text-center cursor-pointer relative ${isAnalyzing ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 hover:border-black'}`}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.png"
                                    disabled={isAnalyzing}
                                />
                                {formData.file ? (
                                    <div className="flex items-center justify-center gap-2 text-black font-medium">
                                        <FileText size={20} />
                                        <span className="truncate max-w-[200px]">{formData.file.name}</span>
                                        {isAnalyzing && <span className="text-xs text-yellow-600 animate-pulse">(Analyse en cours...)</span>}
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
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? 'Analyse...' : 'Ajouter au coffre'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
