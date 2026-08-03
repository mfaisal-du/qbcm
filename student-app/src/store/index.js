import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('student_user')) || null,
  token: localStorage.getItem('student_token') || null,

  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('student_user', JSON.stringify(user));
  },

  setToken: (token) => {
    set({ token });
    if (token) localStorage.setItem('student_token', token);
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
  },

  isAuthenticated: () => !!useAuthStore.getState().token,

  isStudent: () => {
    const { user } = useAuthStore.getState();
    return user?.role === 'student';
  }
}));
