import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { GraduationCap, LayoutDashboard, Target, ClipboardList, LogOut, Menu, X, KeyRound } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'bg-blue-100 text-blue-700' },
  { label: 'Practice', href: '/practice', icon: Target, color: 'bg-green-100 text-green-700' },
  { label: 'My Results', href: '/results', icon: ClipboardList, color: 'bg-purple-100 text-purple-700' },
  { label: 'Change Password', href: '/change-password', icon: KeyRound, color: 'bg-rose-100 text-rose-700' }
];

export default function Navigation() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm tracking-wide">Student Portal</p>
              <p className="text-blue-200 text-xs">COM · Question Bank</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-white text-sm font-semibold leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-blue-200 text-xs mt-0.5 capitalize">Student</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-blue-900/95 backdrop-blur border-t border-white/10 px-4 pb-4 pt-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </span>
              {item.label}
            </Link>
          ))}
          <div className="border-t border-white/10 mt-2 pt-3 flex items-center justify-between">
            <p className="text-blue-200 text-sm">{user?.firstName} {user?.lastName}</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-red-500/30 text-white text-sm rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
