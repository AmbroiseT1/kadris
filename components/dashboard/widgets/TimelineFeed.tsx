import React from 'react';
import { Plus } from 'lucide-react';

interface TimelineFeedProps {
    onAddClick: () => void;
}

export default function TimelineFeed({ onAddClick }: TimelineFeedProps) {
    return (
        <div className="relative">
            {/* Header Action */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-mono font-bold uppercase"
                >
                    <Plus size={16} />
                    <span>Ajouter</span>
                </button>
            </div>

            <div className="relative border-l-2 border-black/20 ml-4 space-y-12">
                {/* Timeline Item 1 */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-black rounded-full" />
                    <div className="font-mono text-sm text-gray-500 mb-1">2024 - EN COURS</div>
                    <h3 className="text-xl font-bold font-serif mb-2">Ravalement Façade Nord</h3>
                    <p className="font-handwriting text-gray-700 italic mb-4">
                        "Traitement des fissures et reprise des enduits à la chaux."
                    </p>
                    <div className="w-full h-4 border border-black p-0.5 relative">
                        <div
                            className="h-full bg-black/80"
                            style={{ width: "65%", maskImage: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)" }}
                        />
                    </div>
                    <div className="text-right font-mono text-xs mt-1">65%</div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-black rounded-full" />
                    <div className="font-mono text-sm text-gray-500 mb-1">2020 - TERMINÉ</div>
                    <h3 className="text-xl font-bold font-serif mb-2">Isolation Combles</h3>
                    <p className="font-handwriting text-gray-700 italic">
                        "Pose de laine de verre 300mm. R = 7.5."
                    </p>
                </div>
            </div>
        </div>
    );
}
