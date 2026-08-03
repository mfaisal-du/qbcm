import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () => set((state) => {
    const next = !state.darkMode;
    localStorage.setItem('darkMode', next);
    return { darkMode: next };
  }),
}));

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('token', token);
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginContext');
  },

  isAuthenticated: () => {
    const state = useAuthStore.getState();
    return !!state.token;
  },

  hasRole: (role) => {
    const state = useAuthStore.getState();
    const normalizedRole = state.user?.role === 'admin' ? 'administrator' : state.user?.role;
    return normalizedRole === role || normalizedRole === 'super_admin';
  },

  hasAnyRole: (roles) => {
    const state = useAuthStore.getState();
    const normalizedRole = state.user?.role === 'admin' ? 'administrator' : state.user?.role;
    return normalizedRole === 'super_admin' || roles.includes(normalizedRole);
  }
}));

export const useQuestionStore = create((set) => ({
  questions: [],
  currentQuestion: null,
  filters: {},
  isLoading: false,

  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setFilters: (filters) => set({ filters }),
  setLoading: (isLoading) => set({ isLoading })
}));

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));

    if (notification.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      }, notification.duration || 3000);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));
