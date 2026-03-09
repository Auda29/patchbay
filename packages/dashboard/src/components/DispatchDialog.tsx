'use client';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Loader2, Play } from 'lucide-react';

interface DispatchDialogProps {
    open: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
    onDispatched: () => void;
}

export function DispatchDialog({ open, onClose, taskId, taskTitle, onDispatched }: DispatchDialogProps) {
    const [runnerId, setRunnerId] = useState('bash');
    const [agents, setAgents] = useState<{ id: string; role: string; toolType: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            fetch('/api/agents')
                .then(r => r.json())
                .then(data => {
                    if (data.agents?.length) {
                        setAgents(data.agents);
                        setRunnerId(data.agents[0].id);
                    }
                })
                .catch(() => {});
        }
    }, [open]);

    const handleDispatch = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, runnerId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Dispatch failed');
            }
            onDispatched();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Dispatch Run">
            <div className="space-y-5">
                <div>
                    <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">Task</p>
                    <div className="glass-card rounded-lg p-3 border border-surface-800/50">
                        <span className="text-xs font-mono text-brand-400 bg-brand-950/50 px-1.5 py-0.5 rounded mr-2">{taskId}</span>
                        <span className="text-sm text-surface-200">{taskTitle}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider mb-1.5">
                        Runner
                    </label>
                    <select
                        className="select"
                        value={runnerId}
                        onChange={e => setRunnerId(e.target.value)}
                    >
                        {agents.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.id} — {a.role}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-surface-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDispatch}
                        disabled={loading}
                        className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-5 rounded-md transition-colors shadow-[0_0_15px_rgba(92,129,163,0.3)] flex items-center gap-2 text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Start Run
                    </button>
                </div>
            </div>
        </Modal>
    );
}
