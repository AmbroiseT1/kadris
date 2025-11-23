import React from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';

interface SmartActionPlanProps {
    onAddClick: () => void;
}

export default function SmartActionPlan({ onAddClick }: SmartActionPlanProps) {
    return (
        <div className="space-y-6">
            {/* Header Action */}
            <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h3 className="font-serif text-lg font-bold">Plan d'Action</h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#c05621] text-white rounded-lg hover:bg-[#9c4219] transition-colors text-xs font-mono font-bold uppercase shadow-sm"
                >
                    <Plus size={14} />
                    <span>Nouvelle Tâche</span>
                </button>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                <TaskItem
                    title="Remplacer joint douche"
                    category="PLOMBERIE"
                    priority="URGENTE"
                    completed={false}
                />
                <TaskItem
                    title="Devis élagage chêne"
                    category="JARDIN"
                    priority="MOYENNE"
                    completed={false}
                />
                <TaskItem
                    title="Commander peinture salon"
                    category="DECO"
                    priority="BASSE"
                    completed={true}
                />
            </div>
        </div>
    );
}

const TaskItem = ({ title, category, priority, completed }: { title: string, category: string, priority: string, completed: boolean }) => (
    <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-[#c05621]'}`}>
        <div className="flex items-center gap-3">
            <button className={`text-gray-400 hover:text-[#c05621] transition-colors`}>
                {completed ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
            </button>
            <div>
                <p className={`font-medium ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{title}</p>
                <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>
            </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full ${priority === 'URGENTE' ? 'bg-red-100 text-red-700' :
                priority === 'MOYENNE' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
            }`}>
            {priority}
        </span>
    </div>
);
