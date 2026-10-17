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
        <div className={`group flex items-center justify-between p-3 border rounded-lg transition-colors ${completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:border-[#c05621]'}`}>
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggle}
                    className="text-gray-400 hover:text-[#c05621] transition-colors"
                    aria-label={completed ? 'Marquer comme à faire' : 'Marquer comme faite'}
                >
                    {completed ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
                </button>
                <div>
                    <p className={`font-medium ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                    <div className="flex gap-2 items-center">
                        {task.category && <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{task.category}</span>}
                        {task.due_date && <span className="text-[10px] font-mono text-gray-400">Échéance {formatDate(task.due_date)}</span>}
                        {task.estimated_cost != null && <span className="text-[10px] font-mono text-gray-400">{formatEuro(task.estimated_cost)}</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full ${priority === 'URGENTE' ? 'bg-red-100 text-red-700' :
                    priority === 'MOYENNE' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {priority}
                </span>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-600 transition"
                    aria-label={`Supprimer ${task.title}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
