import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store';
import { Button, Input, Card } from '../components/Common';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [forgotData, setForgotData] = useState({ email: '', firstName: '', lastName: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotData((prev) => ({ ...prev, [name]: value }));
    setForgotError('');
    setForgotSuccess('');
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
      setToken(response.data.token);
      setUser(response.data.user);
      if (response.data.user?.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotData.email || !forgotData.firstName || !forgotData.lastName) {
      setForgotError('Email, first name, and last name are required');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await authService.forgotPassword(forgotData);
      setForgotSuccess(response.data.message || 'Temporary password sent to your email');
      setForgotError('');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to process forgot password request');
      setForgotSuccess('');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <img src="/image001.png" alt="College background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-blue-900/30 to-purple-900/40" />
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center -mt-2 mb-3">
            <div className="w-24 h-24 rounded-full bg-white/95 shadow-xl flex items-center justify-center border-2 border-white">
              <img src="/DU Logo.png" alt="Dhofar University Logo" className="w-20 h-20 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">College of Medicine</h1>
          <p className="text-gray-800 mt-2 text-base font-semibold tracking-wide">Sign in to your account</p>
        </div>

        {/* Form */}
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

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword((prev) => !prev);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="w-full text-sm text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              {showForgotPassword ? 'Hide Forgot Password' : 'Forgot Password?'}
            </button>
        </form>

        {showForgotPassword && (
          <form onSubmit={handleForgotPassword} className="mt-5 space-y-4 bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-teal-700">Verification for Password Reset</p>

              {forgotError && (
                <div className="bg-red-50 border border-red-200 p-2.5 text-red-600 text-xs rounded-lg">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 p-2.5 text-green-700 text-xs rounded-lg">
                  {forgotSuccess}
                </div>
              )}

              <input
                type="email"
                name="email"
                placeholder="Registered email"
                value={forgotData.email}
                onChange={handleForgotChange}
                className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={forgotData.firstName}
                  onChange={handleForgotChange}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={forgotData.lastName}
                  onChange={handleForgotChange}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
              >
                {forgotLoading ? 'Sending...' : 'Verify and Send Password'}
              </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-teal-500 hover:text-teal-700 font-semibold transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register(formData);
      setError('');
      setSuccess(response.data.message || 'Registration complete. Your account is pending administrator approval.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/20 rounded-lg mb-3">
            <span className="text-lg font-bold text-secondary">CA</span>
          </div>
          <h3 className="text-2xl font-bold text-dark mb-2">Create Account</h3>
          <p className="text-gray-600">Join COM Question Bank</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 text-green-700 text-sm rounded">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="your@medical.edu"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div>
            <label className="text-sm font-semibold text-dark mb-2 block">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Administrator, Super Admin, and Reviewer accounts are created by Administrator/Super Admin
            </p>
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-gray-600 text-sm mb-3">
            Already have an account?
          </p>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.changePassword(formData);
      setSuccess(response.data.message || 'Password updated successfully');
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/20 rounded-lg mb-3">
            <span className="text-lg font-bold text-secondary">CP</span>
          </div>
          <h3 className="text-2xl font-bold text-dark mb-2">Change Password</h3>
          <p className="text-gray-600">Keep your account secure</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 text-green-700 text-sm rounded">
              {success}
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            name="currentPassword"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />

          <Input
            label="New Password"
            type="password"
            name="newPassword"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Update Password
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};
