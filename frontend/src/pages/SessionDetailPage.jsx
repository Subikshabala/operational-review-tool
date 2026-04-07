import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const STATUS_COLORS = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', pending: '#94a3b8' };
const STATUS_BG = { green: '#f0fdf4', yellow: '#fffbeb', red: '#fef2f2', pending: '#f8fafc' };

export default function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isFaculty = useAuthStore((s) => s.isFaculty());

  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [localValues, setLocalValues] = useState({});
  const [saving, setSaving] = useState({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [sessionRes, membersRes] = await Promise.all([
        api.get(`/sessions/${id}`),
        api.get('/members'),
      ]);
      const { session: s, entries: e, tasks: t } = sessionRes.data;
      setSession(s);
      setEntries(e);
      setTasks(t);
      setMembers(membersRes.data.members);

      // Pre-populate local values from saved entries (don't overwrite unsaved edits on refresh)
      setLocalValues((prev) => {
        const vals = { ...prev };
        e.forEach((entry) => {
          // Only set if not already being edited
          if (vals[entry.review_item_id] === undefined) {
            vals[entry.review_item_id] = {
              actual_value: entry.actual_value !== null ? String(entry.actual_value) : '',
              observation: entry.observation ?? '',
            };
          }
        });
        return vals;
      });
    } catch (err) {
      setError('Failed to load session. Please refresh.');
      console.error('fetchAll error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleValueChange = (itemId, field, value) => {
    setLocalValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const saveEntry = async (item) => {
    const vals = localValues[item.review_item_id] || {};
    setSaving((p) => ({ ...p, [item.review_item_id]: true }));
    try {
      await api.put(`/sessions/${id}/entries`, {
        review_item_id: item.review_item_id,
        actual_value: vals.actual_value !== '' ? vals.actual_value : null,
        observation: vals.observation || '',
      });
      // Refresh only entries (not the full page) to avoid losing other unsaved edits
      const res = await api.get(`/sessions/${id}`);
      const { session: s, entries: e, tasks: t } = res.data;
      setSession(s);
      setEntries(e);
      setTasks(t);
      // Update only the saved entry's localValue to reflect confirmed server state
      const saved = e.find((en) => en.review_item_id === item.review_item_id);
      if (saved) {
        setLocalValues((prev) => ({
          ...prev,
          [item.review_item_id]: {
            actual_value: saved.actual_value !== null ? String(saved.actual_value) : '',
            observation: saved.observation ?? '',
          },
        }));
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving entry');
    } finally {
      setSaving((p) => ({ ...p, [item.review_item_id]: false }));
    }
  };

  const handleSubmitSession = async () => {
    if (!window.confirm('Submit this session? It will be locked and cannot be edited.')) return;
    try {
      await api.post(`/sessions/${id}/submit`);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting session');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...taskForm, session_id: id });
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating task');
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading session...</div>;
  if (error)   return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center' }}>⚠️ {error}<br /><button onClick={fetchAll} style={{ marginTop: 12, padding: '8px 16px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Retry</button></div>;
  if (!session) return <div style={{ padding: 40, color: '#64748b' }}>Session not found</div>;

  const isSubmitted = session.status === 'submitted';
  const grouped = entries.reduce((acc, e) => {
    const cat = e.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate('/sessions')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, marginBottom: 8 }}>
            ← Back to Sessions
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f' }}>{session.title}</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {new Date(session.period_start).toLocaleDateString('en-IN')} –{' '}
            {new Date(session.period_end).toLocaleDateString('en-IN')}
            {' · '}
            <span style={{
              padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: isSubmitted ? '#d1fae5' : '#fef3c7',
              color: isSubmitted ? '#065f46' : '#92400e',
            }}>
              {isSubmitted ? '✅ Submitted' : '📝 Draft'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isFaculty && (
            <button onClick={() => setShowTaskForm(true)} style={btnSecondary}>+ Create Task</button>
          )}
          {isFaculty && !isSubmitted && (
            <button onClick={handleSubmitSession} style={btnGreen}>Submit Session ✓</button>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: 16, color: '#1e3a5f' }}>✅ New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div style={fieldGroup}>
                <label style={label}>Task Title *</label>
                <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} required style={input} placeholder="e.g. Follow up on low attendance in CSE" />
              </div>
              <div style={fieldGroup}>
                <label style={label}>Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                <div style={fieldGroup}>
                  <label style={label}>Assign To</label>
                  <select value={taskForm.assigned_to} onChange={(e) => setTaskForm((f) => ({ ...f, assigned_to: e.target.value }))} style={input}>
                    <option value="">— Unassigned —</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} style={input}>
                    {['low','medium','high','critical'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Due Date</label>
                  <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))} style={input} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowTaskForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnPrimary}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics by Department */}
      {Object.keys(grouped).sort().map((cat) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 12 }}>🏢 {cat}</h3>
          {grouped[cat].map((entry) => {
            const localVal = localValues[entry.review_item_id] || { actual_value: '', observation: '' };
            const status = entry.status || 'pending';
            return (
              <div key={entry.review_item_id} style={{
                background: STATUS_BG[status],
                border: `1px solid ${STATUS_COLORS[status]}30`,
                borderLeft: `4px solid ${STATUS_COLORS[status]}`,
                borderRadius: 10, padding: 16, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Target: <strong>{entry.target_value} {entry.unit}</strong>
                      {' · '}{entry.metric_type === 'lower_better' ? '↓ Lower is better' : '↑ Higher is better'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                      background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status],
                    }}>
                      {status === 'green' ? '🟢 On Track' : status === 'yellow' ? '🟡 At Risk' : status === 'red' ? '🔴 Critical' : '⏳ Pending'}
                    </span>
                  </div>
                </div>

                {/* Input row */}
                {!isSubmitted && isFaculty ? (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>
                        Actual Value ({entry.unit || 'value'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={localVal.actual_value}
                        onChange={(e) => handleValueChange(entry.review_item_id, 'actual_value', e.target.value)}
                        placeholder={`Target: ${entry.target_value}`}
                        style={{ ...input, width: 140 }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>
                        Observation / Notes
                      </label>
                      <input
                        value={localVal.observation}
                        onChange={(e) => handleValueChange(entry.review_item_id, 'observation', e.target.value)}
                        placeholder="What did you observe this period?"
                        style={{ ...input, width: '100%' }}
                      />
                    </div>
                    <button
                      onClick={() => saveEntry(entry)}
                      disabled={saving[entry.review_item_id]}
                      style={{ ...btnPrimary, padding: '8px 14px', fontSize: 13 }}
                    >
                      {saving[entry.review_item_id] ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#475569' }}>
                    <strong>Actual: </strong>{entry.actual_value ?? '—'} {entry.unit}
                    {entry.observation && <span style={{ marginLeft: 16, color: '#64748b' }}>💬 {entry.observation}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: 'white', borderRadius: 12 }}>
          No performance metrics found. <a href="/metrics" style={{ color: '#3b82f6' }}>Add metrics first →</a>
        </div>
      )}

      {/* Tasks linked to this session */}
      {tasks.length > 0 && (
        <div style={{ marginTop: 24, background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 14 }}>✅ Tasks from this Session</h3>
          {tasks.map((task) => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'resolved';
            return (
              <div key={task.id} style={{
                padding: '10px 14px', marginBottom: 8,
                background: isOverdue ? '#fef2f2' : '#f8fafc',
                borderRadius: 8,
                borderLeft: `3px solid ${task.status === 'resolved' ? '#10b981' : task.priority === 'critical' ? '#dc2626' : task.priority === 'high' ? '#f59e0b' : '#3b82f6'}`,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  👤 {task.assigned_to_name || 'Unassigned'}
                  {' · '}
                  <span style={{ textTransform: 'capitalize' }}>{task.status.replace('_', ' ')}</span>
                  {task.due_date && <span style={{ marginLeft: 8 }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</span>}
                  {isOverdue && <span style={{ marginLeft: 6, color: '#dc2626' }}>⚠ Overdue</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btnPrimary = { padding: '9px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const btnSecondary = { padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const btnGreen = { padding: '9px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 };
const modal = { background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' };
const fieldGroup = { display: 'flex', flexDirection: 'column', marginBottom: 12 };
const label = { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 };
const input = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' };
