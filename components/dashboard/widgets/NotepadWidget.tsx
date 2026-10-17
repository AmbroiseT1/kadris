"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PenLine, Trash2 } from 'lucide-react';
import { apiErrorMessage, notesApi } from '@/app/lib/api';

type SaveState = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

const MAX_LENGTH = 20_000;

/** Bloc-notes du bien, enregistré côté serveur (visible uniquement par son auteur). */
export default function NotepadWidget({ propertyId }: { propertyId: string }) {
    // key : état repartant de zéro (chargement) à chaque changement de bien
    return <Notepad key={propertyId} propertyId={propertyId} />;
}

function Notepad({ propertyId }: { propertyId: string }) {
    const [note, setNote] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [state, setState] = useState<SaveState>('loading');
    const [error, setError] = useState<string | null>(null);
    // Si le chargement échoue, on bloque l'édition (sinon on créerait une seconde note)
    const [loadFailed, setLoadFailed] = useState(false);
    const noteId = useRef<string | null>(null);
    const [lastSaved, setLastSaved] = useState("");
    const pending = useRef<Promise<unknown> | null>(null);

    useEffect(() => {
        let cancelled = false;
        notesApi.list(propertyId)
            .then((notes) => {
                if (cancelled) return;
                const first = notes[0];
                noteId.current = first?.id ?? null;
                setLastSaved(first?.content ?? "");
                setNote(first?.content ?? "");
                setState('idle');
            })
            .catch((e) => {
                if (cancelled) return;
                setError(apiErrorMessage(e, "Notes indisponibles."));
                setLoadFailed(true);
                setState('error');
            });
        return () => { cancelled = true; };
    }, [propertyId]);

    const save = async (content: string) => {
        // Sérialise les enregistrements pour ne pas créer deux notes
        if (pending.current) await pending.current.catch(() => undefined);
        setState('saving');
        const op = (async () => {
            if (noteId.current) {
                await notesApi.update(noteId.current, content);
            } else {
                const created = await notesApi.create(content, propertyId);
                noteId.current = created.id;
            }
        })();
        pending.current = op;
        try {
            await op;
            setLastSaved(content);
            setError(null);
            setState('saved');
        } catch (e) {
            setError(apiErrorMessage(e, "Enregistrement impossible."));
            setState('error');
        } finally {
            if (pending.current === op) pending.current = null;
        }
    };

    // Sauvegarde automatique (anti-rebond)
    useEffect(() => {
        if (state === 'loading' || loadFailed || note === lastSaved) return;
        const timeoutId = setTimeout(() => { save(note); }, 800);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note]);

    const handleClear = () => {
        if (confirm("Voulez-vous vraiment effacer vos notes ?")) {
            setNote("");
        }
    };

    const statusText =
        state === 'loading' ? 'Chargement...' :
            state === 'saving' ? 'Enregistrement...' :
                state === 'error' ? (error ?? 'Erreur') :
                    note !== lastSaved ? 'Modifications non enregistrées' :
                        'Enregistré';

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
                        disabled={state === 'loading' || loadFailed}
                        maxLength={MAX_LENGTH}
                        className="flex-1 w-full bg-transparent p-4 resize-none outline-none text-gray-700 font-medium text-sm leading-relaxed disabled:opacity-60"
                        placeholder="Écrivez vos idées ici..."
                        style={{
                            backgroundImage: 'linear-gradient(transparent, transparent 23px, #e5e7eb 24px)',
                            backgroundSize: '100% 24px',
                            lineHeight: '24px'
                        }}
                    />

                    {/* Footer Actions */}
                    <div className="px-3 py-2 flex justify-between items-center border-t border-yellow-200/50">
                        <span
                            className={`text-[10px] italic truncate ${state === 'error' ? 'text-red-700' : 'text-yellow-600'}`}
                            role={state === 'error' ? 'alert' : undefined}
                        >
                            {statusText}
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
