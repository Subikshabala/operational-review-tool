import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const LINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={centerStyle}>Loading dashboard...</div>;
  if (!data) return <div style={centerStyle}>Failed to load dashboard</div>;

  const { stats, recentSessions, metricTrends, departmentHealth, priorityTasks } = data;

  // Build trend chart data safely
  const trendData = [];
  if (metricTrends?.length > 0) {
    const dates = metricTrends[0]?.dates || [];
    dates.forEach((date, i) => {
      const point = { date: date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '' };
      metricTrends.forEach((metric) => {
        const val = metric.values?.[i];
        point[metric.name] = val !== null && val !== undefined ? parseFloat(val) : null;
      });
      trendData.push(point);
    });
  }

  // Build dept health chart
  const deptData = (departmentHealth || []).map((d) => ({
    dept: d.department || 'Other',
    healthPct: d.total > 0 ? Math.round((parseInt(d.green) / parseInt(d.total)) * 100) : 0,
    green: parseInt(d.green),
    yellow: parseInt(d.yellow),
    red: parseInt(d.red),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e3a5f' }}>
          🎓 Welcome back,
        </h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          {user?.college_name} — Performance Dashboard
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Metrics', value: stats.active_metrics, icon: '📈', color: '#3b82f6' },
          { label: 'Sessions Done', value: stats.submitted_sessions, icon: '📋', color: '#10b981' },
          { label: 'Open Tasks', value: stats.open_tasks, icon: '✅', color: '#f59e0b' },
          { label: 'Overdue', value: stats.overdue_tasks, icon: '⚠️', color: '#ef4444' },
          { label: 'Members', value: stats.total_members, icon: '👥', color: '#8b5cf6' },
        ].map((card) => (
          <div key={card.label} style={{
            background: 'white', borderRadius: 12, padding: '20px 16px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
            borderTop: `4px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Trend Chart */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>📊 Metric Trends (Last 8 Sessions)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {metricTrends.slice(0, 5).map((m, i) => (
                  <Line key={m.id} type="monotone" dataKey={m.name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2} dot={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStyle}>📊 Submit sessions to see trends</div>
          )}
        </div>

        {/* Department Health */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>🏢 Department Health</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="healthPct" name="On-Track %">
                  {deptData.map((d, i) => (
                    <Cell key={i} fill={d.healthPct >= 80 ? '#10b981' : d.healthPct >= 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStyle}>🏢 No department data yet</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Sessions */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>📋 Recent Review Sessions</h3>
          {recentSessions?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>Session</th>
                  <th style={thStyle}>🟢</th>
                  <th style={thStyle}>🟡</th>
                  <th style={thStyle}>🔴</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.slice(0, 5).map((s) => (
                  <tr key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '8px 4px', fontWeight: 500, color: '#1e3a5f' }}>{s.title}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#10b981' }}>{s.green}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#f59e0b' }}>{s.yellow}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#ef4444' }}>{s.red}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={emptyStyle}>No submitted sessions yet</div>
          )}
        </div>

        {/* Priority Tasks */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>⚡ Priority Tasks</h3>
          {priorityTasks?.length > 0 ? (
            priorityTasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} style={{
                  padding: '10px 12px', marginBottom: 8,
                  background: isOverdue ? '#fef2f2' : '#f8fafc',
                  borderRadius: 8, borderLeft: `3px solid ${
                    task.priority === 'critical' ? '#dc2626' :
                    task.priority === 'high' ? '#f59e0b' : '#3b82f6'
                  }`,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                    👤 {task.assigned_to_name || 'Unassigned'}
                    {task.due_date && (
                      <span style={{ marginLeft: 8, color: isOverdue ? '#dc2626' : '#64748b' }}>
                        📅 {new Date(task.due_date).toLocaleDateString('en-IN')}
                        {isOverdue && ' ⚠ Overdue'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={emptyStyle}>✅ No open tasks</div>
          )}
        </div>
      </div>
    </div>
  );
}

const centerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' };
const cardStyle = { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
const cardTitle = { fontSize: 15, fontWeight: 600, color: '#1e3a5f', marginBottom: 16 };
const thStyle = { textAlign: 'left', padding: '6px 4px', color: '#64748b', fontWeight: 600, fontSize: 12 };
const emptyStyle = { color: '#94a3b8', textAlign: 'center', padding: 30, fontSize: 13 };
