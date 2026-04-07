import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, BookOpen, Zap, X } from 'lucide-react';
import type { PlaybookFull, TaskStatus } from '../types';

const TRIGGER_STATES: { value: TaskStatus; label: string }[] = [
  { value: 'TODO',        label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW',   label: 'In Review' },
  { value: 'DONE',        label: 'Done' },
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  TODO:        'var(--color-text-muted)',
  IN_PROGRESS: '#60a5fa',
  IN_REVIEW:   'var(--color-warning)',
  DONE:        'var(--color-success)',
};

export const Playbooks = () => {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<PlaybookFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [triggerState, setTriggerState] = useState<TaskStatus>('IN_PROGRESS');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Always call hooks before any conditional return
  const isAllowed = user && user.role !== 'USER';

  useEffect(() => {
    if (!isAllowed) return;
    setLoading(true);
    apiFetch('/playbooks')
      .then(res => setPlaybooks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAllowed]);

  if (!user || user.role === 'USER') return <Navigate to="/" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentMarkdown.trim() || !webhookUrl.trim()) {
      setFormError('All fields are required');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await apiFetch('/playbooks', {
        method: 'POST',
        body: JSON.stringify({ title, contentMarkdown, webhookUrl, triggerState }),
      });
      setTitle(''); setContentMarkdown(''); setWebhookUrl(''); setTriggerState('IN_PROGRESS');
      setShowForm(false);
      apiFetch('/playbooks').then(res => setPlaybooks(res.data)).catch(console.error);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create playbook');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete playbook "${name}"?`)) return;
    try {
      await apiFetch(`/playbooks/${id}`, { method: 'DELETE' });
      setPlaybooks(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--color-primary)" /> Playbooks
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            SOPs attached to tasks. Webhooks fire when a task reaches the trigger state.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          <Plus size={17} /> New Playbook
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : playbooks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'hsla(222,47%,12%,0.5)', borderRadius: '16px',
          border: '1px dashed hsla(210,40%,98%,0.1)',
        }}>
          <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '8px' }}>No playbooks yet</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', opacity: 0.6 }}>Create one and attach it when creating tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {playbooks.map(pb => (
            <div key={pb.id} className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{pb.title}</h3>
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(pb.id, pb.title)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', borderRadius: '4px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                color: STATUS_COLOR[pb.triggerState], background: 'hsla(0,0%,100%,0.06)',
                marginBottom: '14px',
              }}>
                <Zap size={11} /> Fires on: {pb.triggerState.replace('_', ' ')}
              </span>

              <div style={{
                background: 'hsla(210,40%,98%,0.03)', borderRadius: '8px',
                padding: '10px 12px', fontSize: '0.78rem', color: 'var(--color-text-muted)',
                maxHeight: '72px', overflow: 'hidden', lineHeight: 1.6, marginBottom: '10px',
              }}>
                {pb.contentMarkdown.slice(0, 180)}{pb.contentMarkdown.length > 180 ? '…' : ''}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', opacity: 0.6, fontFamily: 'monospace' }}>
                {pb.webhookUrl.length > 45 ? pb.webhookUrl.slice(0, 45) + '…' : pb.webhookUrl}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="glass-panel animate-in"
            onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: '580px', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>New Playbook</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="field-group">
                <label className="field-label">Title *</label>
                <input className="input" type="text" placeholder="e.g. Database Migration SOP" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
              </div>

              <div className="field-group">
                <label className="field-label">Trigger State *</label>
                <select className="input" value={triggerState} onChange={e => setTriggerState(e.target.value as TaskStatus)}>
                  {TRIGGER_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Webhook URL * <span style={{ opacity: 0.5, fontSize: '0.78rem', fontWeight: 400 }}>(POST called on trigger)</span></label>
                <input className="input" type="text" placeholder="https://hooks.example.com/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
              </div>

              <div className="field-group">
                <label className="field-label">Content (Markdown) *</label>
                <textarea
                  className="input"
                  rows={6}
                  placeholder={"# SOP Title\n\n## Steps\n1. First step\n2. Second step"}
                  value={contentMarkdown}
                  onChange={e => setContentMarkdown(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
              </div>

              {formError && (
                <div style={{ padding: '10px 14px', background: 'hsla(0,80%,50%,0.12)', border: '1px solid hsla(0,80%,50%,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Plus size={16} /> {submitting ? 'Creating…' : 'Create Playbook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
