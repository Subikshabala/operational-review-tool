import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: (() => { try { return localStorage.getItem('token'); } catch { return null; } })(),
  loading: false,
  error: null,

  // Load user from token on app start
  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  // Role helpers — College roles
  isAdmin: () => get().user?.role === 'admin',
  isHOD: () => ['admin', 'hod'].includes(get().user?.role),
  isFaculty: () => ['admin', 'hod', 'faculty'].includes(get().user?.role),
  isStudent: () => get().user?.role === 'student',
}));

export default useAuthStore;
