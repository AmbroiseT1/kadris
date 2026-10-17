import React from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import type { Task } from '@/app/lib/api';
import { formatDate, formatEuro } from '../format';
import { WidgetStatus, type ResourceState } from './WidgetState';

interface SmartActionPlanProps extends ResourceState {
    tasks: Task[];
    onAddClick: () => void;
    onToggle: (task: Task) => void;
    onDelete: (task: Task) => void;
}

export default function SmartActionPlan({ tasks, onAddClick, onToggle, onDelete, ...state }: SmartActionPlanProps) {
    return (
        <div className="space-y-6">
            {/* Header Action */}
            <div className="flex justify-between items-center border-b border-black/10 pb-4">
                <h3 className="font-serif text-lg font-bold">Plan d&apos;Action</h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#c05621] text-white rounded-lg hover:bg-[#9c4219] transition-colors text-xs font-mono font-bold uppercase shadow-sm"
                >
                    <Plus size={14} />
                    <span>Nouvelle Tâche</span>
                </button>
            </div>

            {/* Task List */}
            {state.loading || state.error || tasks.length === 0 ? (
                <WidgetStatus {...state} isEmpty={tasks.length === 0} emptyText="Aucune tâche prévue." />
            ) : (
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <TaskItem key={task.id} task={task} onToggle={() => onToggle(task)} onDelete={() => onDelete(task)} />
                    ))}
                </div>
            )}
        </div>
    );
}

const TaskItem = ({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) => {
    const completed = task.done;
    const priority = task.priority ?? 'MOYENNE';
    return (
        <div className={`group flex items-center justify-between p-3 border rounded-lg transition-colors ${completed ? 'bg-papier border-trait' : 'bg-white border-trait-fort hover:border-[#c05621]'}`}>
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className="text-texte-2 hover:text-[#c05621] transition-colors"
                    aria-label={completed ? 'Marquer comme à faire' : 'Marquer comme faite'}
                >
                    {completed ? <CheckCircle2 size={20} className="text-ok" /> : <Circle size={20} />}
                </button>
                <div>
                    <p className={`font-medium ${completed ? 'text-texte-2 line-through' : 'text-texte'}`}>{task.title}</p>
                    <div className="flex gap-2 items-center">
                        {task.category && <span className="text-xs font-mono font-bold text-texte-2 bg-papier px-1.5 py-0.5 rounded">{task.category}</span>}
                        {task.due_date && <span className="text-xs font-mono text-texte-2">Échéance {formatDate(task.due_date)}</span>}
                        {task.estimated_cost != null && <span className="text-xs font-mono text-texte-2">{formatEuro(task.estimated_cost)}</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full ${priority === 'URGENTE' ? 'bg-alerte-soft text-alerte' :
                    priority === 'MOYENNE' ? 'bg-vigil-soft text-vigil' :
                        'bg-encre-soft text-encre'
                    }`}>
                    {priority}
                </span>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-texte-2 hover:text-alerte transition"
                    aria-label={`Supprimer ${task.title}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
