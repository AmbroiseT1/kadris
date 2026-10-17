import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, ArrowLeft } from 'lucide-react';
import {
    analyzeDocument, apiErrorMessage, documentsApi, worksApi,
    type AnalyzedDocument, type PropertyDocument, type Work, type WorkStatus,
} from '@/app/lib/api';
import AiConsent from './AiConsent';
import { emptyToNull, toNumberOrNull } from '../format';

interface AddWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    onWorkSaved: (work: Work) => void;
    onDocumentSaved: (document: PropertyDocument) => void;
}

type Mode = 'SELECT' | 'MANUAL' | 'UPLOAD';

const emptyForm = {
    title: '',
    type: 'TRAVAUX',
    status: 'done' as WorkStatus,
    endDate: '',
    amount: '',
    contractor: '',
    description: '',
};

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c05621] focus:border-transparent bg-white";

export default function AddWorkModal({ isOpen, onClose, propertyId, onWorkSaved, onDocumentSaved }: AddWorkModalProps) {
    const [mode, setMode] = useState<Mode>('SELECT');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnalyzedDocument | null>(null);
    // Document déjà envoyé : un nouvel essai après une erreur ne le renvoie pas
    const [uploadedDoc, setUploadedDoc] = useState<PropertyDocument | null>(null);
    const [formData, setFormData] = useState(emptyForm);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetModal = () => {
        onClose();
        setTimeout(() => {
            setMode('SELECT');
            setFormData(emptyForm);
            setIsProcessing(false);
            setError(null);
            setConsent(false);
            setFile(null);
            setAnalysis(null);
            setUploadedDoc(null);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const date = formData.endDate || null;
            const title = formData.title.trim();
            if (file && !uploadedDoc) {
                const isQuote = analysis?.detected_type === 'QUOTE';
                const doc = await documentsApi.upload(propertyId, {
                    file,
                    title: `${isQuote ? 'Devis' : 'Facture'} - ${title}`.slice(0, 200),
                    doc_type: isQuote ? 'DEVIS' : 'FACTURE',
                    date,
                    ai_analysis: consent && analysis ? analysis : null,
                });
                setUploadedDoc(doc);
                onDocumentSaved(doc);
            }
            const work = await worksApi.create(propertyId, {
                title,
                category: formData.type,
                status: formData.status,
                date,
                cost: toNumberOrNull(formData.amount),
                provider: emptyToNull(formData.contractor),
                description: emptyToNull(formData.description),
            });
            onWorkSaved(work);
            resetModal();
        } catch (err) {
            setError(apiErrorMessage(err, "L'enregistrement a échoué."));
        } finally {
            setIsSaving(false);
        }
    };

    const prefillFromAnalysis = (data: AnalyzedDocument) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- champs variables selon detected_type
        const d = data as Record<string, any>;
        setFormData(prev => ({
            ...prev,
            title: d.description_travaux ? String(d.description_travaux).slice(0, 200) : prev.title,
            status: data.detected_type === 'QUOTE' ? 'planned' : prev.status,
            endDate: d.date_facture || prev.endDate,
            amount: d.montant_ttc != null ? String(d.montant_ttc) : d.montant_total != null ? String(d.montant_total) : prev.amount,
            contractor: d.artisan_nom || prev.contractor,
        }));
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setUploadedDoc(null);
        setError(null);
        if (!consent) {
            setMode('MANUAL');
            return;
        }
        setIsProcessing(true);
        try {
            const data = await analyzeDocument(selected);
            setAnalysis(data);
            prefillFromAnalysis(data);
        } catch (err) {
            setError(apiErrorMessage(err, "Analyse automatique indisponible, complétez le formulaire."));
        } finally {
            setIsProcessing(false);
            setMode('MANUAL'); // validation par l'utilisateur
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
                                    <span className="text-xs font-mono text-[#c05621] mt-3 bg-[#c05621]/10 px-2 py-1 rounded">IA : Remplissage automatique (optionnel)</span>
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
                            <div className="text-center py-4 space-y-4">
                                {!isProcessing ? (
                                    <>
                                        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-[#c05621] hover:bg-[#c05621]/5 transition-all cursor-pointer">
                                            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                            <p className="font-serif font-bold text-lg text-gray-900">Cliquez pour déposer un fichier</p>
                                            <p className="text-sm text-gray-500 mt-2">PDF, JPG, PNG (Max 10Mo)</p>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                                                onChange={handleFileSelected}
                                            />
                                        </label>
                                        <div className="text-left">
                                            <AiConsent checked={consent} onChange={setConsent} />
                                            {!consent && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Sans accord, le document est seulement joint aux travaux, sans analyse.
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8">
                                        <Loader2 size={48} className="mx-auto text-[#c05621] animate-spin mb-4" />
                                        <p className="font-serif font-bold text-lg text-gray-900">Analyse du document...</p>
                                        <p className="text-sm text-gray-500 mt-2 font-mono">Extraction des données</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'MANUAL' && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {file && (
                                    <p className="text-xs text-gray-600 flex items-center gap-1">
                                        <FileText size={14} /> Document joint : <span className="font-medium truncate max-w-[220px]">{file.name}</span>
                                    </p>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        maxLength={200}
                                        placeholder="Ex: Rénovation Toiture"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                            <option value="TRAVAUX">Travaux</option>
                                            <option value="ENTRETIEN">Entretien</option>
                                            <option value="ADMIN">Admin</option>
                                            <option value="SINISTRE">Sinistre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                                            <option value="planned">Prévu</option>
                                            <option value="in_progress">En cours</option>
                                            <option value="done">Terminé</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant TTC</label>
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
                                            />
                                            <span className="absolute right-3 top-2 text-gray-500">€</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Artisan / Entreprise</label>
                                    <input
                                        type="text"
                                        name="contractor"
                                        value={formData.contractor}
                                        onChange={handleChange}
                                        maxLength={200}
                                        placeholder="Nom de l'entreprise"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        maxLength={5000}
                                        placeholder="Détails supplémentaires..."
                                        className={`${inputClass} resize-none`}
                                    />
                                </div>

                                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

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
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#c05621] rounded-lg hover:bg-[#9c4219] transition-colors shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                                        Ajouter l&apos;événement
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
