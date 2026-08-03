import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout, ProtectedRoute } from './components/Navigation';
import { LoginPage, RegisterPage, ChangePasswordPage } from './pages/AuthPages';
import { DashboardHome } from './pages/Dashboard';
import { StudentDashboard, StudentPracticePage, StudentResultsPage } from './pages/StudentPages';
import { FacultyDashboard, FacultyQuestionsPage, FacultyContributionsPage } from './pages/FacultyPages';
import { AdminDashboard, SuperAdminDashboard, AdminUsersPage, AdminQuestionsPage } from './pages/AdminPages';
import { AdminAcademicPage } from './pages/AdminAcademicPage';
import { ReviewerDashboard, ReviewerQuestionsPage } from './pages/ReviewerPages';
import { useAuthStore } from './store';

function App() {
  const { token, user, logout } = useAuthStore();
  const isLoggedIn = Boolean(token && user);

  useEffect(() => {
    if (!token && user) {
      logout();
    }
  }, [token, user, logout]);

  return (
    <Router>
      <Layout>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/practice"
            element={
              <ProtectedRoute requiredRoles={['student']}>
                <StudentPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute requiredRoles={['student']}>
                <StudentResultsPage />
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute requiredRoles={['faculty']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/questions"
            element={
              <ProtectedRoute requiredRoles={['faculty']}>
                <FacultyQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/contributions"
            element={
              <ProtectedRoute requiredRoles={['faculty']}>
                <FacultyContributionsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRoles={['administrator', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute requiredRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRoles={['administrator']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic"
            element={
              <ProtectedRoute requiredRoles={['administrator']}>
                <AdminAcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute requiredRoles={['administrator', 'reviewer']}>
                <ReviewerQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions-bank"
            element={
              <ProtectedRoute requiredRoles={['administrator']}>
                <AdminQuestionsPage />
              </ProtectedRoute>
            }
          />

          {/* Reviewer Routes */}
          <Route
            path="/reviewer/dashboard"
            element={
              <ProtectedRoute requiredRoles={['reviewer']}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/reviews"
            element={
              <ProtectedRoute requiredRoles={['reviewer']}>
                <ReviewerQuestionsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
