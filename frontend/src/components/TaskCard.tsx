import type { TaskType, UserRole } from '../types';
import { Trash2, User, BookOpen } from 'lucide-react';

const statusConfig = {
  TODO:        { label: 'To Do',       color: 'var(--color-text-muted)',  bg: 'hsla(210,20%,65%,0.15)' },
  IN_PROGRESS: { label: 'In Progress', color: '#60a5fa',                  bg: 'hsla(217,80%,55%,0.15)' },
  IN_REVIEW:   { label: 'In Review',   color: 'var(--color-warning)',     bg: 'hsla(38,92%,50%,0.15)'  },
  DONE:        { label: 'Done',        color: 'var(--color-success)',     bg: 'hsla(142,70%,45%,0.15)' },
};

interface TaskCardProps {
  task: TaskType;
  userRole: UserRole;
  onClick: () => void;
  onDelete: (id: number) => void;
}

export const TaskCard = ({ task, userRole, onClick, onDelete }: TaskCardProps) => {
  const status = statusConfig[task.status] ?? statusConfig.TODO;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete task "${task.title}"?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className="glass-card"
      style={{ padding: '14px 16px', cursor: 'pointer', position: 'relative' }}
      onClick={onClick}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{task.title}</h4>
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <button
            onClick={handleDelete}
            title="Delete task"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '2px',
              borderRadius: '4px', display: 'flex', transition: 'color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          fontSize: '0.78rem', color: 'var(--color-text-muted)',
          marginBottom: '10px', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '0.72rem' }}>
        <span style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>#{task.id}</span>

        <span style={{
          padding: '2px 7px', borderRadius: '20px',
          color: status.color, background: status.bg, fontWeight: 600,
        }}>
          {status.label}
        </span>

        {task.creator && (
          <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <User size={10} /> {task.creator.email.split('@')[0]}
          </span>
        )}

        {task.assignee && (
          <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '3px' }}>
            → {task.assignee.email.split('@')[0]}
          </span>
        )}

        {task.playbook && (
          <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <BookOpen size={10} /> {task.playbook.title}
          </span>
        )}
      </div>
    </div>
  );
};
