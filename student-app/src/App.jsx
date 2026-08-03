import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PracticePage from './pages/PracticePage';
import ResultsPage from './pages/ResultsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Guard: only authenticated students get in
function ProtectedRoute({ children }) {
  const { token, user } = useAuthStore();

  if (!token || user?.role !== 'student') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Redirect already-logged-in students away from login page
function GuestRoute({ children }) {
  const { token, user } = useAuthStore();
  if (token && user?.role === 'student') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function StudentLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { token, user, logout } = useAuthStore();
  const isLoggedIn = Boolean(token && user?.role === 'student');

  useEffect(() => {
    if (token && (!user || user.role !== 'student')) {
      logout();
    }
  }, [token, user, logout]);

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Protected student routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <Dashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <PracticePage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <ResultsPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <ChangePasswordPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
