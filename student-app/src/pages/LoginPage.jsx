import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ email: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleForgotChange = (e) => {
    setForgotData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setForgotError('');
    setForgotSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login(formData);
      const { user, token } = response.data;

      // SECURITY: only allow student role
      if (user?.role !== 'student') {
        setError('Access denied. This portal is for students only.');
        return;
      }

      setToken(token);
      setUser(user);

      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotData.email || !forgotData.firstName || !forgotData.lastName) {
      setForgotError('All fields are required.');
      return;
    }
    setForgotLoading(true);
    try {
      const response = await authService.forgotPassword(forgotData);
      setForgotSuccess(response.data.message || 'Temporary password sent to your email.');
      setForgotError('');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to process request.');
      setForgotSuccess('');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800">
      {/* Background circles decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Portal</h1>
            <p className="text-gray-500 text-sm mt-1">College of Medicine — COM QB</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Students Only
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Student Email</label>
              <input
                type="email"
                name="email"
                placeholder="student@du.edu.om"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 pr-11 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgot((p) => !p); setForgotError(''); setForgotSuccess(''); }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {showForgot ? 'Hide' : 'Forgot Password?'}
            </button>
          </form>

          {/* Forgot Password Form */}
          {showForgot && (
            <form onSubmit={handleForgotPassword} className="mt-5 space-y-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-blue-800">Password Reset Verification</p>

              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{forgotError}</div>
              )}
              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">{forgotSuccess}</div>
              )}

              <input
                type="email"
                name="email"
                placeholder="Registered email"
                value={forgotData.email}
                onChange={handleForgotChange}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={forgotData.firstName}
                  onChange={handleForgotChange}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={forgotData.lastName}
                  onChange={handleForgotChange}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {forgotLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Send Temporary Password'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-5">
          College of Medicine © {new Date().getFullYear()} · Student Portal
        </p>
      </div>
    </div>
  );
}
