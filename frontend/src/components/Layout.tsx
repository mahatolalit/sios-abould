import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, BookOpen, LogOut, Shield, Users, Zap } from 'lucide-react';
import type { UserRole } from '../types';

const roleMeta: Record<UserRole, { color: string; bg: string; label: string }> = {
  ADMIN:   { color: '#a78bfa', bg: 'hsla(262, 80%, 50%, 0.2)', label: 'Admin' },
  MANAGER: { color: '#34d399', bg: 'hsla(160, 60%, 45%, 0.2)', label: 'Manager' },
  USER:    { color: '#60a5fa', bg: 'hsla(217, 80%, 55%, 0.2)', label: 'User' },
};

export const Layout = () => {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role as UserRole;
  const rm = roleMeta[role] ?? roleMeta.USER;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        background: 'hsla(222, 47%, 9%, 0.95)',
        borderRight: '1px solid hsla(210, 40%, 98%, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid hsla(210, 40%, 98%, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--color-primary-alpha)', padding: '8px', borderRadius: '10px', color: 'var(--color-primary)' }}>
              <Zap size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.5px' }}>SmartOps</span>
          </div>
          {/* User info */}
          <div style={{ background: 'hsla(210, 40%, 98%, 0.04)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
              borderRadius: '20px', color: rm.color, background: rm.bg,
              display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}>
              <Shield size={10} /> {rm.label}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {(role === 'ADMIN' || role === 'MANAGER') && (
            <NavLink
              to="/playbooks"
              style={({ isActive }) => navLinkStyle(isActive)}
            >
              <BookOpen size={18} /> Playbooks
            </NavLink>
          )}

          {role === 'ADMIN' && (
            <NavLink
              to="/users"
              style={({ isActive }) => navLinkStyle(isActive)}
            >
              <Users size={18} /> Users
            </NavLink>
          )}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid hsla(210, 40%, 98%, 0.06)' }}>
          <button
            className="btn btn-ghost"
            onClick={logout}
            style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', color: 'var(--color-text-muted)' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  );
};

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  transition: 'all 0.15s ease',
  color: isActive ? 'white' : 'var(--color-text-muted)',
  background: isActive ? 'var(--color-primary)' : 'transparent',
  boxShadow: isActive ? '0 4px 12px var(--color-primary-alpha)' : 'none',
});
