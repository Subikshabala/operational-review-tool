import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({
    collegeName: '', collegeCode: '', adminName: '', email: '', password: ''
  });
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2444 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🏛️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f' }}>Register Your College</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Set up your college's academic review system
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'College Full Name', key: 'collegeName', placeholder: 'Sri Ramakrishna Institute of Technology', type: 'text' },
            { label: 'College Code', key: 'collegeCode', placeholder: 'SRIT', type: 'text' },
            { label: 'Your Full Name (Admin)', key: 'adminName', placeholder: 'Dr. Rajesh Kumar', type: 'text' },
            { label: 'Email Address', key: 'email', placeholder: 'principal@srit.edu', type: 'email' },
            { label: 'Password', key: 'password', placeholder: 'Min 6 characters', type: 'password' },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: 13, color: '#374151' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={setField(field.key)}
                placeholder={field.placeholder}
                required
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none',
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, marginBottom: 14, color: '#dc2626', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {loading ? 'Creating...' : '🏛️ Register College'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: 13 }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
