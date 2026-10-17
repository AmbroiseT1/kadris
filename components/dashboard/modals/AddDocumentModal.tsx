import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react';
import {
    analyzeDocument, apiErrorMessage, documentsApi, DOC_TYPE_OWNERSHIP_PROOF,
    type AnalyzedDocument, type PropertyDocument,
} from '@/app/lib/api';
import AiConsent from './AiConsent';
import { todayIso } from '../format';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    onSaved: (doc: PropertyDocument) => void;
    /** Type présélectionné (ex. justificatif de propriété après un refus). */
    defaultType?: string;
}

export const DOCUMENT_TYPES = [
    { id: 'FACTURE', label: 'Factures' },
    { id: 'DEVIS', label: 'Devis' },
    { id: 'OFFICIEL', label: 'Document officiel' },
    { id: 'TAXE', label: 'Taxes' },
    { id: 'IMPOT', label: 'Impôts' },
    { id: 'ASSURANCE', label: 'Assurances' },
    { id: DOC_TYPE_OWNERSHIP_PROOF, label: 'Justificatif de propriété' },
    { id: 'AUTRE', label: 'Autre' },
];

const emptyForm = (type = 'AUTRE') => ({
    title: '',
    type,
    date: todayIso(),
    description: '',
    file: null as File | null,
});

/** Pré-remplit le formulaire à partir du résultat de l'analyse IA. */
function mapAnalysis(data: AnalyzedDocument, current: ReturnType<typeof emptyForm>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- champs variables selon detected_type
    const d = data as Record<string, any>;
    let { title, type, date, description } = current;
    switch (data.detected_type) {
        case 'INVOICE':
            type = 'FACTURE';
            title = d.artisan_nom ? `Facture ${d.artisan_nom}` : 'Nouvelle Facture';
            if (d.date_facture) date = d.date_facture;
            description = `Montant: ${d.montant_ttc || '?'}€\n${d.description_travaux || ''}`;
            break;
        case 'QUOTE':
            type = 'DEVIS';
            title = d.artisan_nom ? `Devis ${d.artisan_nom}` : 'Nouveau Devis';
            if (d.validite_date) date = d.validite_date;
            description = `Montant: ${d.montant_total || '?'}€`;
            break;
        case 'TAX_NOTICE':
            type = 'TAXE';
            title = `Avis ${d.type_taxe || 'Impôt'} ${d.annee || ''}`;
            description = `Montant à payer: ${d.montant_total || '?'}€`;
            break;
        case 'INSURANCE':
            type = 'ASSURANCE';
            title = d.assureur ? `Assurance ${d.assureur}` : 'Assurance Habitation';
            if (d.date_echeance) date = d.date_echeance;
            description = `Contrat N° ${d.numero_contrat || 'Non détecté'}`;
            break;
        case 'PROPERTY_DEED':
            type = 'OFFICIEL';
            title = d.notaire_nom ? `Acte de vente - Me ${d.notaire_nom}` : 'Acte de Propriété';
            if (d.date_acte) date = d.date_acte;
            description = d.prix_acquisition ? `Prix d'acquisition: ${d.prix_acquisition}€` : '';
            break;
        case 'DPE':
            type = 'AUTRE';
            title = `DPE (Classe ${d.classe_energetique || '?'})`;
            description = `Étiquette Énergie: ${d.classe_energetique}\nÉtiquette GES: ${d.classe_ges}`;
            break;
    }
    return { ...current, title, type, date, description: description.trim() };
}

export default function AddDocumentModal({ isOpen, onClose, propertyId, onSaved, defaultType }: AddDocumentModalProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiNotice, setAiNotice] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [analysis, setAnalysis] = useState<AnalyzedDocument | null>(null);
    const [formData, setFormData] = useState(() => emptyForm(defaultType));

    // À chaque ouverture : formulaire vierge avec le type demandé
    // (état ajusté pendant le rendu plutôt que dans un effet)
    const openKey = isOpen ? `open:${defaultType}` : 'closed';
    const [prevOpenKey, setPrevOpenKey] = useState(openKey);
    if (openKey !== prevOpenKey) {
        setPrevOpenKey(openKey);
        if (isOpen) setFormData(emptyForm(defaultType));
    }

    const reset = () => {
        setFormData(emptyForm(defaultType));
        setAnalysis(null);
        setConsent(false);
        setError(null);
        setAiNotice(null);
    };

    const close = () => {
        reset();
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const analyzeFileWithAI = async (file: File) => {
        setIsAnalyzing(true);
        setAiNotice(null);
        try {
            const data = await analyzeDocument(file);
            setAnalysis(data);
            setFormData(prev => mapAnalysis(data, prev));
        } catch (e) {
            // On ne bloque pas l'utilisateur : il remplit le formulaire à la main
            setAiNotice(apiErrorMessage(e, "Analyse automatique indisponible, complétez le formulaire."));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, file }));
        setAnalysis(null);
        if (consent) analyzeFileWithAI(file);
    };

    const handleConsentChange = (checked: boolean) => {
        setConsent(checked);
        if (checked && formData.file && !analysis) analyzeFileWithAI(formData.file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.file) {
            setError('Ajoutez un fichier.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const doc = await documentsApi.upload(propertyId, {
                file: formData.file,
                title: formData.title,
                doc_type: formData.type,
                date: formData.date || null,
                description: formData.description || null,
                ai_analysis: consent && analysis ? analysis : null,
            });
            onSaved(doc);
            close();
        } catch (err) {
            setError(apiErrorMessage(err, "L'envoi du document a échoué."));
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
                    className="bg-papier w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-[#e5e7eb]">
                        <h2 className="text-xl font-serif font-bold text-texte flex items-center gap-2">
                            Ajouter un document
                            {isAnalyzing && <Sparkles size={18} className="text-vigil animate-pulse" />}
                        </h2>
                        <button onClick={close} className="text-texte-2 hover:text-texte transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-texte mb-1">Fichier</label>
                            <div className={`border-2 border-dashed rounded-lg p-4 transition-colors text-center cursor-pointer relative ${isAnalyzing ? 'border-vigil/30 bg-vigil-soft' : 'border-trait-fort hover:border-texte'}`}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                                    disabled={isAnalyzing || isSaving}
                                />
                                {formData.file ? (
                                    <div className="flex items-center justify-center gap-2 text-texte font-medium">
                                        <FileText size={20} />
                                        <span className="truncate max-w-[200px]">{formData.file.name}</span>
                                        {isAnalyzing && <span className="text-xs text-vigil animate-pulse">(Analyse en cours...)</span>}
                                    </div>
                                ) : (
                                    <div className="text-texte-2">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-sm">Cliquez pour déposer un fichier (PDF ou image, 10 Mo max)</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2">
                                <AiConsent checked={consent} onChange={handleConsentChange} disabled={isAnalyzing || isSaving} />
                            </div>
                            {aiNotice && <p className="mt-1 text-xs text-vigil">{aiNotice}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-texte mb-1">Titre du document</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    maxLength={200}
                                    placeholder="Ex: Facture Entretien Chaudière"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white ${isAnalyzing ? 'animate-pulse bg-papier' : 'border-trait-fort'}`}
                                    required
                                />
                                {isAnalyzing && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 size={16} className="animate-spin text-texte-2" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-texte mb-1">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-trait-fort rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                >
                                    {DOCUMENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-texte mb-1">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-trait-fort rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-texte mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                maxLength={5000}
                                placeholder="Ajoutez une description optionnelle..."
                                rows={3}
                                className="w-full px-3 py-2 border border-trait-fort rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white resize-none"
                            />
                        </div>

                        {error && <p role="alert" className="text-sm text-alerte">{error}</p>}

                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                onClick={close}
                                className="px-4 py-2 text-sm font-medium text-texte bg-papier rounded-lg hover:bg-trait transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isAnalyzing || isSaving || !formData.file}
                                className="px-4 py-2 text-sm font-medium text-white bg-texte rounded-lg hover:bg-texte transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                {isAnalyzing ? 'Analyse...' : 'Ajouter au coffre'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
