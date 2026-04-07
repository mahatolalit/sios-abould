import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, CheckCircle, Clock, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { TaskType } from '../types';

interface PlaybookModalProps {
  taskId: number;
  onClose: () => void;
  onStatusUpdated: () => void;
  onDeleted?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'var(--color-text-muted)',
  IN_PROGRESS: '#60a5fa',
  IN_REVIEW: 'var(--color-warning)',
  DONE: 'var(--color-success)',
};

export const PlaybookModal = ({ taskId, onClose, onStatusUpdated, onDeleted }: PlaybookModalProps) => {
  const [task, setTask] = useState<TaskType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const { user } = useAuth();

  const fetchTaskDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/tasks/${taskId}`);
      setTask(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStatusChange = async (newStatus: string) => {
    setActionError('');
    try {
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTaskDetails();
      onStatusUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error changing status');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task?.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
      onDeleted?.();
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error deleting task');
    }
  };

  if (loading) return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ padding: '32px', color: 'var(--color-text-muted)' }}>Loading...</div>
    </div>
  );

  if (error || !task) return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ padding: '24px', maxWidth: '400px' }}>
        <p style={{ color: '#f87171', marginBottom: '16px' }}>{error || 'Task not found'}</p>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  const statusColor = STATUS_COLORS[task.status] ?? 'white';
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel animate-in"
        onClick={e => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '820px', height: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid hsla(210,40%,98%,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', lineHeight: 1.3 }}>{task.title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span style={{ color: statusColor, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                ● {task.status.replace('_', ' ')}
              </span>
              {task.creator && <span>By: <strong style={{ color: 'white' }}>{task.creator.email}</strong></span>}
              {task.assignee && <span>→ <strong style={{ color: '#60a5fa' }}>{task.assignee.email}</strong></span>}
              <span>#{task.id}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canManage && (
              <button
                onClick={handleDelete}
                className="btn btn-ghost"
                style={{ color: '#f87171', padding: '8px' }}
                title="Delete task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 0 }}>
          {/* Left: description + playbook */}
          <div style={{ flex: 2, padding: '24px 28px', borderRight: '1px solid hsla(210,40%,98%,0.06)' }}>
            <section style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px' }}>Description</h3>
              <p style={{ color: task.description ? 'var(--color-text-main)' : 'var(--color-text-muted)', lineHeight: 1.7, opacity: task.description ? 1 : 0.5 }}>
                {task.description || 'No description provided.'}
              </p>
            </section>

            <section>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} color="var(--color-primary)" /> Actionable Playbook
              </h3>
              {task.playbook ? (
                <div style={{ background: 'hsla(210,40%,98%,0.03)', padding: '20px', borderRadius: '10px', border: '1px solid hsla(210,40%,98%,0.06)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                  <ReactMarkdown>{(task.playbook as { contentMarkdown?: string }).contentMarkdown || ''}</ReactMarkdown>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'hsla(210,40%,98%,0.02)', borderRadius: '10px', opacity: 0.6 }}>
                  No SOP Playbook attached
                </div>
              )}
            </section>
          </div>

          {/* Right: actions */}
          <div style={{ width: '220px', minWidth: '220px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              Transitions
            </h3>

            {task.status === 'TODO' && (
              <button className="btn" style={{ background: '#3b82f6', color: 'white', justifyContent: 'flex-start', gap: '8px' }} onClick={() => handleStatusChange('IN_PROGRESS')}>
                <Clock size={15} /> Start Work
              </button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <>
                <button className="btn" style={{ background: 'var(--color-warning)', color: 'black', justifyContent: 'flex-start', gap: '8px' }} onClick={() => handleStatusChange('IN_REVIEW')}>
                  <CheckCircle size={15} /> Submit for Review
                </button>
                {canManage && (
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '8px' }} onClick={() => handleStatusChange('TODO')}>
                    <RotateCcw size={15} /> Reset to To-Do
                  </button>
                )}
              </>
            )}

            {task.status === 'IN_REVIEW' && canManage && (
              <>
                <button className="btn btn-primary" style={{ justifyContent: 'flex-start', gap: '8px' }} onClick={() => handleStatusChange('DONE')}>
                  <CheckCircle size={15} /> Approve & Done
                </button>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '8px' }} onClick={() => handleStatusChange('IN_PROGRESS')}>
                  <RotateCcw size={15} /> Send Back
                </button>
              </>
            )}

            {task.status === 'DONE' && (
              <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Completed
              </div>
            )}

            {actionError && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'hsla(0,80%,50%,0.12)', border: '1px solid hsla(0,80%,50%,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem' }}>
                {actionError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
