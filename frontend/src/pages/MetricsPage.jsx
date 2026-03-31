import React, { useEffect, useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const CATEGORIES = ['Academics', 'Placements', 'Attendance', 'Examinations', 'Research', 'Sports', 'Infrastructure', 'Other'];
const METRIC_TYPES = [
  { value: 'higher_better', label: 'Higher is Better (e.g. Pass Rate, Placements)' },
  { value: 'lower_better', label: 'Lower is Better (e.g. Dropout Rate, Failures)' },
  { value: 'target_exact', label: 'Hit Exact Target' },
];
const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'semesterly'];

const defaultForm = {
  name: '', category: 'Academics', description: '', target_value: '',
  unit: '', metric_type: 'higher_better', review_frequency: 'monthly',
  warning_threshold: 80, critical_threshold: 60
};

export default function MetricsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const isHOD = useAuthStore((s) => s.isHOD());

  const fetchItems = async () => {
    try {
      const r = await api.get('/metrics');
      setItems(r.data.items);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setPageLoading(false);
    }
  };
  useEffect(() => { fetchItems(); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/metrics/${editId}`, { ...form, is_active: true });
      } else {
        await api.post('/metrics', form);
      }
      await fetchItems();
      setShowForm(false);
      setForm(defaultForm);
      setEditId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving metric');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name, category: item.category || 'Academics',
      description: item.description || '', target_value: item.target_value,
      unit: item.unit || '', metric_type: item.metric_type,
      review_frequency: item.review_frequency,
      warning_threshold: item.warning_threshold,
      critical_threshold: item.critical_threshold,
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this metric? This cannot be undone.')) return;
    try {
      await api.delete(`/metrics/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting metric');
    }
  };

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (pageLoading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading metrics...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>📈 Performance Metrics</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            Define KPIs and targets for each department
          </p>
        </div>
        {isHOD && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }} style={btnPrimary}>
            + New Metric
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: 20, color: '#1e3a5f' }}>
              {editId ? 'Edit Metric' : '📈 New Performance Metric'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={grid2}>
                <div style={fieldGroup}>
                  <label style={label}>Metric Name *</label>
                  <input value={form.name} onChange={setField('name')} placeholder="e.g. Student Pass Rate" required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Department / Category</label>
                  <select value={form.category} onChange={setField('category')} style={input}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Target Value *</label>
                  <input type="number" step="0.01" value={form.target_value} onChange={setField('target_value')} placeholder="e.g. 90" required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Unit</label>
                  <input value={form.unit} onChange={setField('unit')} placeholder="%, count, score..." style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Metric Type</label>
                  <select value={form.metric_type} onChange={setField('metric_type')} style={input}>
                    {METRIC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Review Frequency</label>
                  <select value={form.review_frequency} onChange={setField('review_frequency')} style={input}>
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Warning Threshold (%)</label>
                  <input type="number" value={form.warning_threshold} onChange={setField('warning_threshold')} style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Critical Threshold (%)</label>
                  <input type="number" value={form.critical_threshold} onChange={setField('critical_threshold')} style={input} />
                </div>
              </div>
              <div style={fieldGroup}>
                <label style={label}>Description</label>
                <textarea value={form.description} onChange={setField('description')} rows={2} style={{ ...input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Saving...' : 'Save Metric'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics grouped by dept */}
      {Object.keys(grouped).sort().map((cat) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏢 {cat}
            <span style={{ fontSize: 12, background: '#e2e8f0', borderRadius: 10, padding: '2px 8px' }}>
              {grouped[cat].length} metric{grouped[cat].length !== 1 ? 's' : ''}
            </span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {grouped[cat].map((item) => (
              <div key={item.id} style={{
                background: 'white', borderRadius: 12, padding: 16,
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                opacity: item.is_active ? 1 : 0.5,
                borderLeft: `4px solid ${item.metric_type === 'lower_better' ? '#f59e0b' : '#3b82f6'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Target: <strong>{item.target_value} {item.unit}</strong>
                      {' · '}{item.review_frequency}
                    </div>
                  </div>
                  {!item.is_active && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4 }}>Inactive</span>}
                </div>
                {item.description && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{item.description}</div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f0fdf4', color: '#166534' }}>
                    🟢 ≥{item.warning_threshold}%
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#fffbeb', color: '#92400e' }}>
                    🟡 ≥{item.critical_threshold}%
                  </span>
                </div>
                {isHOD && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => handleEdit(item)} style={{ ...btnSecondary, fontSize: 12, padding: '4px 10px' }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{ ...btnDanger, fontSize: 12, padding: '4px 10px' }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 16 }}>No metrics defined yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {isHOD ? 'Click "+ New Metric" to add your first KPI' : 'Contact your HOD to add metrics'}
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { padding: '9px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const btnSecondary = { padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const btnDanger = { padding: '9px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 };
const modal = { background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'auto' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
const fieldGroup = { display: 'flex', flexDirection: 'column' };
const label = { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 };
const input = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' };
