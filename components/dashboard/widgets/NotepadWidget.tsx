"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Save, Trash2 } from 'lucide-react';

export default function NotepadWidget() {
    const [note, setNote] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    // Load from local storage on mount
    useEffect(() => {
        const savedNote = localStorage.getItem('kadris_user_notes');
        if (savedNote) {
            setNote(savedNote);
        }
    }, []);

    // Save to local storage whenever note changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('kadris_user_notes', note);
        }, 500); // Debounce save
        return () => clearTimeout(timeoutId);
    }, [note]);

    const handleClear = () => {
        if (confirm("Voulez-vous vraiment effacer vos notes ?")) {
            setNote("");
            localStorage.removeItem('kadris_user_notes');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[#fef9c3] shadow-lg border border-yellow-200 rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-72 h-80' : 'w-72 h-12'}`}
            style={{
                transform: 'rotate(-1deg)', // Slight rotation for "post-it" feel
                boxShadow: '3px 3px 10px rgba(0,0,0,0.1)'
            }}
        >
            {/* Header */}
            <div
                className="bg-[#fde047] px-4 py-2 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 text-yellow-800">
                    <PenLine size={16} />
                    <span className="font-bold font-handwriting text-sm uppercase tracking-wider">Bloc-notes</span>
                </div>
                <div className="text-xs text-yellow-700 opacity-60">
                    {isExpanded ? '▼' : '▲'}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="flex flex-col h-[calc(100%-3rem)]">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-700 font-medium text-sm leading-relaxed"
                        placeholder="Écrivez vos idées ici..."
                        style={{
                            backgroundImage: 'linear-gradient(transparent, transparent 23px, #e5e7eb 24px)',
                            backgroundSize: '100% 24px',
                            lineHeight: '24px'
                        }}
                    />

                    {/* Footer Actions */}
                    <div className="px-3 py-2 flex justify-between items-center border-t border-yellow-200/50">
                        <span className="text-[10px] text-yellow-600 italic">
                            Sauvegarde auto
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="p-1.5 hover:bg-yellow-200 rounded-full text-yellow-700 transition-colors"
                            title="Effacer tout"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
