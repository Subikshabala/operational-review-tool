import React, { useEffect, useState } from 'react';
import api from '../services/api';

const COLUMNS = [
  { status: 'open', label: 'Open', icon: '📌', color: '#3b82f6', bg: '#eff6ff' },
  { status: 'in_progress', label: 'In Progress', icon: '🔄', color: '#f59e0b', bg: '#fffbeb' },
  { status: 'resolved', label: 'Resolved', icon: '✅', color: '#10b981', bg: '#f0fdf4' },
];

const PRIORITY_COLORS = {
  critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8'
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const r = await api.get('/tasks');
      setTasks(r.data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setPageLoading(false);
    }
  };
  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating task');
    }
  };

  const byStatus = (status) => tasks.filter((t) => t.status === status);

  if (pageLoading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading tasks...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>✅ Tasks</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
          Track and resolve follow-up tasks from review sessions
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {COLUMNS.map((col) => (
          <div key={col.status} style={{
            padding: '10px 20px', borderRadius: 10,
            background: col.bg, borderTop: `3px solid ${col.color}`,
            fontSize: 13, fontWeight: 600, color: col.color,
          }}>
            {col.icon} {byStatus(col.status).length} {col.label}
          </div>
        ))}
        {tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'resolved').length > 0 && (
          <div style={{ padding: '10px 20px', borderRadius: 10, background: '#fef2f2', borderTop: '3px solid #ef4444', fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
            ⚠️ {tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'resolved').length} Overdue
          </div>
        )}
      </div>

      {/* Kanban Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {COLUMNS.map((col) => (
          <div key={col.status} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, minHeight: 300 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: col.color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              {col.icon} {col.label}
              <span style={{ marginLeft: 'auto', background: col.bg, borderRadius: 10, padding: '1px 8px', fontSize: 12 }}>
                {byStatus(col.status).length}
              </span>
            </div>

            {byStatus(col.status).map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'resolved';
              return (
                <div key={task.id} style={{
                  background: 'white', borderRadius: 10, padding: 14,
                  marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#94a3b8'}`,
                  border: isOverdue ? '1px solid #fecaca' : '1px solid transparent',
                  borderLeftWidth: 3,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 6 }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{task.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                    <span style={{ background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority], padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize', marginRight: 6 }}>
                      {task.priority}
                    </span>
                    {task.assigned_to_name && <span>👤 {task.assigned_to_name}</span>}
                    {task.due_date && (
                      <span style={{ display: 'block', marginTop: 3, color: isOverdue ? '#dc2626' : '#94a3b8' }}>
                        📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
                        {isOverdue && ' ⚠ Overdue'}
                      </span>
                    )}
                    {task.session_title && (
                      <span style={{ display: 'block', marginTop: 3, color: '#94a3b8' }}>
                        📋 {task.session_title}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {task.status === 'open' && (
                      <button onClick={() => updateStatus(task.id, 'in_progress')} style={smallBtn('#f59e0b')}>
                        ▶ Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button onClick={() => updateStatus(task.id, 'resolved')} style={smallBtn('#10b981')}>
                        ✓ Resolve
                      </button>
                    )}
                    {task.status === 'resolved' && (
                      <button onClick={() => updateStatus(task.id, 'open')} style={smallBtn('#64748b')}>
                        ↺ Reopen
                      </button>
                    )}
                    {task.status === 'open' && (
                      <button onClick={() => updateStatus(task.id, 'resolved')} style={smallBtn('#10b981')}>
                        ✓ Quick Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {byStatus(col.status).length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#cbd5e1', fontSize: 13 }}>
                No {col.label.toLowerCase()} tasks
              </div>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div>No tasks yet. Create tasks from a review session.</div>
        </div>
      )}
    </div>
  );
}

const smallBtn = (color) => ({
  padding: '4px 10px', fontSize: 11, fontWeight: 600,
  background: `${color}15`, color: color,
  border: `1px solid ${color}40`, borderRadius: 6, cursor: 'pointer',
});
