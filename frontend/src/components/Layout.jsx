import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/sessions',  icon: '📋', label: 'Review Sessions' },
  { to: '/metrics',   icon: '📈', label: 'Performance Metrics' },
  { to: '/tasks',     icon: '✅', label: 'Tasks' },
  { to: '/members',   icon: '👥', label: 'Faculty & Staff' },
  { to: '/audit-log', icon: '🔍', label: 'Audit Log' },
];

const ROLE_COLORS = {
  admin:   { bg: '#fef3c7', text: '#92400e', label: 'Admin' },
  hod:     { bg: '#dbeafe', text: '#1e40af', label: 'HOD' },
  faculty: { bg: '#d1fae5', text: '#065f46', label: 'Faculty' },
  student: { bg: '#ede9fe', text: '#5b21b6', label: 'Student' },
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2444 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🎓</span>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>College Review</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{user?.college_name}</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16 }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {!collapsed && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{user?.department || user?.email}</div>
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 600,
                background: roleStyle.bg,
                color: roleStyle.text,
              }}>
                {roleStyle.label}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: 'white',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {collapsed ? '🚪' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
