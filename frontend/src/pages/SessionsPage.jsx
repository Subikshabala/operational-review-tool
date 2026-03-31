import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const SESSION_TYPES = ['monthly', 'weekly', 'quarterly', 'semesterly', 'annual'];

const defaultForm = {
  title: '', session_type: 'monthly',
  period_start: '', period_end: '', session_date: '', notes: ''
};

const STATUS_COLORS = {
  draft:     { bg: '#fef3c7', text: '#92400e', label: '📝 Draft' },
  submitted: { bg: '#d1fae5', text: '#065f46', label: '✅ Submitted' },
  approved:  { bg: '#dbeafe', text: '#1e40af', label: '🏆 Approved' },
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const isFaculty = useAuthStore((s) => s.isFaculty());

  const fetchSessions = async () => {
    try {
      const r = await api.get('/sessions');
      setSessions(r.data.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setPageLoading(false);
    }
  };
  useEffect(() => { fetchSessions(); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/sessions', form);
      setShowForm(false);
      setForm(defaultForm);
      navigate(`/sessions/${res.data.session.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating session');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScore = (s) => {
    const total = parseInt(s.total_entries) || 0;
    if (total === 0) return null;
    const green = parseInt(s.green_count) || 0;
    return Math.round((green / total) * 100);
  };

  if (pageLoading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading sessions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>📋 Review Sessions</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            Monthly / Semesterly academic performance reviews
          </p>
        </div>
        {isFaculty && (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            + New Session
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: 20, color: '#1e3a5f' }}>📋 New Review Session</h2>
            <form onSubmit={handleSubmit}>
              <div style={fieldGroup}>
                <label style={label}>Session Title *</label>
                <input value={form.title} onChange={setField('title')} placeholder="e.g. Monthly Academic Review - March 2026" required style={input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '14px 0' }}>
                <div style={fieldGroup}>
                  <label style={label}>Session Type</label>
                  <select value={form.session_type} onChange={setField('session_type')} style={input}>
                    {SESSION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Session Date *</label>
                  <input type="date" value={form.session_date} onChange={setField('session_date')} required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Period Start *</label>
                  <input type="date" value={form.period_start} onChange={setField('period_start')} required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Period End *</label>
                  <input type="date" value={form.period_end} onChange={setField('period_end')} required style={input} />
                </div>
              </div>
              <div style={fieldGroup}>
                <label style={label}>Notes</label>
                <textarea value={form.notes} onChange={setField('notes')} rows={2} placeholder="Focus areas for this review..." style={{ ...input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Creating...' : 'Create Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length > 0 ? (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Session Title', 'Type', 'Period', 'Session Date', 'Health', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const health = getHealthScore(s);
                const statusStyle = STATUS_COLORS[s.status] || STATUS_COLORS.draft;
                return (
                  <tr key={s.id}
                    onClick={() => navigate(`/sessions/${s.id}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{s.title}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b', textTransform: 'capitalize' }}>{s.session_type}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                      {new Date(s.period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(s.period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13 }}>
                      {new Date(s.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {health !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                            <div style={{ width: `${health}%`, height: '100%', borderRadius: 3, background: health >= 80 ? '#10b981' : health >= 60 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{health}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, background: statusStyle.bg, color: statusStyle.text, fontWeight: 500 }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#3b82f6' }}>→ Open</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>No review sessions yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {isFaculty ? 'Click "+ New Session" to start your first review' : 'No sessions created yet'}
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { padding: '9px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const btnSecondary = { padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 };
const modal = { background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto' };
const fieldGroup = { display: 'flex', flexDirection: 'column', marginBottom: 14 };
const label = { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 };
const input = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' };
