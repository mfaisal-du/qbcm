import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store';

export const AssessmentsLoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const assessmentsPortalUrl = import.meta.env.VITE_ASSESSMENTS_PORTAL_URL || 'http://localhost:5176/assessments-login';
  const mainPortalOrigin = import.meta.env.VITE_MAIN_PORTAL_ORIGIN || 'http://localhost:5173';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  if (window.location.origin === mainPortalOrigin) {
    window.location.href = assessmentsPortalUrl;
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(formData);
      localStorage.setItem('loginContext', 'assessments');
      setToken(response.data.token);
      setUser(response.data.user);

      if (response.data.user?.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/assessments');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
       <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-100 via-white to-teal-100" />

      <div className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center -mt-2 mb-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              COM
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessments Access</h1>
          <p className="text-gray-800 mt-2 text-base font-semibold tracking-wide">Sign in for the assessments module</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@medical.edu"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #4dd0e1, #00acc1)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            Back to Main Login
          </button>
        </div>
      </div>
    </div>
  );
};
