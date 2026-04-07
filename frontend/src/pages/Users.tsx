import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Users as UsersIcon, Shield } from 'lucide-react';
import type { User, UserRole } from '../types';

const roleMeta: Record<UserRole, { color: string; bg: string }> = {
  ADMIN:   { color: '#a78bfa', bg: 'hsla(262,80%,50%,0.15)' },
  MANAGER: { color: '#34d399', bg: 'hsla(160,60%,45%,0.15)' },
  USER:    { color: '#60a5fa', bg: 'hsla(217,80%,55%,0.15)' },
};

export const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Hooks before any early return
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    apiFetch('/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UsersIcon size={24} color="var(--color-primary)" /> Users
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          All registered users in the system.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => {
            const rm = roleMeta[u.role] ?? roleMeta.USER;
            return (
              <div
                key={u.id}
                className="glass-panel"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID #{u.id}</div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  color: rm.color, background: rm.bg,
                }}>
                  <Shield size={10} /> {u.role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
