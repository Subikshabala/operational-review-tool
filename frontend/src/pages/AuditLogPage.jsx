import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ACTION_COLORS = {
  LOGIN: '#3b82f6', REGISTER_COLLEGE: '#8b5cf6',
  CREATE_METRIC: '#10b981', UPDATE_METRIC: '#f59e0b', DELETE_METRIC: '#ef4444',
  CREATE_SESSION: '#10b981', SUBMIT_SESSION: '#8b5cf6',
  CREATE_TASK: '#10b981', UPDATE_TASK: '#f59e0b',
  ADD_MEMBER: '#10b981', REMOVE_MEMBER: '#ef4444', UPDATE_MEMBER: '#f59e0b',
  BULK_UPLOAD_STUDENTS: '#8b5cf6',
};

const ACTION_ICONS = {
  LOGIN: '🔑', REGISTER_COLLEGE: '🏫',
  CREATE_METRIC: '📊', UPDATE_METRIC: '📝', DELETE_METRIC: '🗑️',
  CREATE_SESSION: '📅', SUBMIT_SESSION: '🔒',
  CREATE_TASK: '✅', UPDATE_TASK: '🔄',
  ADD_MEMBER: '👤', REMOVE_MEMBER: '🚫', UPDATE_MEMBER: '✏️',
  BULK_UPLOAD_STUDENTS: '📤',
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

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading activity feed...</div>;
  if (error)   return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center' }}>⚠️ {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f', letterSpacing: '-0.02em' }}>🔍 Activity Audit Feed</h1>
        <p style={{ color: '#64748b', fontSize: 15, marginTop: 4 }}>
          A secure, immutable record of all institutional actions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {logs.map((log, idx) => {
          const color = ACTION_COLORS[log.action] || '#64748b';
          const icon = ACTION_ICONS[log.action] || '⚡';
          
          return (
            <div 
              key={log.id} 
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            >
              {/* Vertical line indicator */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color }} />
              
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: `${color}10`, display: 'flex', 
                alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0
              }}>
                {icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {log.new_values && (
                  <div style={{ 
                    marginTop: 10, padding: '10px 14px', background: '#f8fafc', 
                    borderRadius: 8, fontSize: 12, color: '#475569', border: '1px dotted #e2e8f0' 
                  }}>
                    {log.action === 'BULK_CREATE_TASK' || log.action === 'CREATE_TASK' ? (
                      <div>
                        <strong>Task:</strong> {log.new_values.title} 
                        {log.new_values.count > 1 && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 600 }}>(Targeted {log.new_values.count} users)</span>}
                        {log.new_values.filters && (
                          <div style={{ marginTop: 4, color: '#64748b', fontSize: 11 }}>
                            Filters: {log.new_values.filters.role_names?.join(', ') || 'All Roles'} 
                            {' in '} 
                            {log.new_values.filters.department_names?.join(', ') || 'All Depts'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {JSON.stringify(log.new_values, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    <span style={{ color: '#94a3b8' }}>User:</span> 
                    <strong style={{ color: '#334155' }}>{log.user_name || 'System'}</strong>
                  </div>
                  <span style={{ color: '#e2e8f0' }}>•</span>
                  <div style={{ 
                    fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 
                  }}>
                    <span style={{ color: '#94a3b8' }}>Event:</span> 
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 6, background: '#f8fafc', 
                      fontSize: 11, fontWeight: 600, color: '#64748b', border: '1px solid #e2e8f0' 
                    }}>
                      {log.table_name || 'general'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div style={{ 
            textAlign: 'center', padding: 80, color: '#94a3b8', 
            background: 'white', borderRadius: 20, border: '2px dashed #e2e8f0' 
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
            <div style={{ fontWeight: 600 }}>No activity recorded yet</div>
            <p style={{ fontSize: 14, marginTop: 4 }}>System events will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
