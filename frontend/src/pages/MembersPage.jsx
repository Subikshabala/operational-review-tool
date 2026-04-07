import React, { useEffect, useState } from 'react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access – Principal/Director' },
  { value: 'hod', label: 'HOD', desc: 'Head of Department – manage metrics & sessions' },
  { value: 'faculty', label: 'Faculty', desc: 'Fill reviews, create tasks' },
  { value: 'student', label: 'Student', desc: 'View-only access' },
];

const ROLE_COLORS = {
  admin:   { bg: '#fef3c7', text: '#92400e' },
  hod:     { bg: '#dbeafe', text: '#1e40af' },
  faculty: { bg: '#d1fae5', text: '#065f46' },
  student: { bg: '#ede9fe', text: '#5b21b6' },
};

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'MBA', 'MCA', 'Admin', 'Library', 'Sports'];

const defaultForm = { name: '', email: '', password: '', role: 'faculty', department: '', designation: '', roll_no: '' };

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const isHOD = useAuthStore((s) => s.isHOD());
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const currentUser = useAuthStore((s) => s.user);

  const fetchMembers = async () => {
    try {
      const r = await api.get('/members');
      setMembers(r.data.members);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setPageLoading(false);
    }
  };
  useEffect(() => { fetchMembers(); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/members', form);
      setShowForm(false);
      setForm(defaultForm);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await api.delete(`/members/${id}`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error removing member');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    try {
      const res = await api.post('/members/bulk-upload', formData);
      alert(res.data.message);
      setShowBulkModal(false);
      setBulkFile(null);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  const byRole = (role) => members.filter((m) => m.role === role);

  if (pageLoading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>⏳ Loading members...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>👥 Faculty, Staff & Students</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in your college
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAdmin && (
            <button onClick={() => setShowBulkModal(true)} style={btnSecondary}>📂 Bulk Student Upload</button>
          )}
          {isHOD && (
            <button onClick={() => setShowForm(true)} style={btnPrimary}>+ Add Member</button>
          )}
        </div>
      </div>

      {/* Role summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {ROLES.map((role) => {
          const count = byRole(role.value).length;
          const colors = ROLE_COLORS[role.value];
          return (
            <div key={role.value} style={{ background: colors.bg, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{count}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{role.label}</div>
              <div style={{ fontSize: 11, color: colors.text, opacity: 0.8, marginTop: 2 }}>{role.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ marginBottom: 20, color: '#1e3a5f' }}>👤 Add College Member</h2>

            {/* Role guide */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Role Permissions:</div>
              {ROLES.map((r) => (
                <div key={r.value} style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: ROLE_COLORS[r.value].text }}>{r.label}</span>: {r.desc}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={fieldGroup}>
                  <label style={label}>Full Name *</label>
                  <input value={form.name} onChange={setField('name')} placeholder="Dr. Priya Sharma" required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Email *</label>
                  <input type="email" value={form.email} onChange={setField('email')} placeholder="priya@college.edu" required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Password *</label>
                  <input type="password" value={form.password} onChange={setField('password')} placeholder="Min 6 chars" required style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Role *</label>
                  <select value={form.role} onChange={setField('role')} required style={input}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label} – {r.desc}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Department</label>
                  <select value={form.department} onChange={setField('department')} style={input}>
                    <option value="">— Select Department —</option>
                    {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Designation</label>
                  <input value={form.designation} onChange={setField('designation')} placeholder="e.g. Professor, HOD..." style={input} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Roll Number (for students)</label>
                  <input type="number" value={form.roll_no} onChange={setField('roll_no')} placeholder="e.g. 101, 2035" style={input} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimary}>{loading ? 'Adding...' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members by role */}
      {ROLES.map((role) => {
        const roleMembers = byRole(role.value);
        if (roleMembers.length === 0) return null;
        const colors = ROLE_COLORS[role.value];
        return (
          <div key={role.value} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
              {role.label}s ({roleMembers.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {roleMembers.map((member) => (
                <div key={member.id} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: colors.bg, color: colors.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 18, flexShrink: 0,
                    }}>
                      {member.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                        {member.name}
                        {member.id === currentUser?.id && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: 4 }}>You</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{member.email}</div>
                      {member.designation && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{member.designation}</div>
                      )}
                      {member.department && (
                        <div style={{ fontSize: 11, marginTop: 4, color: colors.text, background: colors.bg, display: 'inline-block', padding: '1px 8px', borderRadius: 10 }}>
                          🏢 {member.department} {member.roll_no && `• Roll: ${member.roll_no}`}
                        </div>
                      )}
                    </div>
                  </div>
                  {isHOD && member.id !== currentUser?.id && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {members.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div>No members added yet. Click "+ Add Member" to get started.</div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ color: '#1e3a5f', marginBottom: 16 }}>📂 Bulk Student Upload</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              Upload an Excel/CSV file containing student records. 
              Required columns: <strong>Name, Email, Department</strong>. 
              Optional: <strong>Roll Number, Designation</strong>.
            </p>
            
            <form onSubmit={handleBulkUpload}>
               <div style={{ 
                 border: '2px dashed #cbd5e1', borderRadius: 12, padding: 32, 
                 textAlign: 'center', marginBottom: 24, background: '#f8fafc' 
               }}>
                 <input 
                   type="file" 
                   accept=".xlsx,.xls,.csv" 
                   onChange={(e) => setBulkFile(e.target.files[0])} 
                   required
                   style={{ fontSize: 14 }}
                 />
                 <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                   Max file size: 5MB
                 </div>
               </div>
               
               <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                 <button type="button" onClick={() => setShowBulkModal(false)} style={btnSecondary}>Cancel</button>
                 <button type="submit" disabled={loading || !bulkFile} style={btnPrimary}>
                   {loading ? 'Processing...' : 'Upload & Process'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { padding: '9px 18px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const btnSecondary = { padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 };
const modal = { background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' };
const fieldGroup = { display: 'flex', flexDirection: 'column', marginBottom: 4 };
const label = { fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 };
const input = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' };
