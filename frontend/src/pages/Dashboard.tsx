import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { PlaybookModal } from '../components/PlaybookModal';
import { NewTaskModal } from '../components/NewTaskModal';
import { TaskCard } from '../components/TaskCard';
import { CheckCircle2, Clock, Inbox, CircleDashed, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { TaskType, UserRole } from '../types';

const COLUMNS: { id: string; title: string; icon: React.ReactNode }[] = [
  { id: 'TODO',        title: 'To Do',       icon: <Inbox size={16} /> },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: <CircleDashed size={16} color="#60a5fa" /> },
  { id: 'IN_REVIEW',   title: 'In Review',   icon: <Clock size={16} color="var(--color-warning)" /> },
  { id: 'DONE',        title: 'Done',        icon: <CheckCircle2 size={16} color="var(--color-success)" /> },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const fetchTasks = useCallback(async (reset = true, cursor?: number | null) => {
    try {
      if (reset) { setLoading(true); } else { setLoadingMore(true); }
      const url = cursor ? `/tasks?cursor=${cursor}&limit=20` : '/tasks?limit=20';
      const res = await apiFetch(url);
      if (reset) {
        setTasks(res.data);
      } else {
        setTasks(prev => [...prev, ...res.data]);
      }
      setNextCursor(res.nextCursor ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getColTasks = (status: string) => tasks.filter(t => t.status === status);
  const userRole = (user?.role ?? 'USER') as UserRole;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
      Loading board...
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>Task Board</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}{nextCursor ? '+' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => fetchTasks()} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button
            id="new-task-btn"
            className="btn btn-primary"
            onClick={() => setShowNewTaskModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={17} /> New Task
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', flex: 1, minHeight: 0 }}>
        {COLUMNS.map(col => {
          const colTasks = getColTasks(col.id);
          return (
            <div
              key={col.id}
              style={{
                display: 'flex', flexDirection: 'column',
                background: 'hsla(222,47%,12%,0.7)',
                border: '1px solid hsla(210,40%,98%,0.06)',
                borderRadius: '14px', padding: '14px', overflow: 'hidden'
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid hsla(210,40%,98%,0.05)' }}>
                {col.icon}
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{col.title}</span>
                <span style={{ marginLeft: 'auto', background: 'hsla(0,0%,100%,0.08)', padding: '1px 8px', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 12px', color: 'var(--color-text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      userRole={userRole}
                      onClick={() => setSelectedTaskId(task.id)}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {nextCursor && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => fetchTasks(false, nextCursor)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal
          userRole={userRole}
          onClose={() => setShowNewTaskModal(false)}
          onCreated={() => fetchTasks()}
        />
      )}

      {selectedTaskId && (
        <PlaybookModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onStatusUpdated={() => fetchTasks()}
          onDeleted={() => fetchTasks()}
        />
      )}
    </div>
  );
};
