import React from 'react';
import { FileText, Plus, Download } from 'lucide-react';

interface Document {
    id: string;
    title: string;
    date: string;
    type: string;
    description?: string;
    url?: string;
}

interface DocumentsVaultProps {
    documents: Document[];
    onAddClick: () => void;
}

export default function DocumentsVault({ documents, onAddClick }: DocumentsVaultProps) {
    const [activeCategory, setActiveCategory] = React.useState<string>("TOUS");

    const categories = [
        { id: "TOUS", label: "Tous" },
        { id: "FACTURE", label: "Factures" },
        { id: "DEVIS", label: "Devis" },
        { id: "OFFICIEL", label: "Document officiel" },
        { id: "TAXE", label: "Taxes" },
        { id: "IMPOT", label: "Impôts" },
        { id: "ASSURANCE", label: "Assurances" },
        { id: "AUTRE", label: "Autre" }
    ];

    const filteredDocuments = activeCategory === "TOUS"
        ? documents
        : documents.filter(doc => doc.type === activeCategory);

    return (
        <div className="space-y-6">
            {/* Header Action */}
            <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                    <FileText size={20} /> COFFRE-FORT
                </h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-mono font-bold uppercase shadow-sm"
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
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${activeCategory === cat.id
                            ? 'bg-kadris-terracotta text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Documents List */}
            <div className="space-y-3">
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 font-mono text-sm">
                        Aucun document dans cette catégorie.
                    </div>
                ) : (
                    filteredDocuments.map((doc) => (
                        <DocItem
                            key={doc.id}
                            title={doc.title}
                            date={doc.date}
                            type={doc.type}
                            description={doc.description}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

const DocItem = ({ title, date, type, description }: { title: string, date: string, type: string, description?: string }) => (
    <div className="flex items-center justify-between p-3 border border-gray-200 hover:border-black transition-colors cursor-pointer group bg-white">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <FileText size={16} className="text-gray-500 group-hover:text-black" />
            </div>
            <div>
                <p className="font-serif font-medium text-gray-900">{title}</p>
                <div className="flex flex-col">
                    <p className="font-mono text-[10px] text-gray-400">{date}</p>
                    {description && (
                        <p className="text-[10px] text-gray-500 mt-0.5 italic truncate max-w-[200px]">{description}</p>
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold border border-black px-1.5 py-0.5 rounded uppercase bg-gray-50">{type}</span>
            <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                <Download size={14} />
            </button>
        </div>
    </div>
);
