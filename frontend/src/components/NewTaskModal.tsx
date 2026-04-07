import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { apiFetch } from '../utils/api';
import type { User, PlaybookSummary } from '../types';

interface NewTaskModalProps {
  onClose: () => void;
  onCreated: () => void;
  userRole: string;
}

export const NewTaskModal = ({ onClose, onCreated, userRole }: NewTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [playbookId, setPlaybookId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookSummary[]>([]);

  const canAssign = userRole === 'ADMIN' || userRole === 'MANAGER';

  useEffect(() => {
    if (canAssign) {
      apiFetch('/users').then(r => setUsers(r.data)).catch(() => {});
      apiFetch('/playbooks').then(r => setPlaybooks(r.data)).catch(() => {});
    }
  }, [canAssign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
          playbookId: playbookId ? parseInt(playbookId) : undefined,
        }),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel animate-in"
        onClick={e => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '520px', padding: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>Create New Task</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Add a task to the board</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Title */}
          <div className="field-group">
            <label className="field-label">Title <span style={{ color: 'var(--color-primary)' }}>*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Fix login bug, Deploy v2.0..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="field-group">
            <label className="field-label">Description <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(optional)</span></label>
            <textarea
              className="input"
              placeholder="What needs to be done?"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical', minHeight: '72px', fontFamily: 'inherit' }}
            />
          </div>

          {/* Assign + Playbook — ADMIN/MANAGER only */}
          {canAssign && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field-group">
                <label className="field-label">Assign To</label>
                <select className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Playbook</label>
                <select className="input" value={playbookId} onChange={e => setPlaybookId(e.target.value)}>
                  <option value="">— None —</option>
                  {playbooks.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '11px 14px', background: 'hsla(0,80%,50%,0.12)',
              border: '1px solid hsla(0,80%,50%,0.25)', borderRadius: '8px',
              color: '#f87171', fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Plus size={16} /> {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
