import React from 'react';
import { FileText, Plus, Download, Trash2, Sparkles } from 'lucide-react';
import type { PropertyDocument } from '@/app/lib/api';
import { DOCUMENT_TYPES } from '../modals/AddDocumentModal';
import { formatDate } from '../format';
import { WidgetStatus, type ResourceState } from './WidgetState';

interface DocumentsVaultProps extends ResourceState {
    documents: PropertyDocument[];
    onAddClick: () => void;
    onDownload: (doc: PropertyDocument) => void;
    onDelete: (doc: PropertyDocument) => void;
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(DOCUMENT_TYPES.map((t) => [t.id, t.label]));

export default function DocumentsVault({ documents, onAddClick, onDownload, onDelete, ...state }: DocumentsVaultProps) {
    const [activeCategory, setActiveCategory] = React.useState<string>("TOUS");

    const categories = [{ id: "TOUS", label: "Tous" }, ...DOCUMENT_TYPES];

    const filteredDocuments = activeCategory === "TOUS"
        ? documents
        : documents.filter(doc => doc.doc_type === activeCategory);

    return (
        <div className="space-y-6">
            {/* Header Action */}
            <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                    <FileText size={20} /> COFFRE-FORT
                </h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-texte text-white rounded-lg hover:bg-texte transition-colors text-xs font-mono font-bold uppercase shadow-sm"
                >
                    <Plus size={14} />
                    <span>Ajouter</span>
                </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${activeCategory === cat.id
                            ? 'bg-brique text-white'
                            : 'bg-papier text-texte-2 hover:bg-trait'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Documents List */}
            <div className="space-y-3">
                {state.loading || state.error || filteredDocuments.length === 0 ? (
                    <WidgetStatus
                        {...state}
                        isEmpty={filteredDocuments.length === 0}
                        emptyText={documents.length === 0 ? "Aucun document pour l'instant." : "Aucun document dans cette catégorie."}
                    />
                ) : (
                    filteredDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-trait hover:border-texte transition-colors group bg-white">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 bg-papier rounded-lg group-hover:bg-trait transition-colors">
                                    <FileText size={16} className="text-texte-2 group-hover:text-texte" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-serif font-medium text-texte truncate flex items-center gap-1">
                                        {doc.title}
                                        {doc.ai_analysis && <span title="Analysé par IA"><Sparkles size={12} className="text-vigil" /></span>}
                                    </p>
                                    <div className="flex flex-col">
                                        <p className="font-mono text-xs text-texte-2">{formatDate(doc.date || doc.created_at)}</p>
                                        {doc.description && (
                                            <p className="text-xs text-texte-2 mt-0.5 italic truncate max-w-[200px]">{doc.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold border border-texte px-1.5 py-0.5 rounded uppercase bg-papier">
                                    {TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                                </span>
                                <button
                                    onClick={() => onDownload(doc)}
                                    className="p-1.5 text-texte-2 hover:text-texte hover:bg-papier rounded-full transition-colors"
                                    title="Télécharger"
                                    aria-label={`Télécharger ${doc.title}`}
                                >
                                    <Download size={14} />
                                </button>
                                <button
                                    onClick={() => onDelete(doc)}
                                    className="p-1.5 text-texte-2 hover:text-alerte hover:bg-papier rounded-full transition-colors"
                                    title="Supprimer"
                                    aria-label={`Supprimer ${doc.title}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
