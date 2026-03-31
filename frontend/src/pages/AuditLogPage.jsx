import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ACTION_COLORS = {
  LOGIN: '#3b82f6', REGISTER_COLLEGE: '#8b5cf6',
  CREATE_METRIC: '#10b981', UPDATE_METRIC: '#f59e0b', DELETE_METRIC: '#ef4444',
  CREATE_SESSION: '#10b981', SUBMIT_SESSION: '#8b5cf6',
  CREATE_TASK: '#10b981', UPDATE_TASK: '#f59e0b',
  ADD_MEMBER: '#10b981', REMOVE_MEMBER: '#ef4444', UPDATE_MEMBER: '#f59e0b',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/analytics/audit-log?limit=100')
      .then((r) => setLogs(r.data.logs))
      .catch((err) => {
        console.error(err);
        setError('Failed to load audit log. You may not have permission.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading audit log...</div>;
  if (error)   return <div style={{ padding: 40, color: '#dc2626' }}>⚠️ {error}</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>🔍 Audit Log</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
          Immutable record of all actions — {logs.length} entries
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Timestamp', 'User', 'Action', 'Table', 'IP'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>
                  {new Date(log.created_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td style={{ padding: '10px 16px', fontWeight: 500 }}>{log.user_name || '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: `${ACTION_COLORS[log.action] || '#94a3b8'}15`,
                    color: ACTION_COLORS[log.action] || '#64748b',
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: 12 }}>
                  {log.table_name || '—'}
                </td>
                <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 11 }}>
                  {log.ip_address || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            No audit entries yet
          </div>
        )}
      </div>
    </div>
  );
}
