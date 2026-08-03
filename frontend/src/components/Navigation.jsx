import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Home, BookOpen, ClipboardList, User, Users, Database, Sun, Moon, KeyRound, GraduationCap, FileText, Target } from 'lucide-react';
import { useAuthStore, useThemeStore } from '../store';
import { useState, useEffect } from 'react';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const normalizedRole = user?.role === 'admin' ? 'administrator' : user?.role;

  const navbarTheme = normalizedRole === 'super_admin'
    ? {
        navBg: 'bg-gradient-to-r from-rose-800 via-rose-700 to-amber-700',
        activeItem: 'bg-white/25 text-white ring-1 ring-white/25',
        inactiveItem: 'text-rose-100 hover:bg-white/15 hover:text-white',
        panel: 'bg-white/15',
        logout: 'bg-white/15 hover:bg-red-700',
        divider: 'border-white/25'
      }
    : {
        navBg: 'bg-gradient-to-r from-primary to-secondary',
        activeItem: 'bg-white/20 text-white',
        inactiveItem: 'text-white/80 hover:bg-white/10',
        panel: 'bg-white/10',
        logout: 'bg-white/10 hover:bg-red-600',
        divider: 'border-white/20'
      };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleNavigationItems = () => {
    if (!user) return [];

    const role = user.role === 'admin' ? 'administrator' : user.role;

    const baseItems = [
      { icon: Home, label: 'Dashboard', href: role === 'student' ? '/student/dashboard' : role === 'faculty' ? '/faculty/dashboard' : role === 'administrator' || role === 'admin' ? '/admin/dashboard' : role === 'super_admin' ? '/super-admin/dashboard' : role === 'reviewer' ? '/reviewer/dashboard' : '/dashboard' },
      { icon: KeyRound, label: 'Change Password', href: '/change-password' }
    ];

    const roleItems = {
      super_admin: [
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: Database, label: 'Question Bank', href: '/admin/questions-bank' },
        { icon: ClipboardList, label: 'Review Queue', href: '/admin/questions' },
        { icon: GraduationCap, label: 'Academic', href: '/admin/academic' }
      ],
      administrator: [
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: Database, label: 'Question Bank', href: '/admin/questions-bank' },
        { icon: ClipboardList, label: 'Review Queue', href: '/admin/questions' },
        { icon: GraduationCap, label: 'Academic', href: '/admin/academic' }
      ],
      faculty: [
        { icon: FileText, label: 'Questions', href: '/faculty/questions' },
        { icon: ClipboardList, label: 'My Contributions', href: '/faculty/contributions' }
      ],
      student: [
        { icon: Target, label: 'Practice', href: '/student/practice' },
        { icon: ClipboardList, label: 'My Results', href: '/student/results' }
      ],
      reviewer: [
        { icon: ClipboardList, label: 'Reviews', href: '/reviewer/reviews' }
      ]
    };

    return [...baseItems, ...(roleItems[role] || [])];
  };

  const getMenuIconColorClasses = (label) => {
    const colors = {
      Dashboard: 'bg-sky-100 text-sky-700',
      Users: 'bg-violet-100 text-violet-700',
      'Question Bank': 'bg-indigo-100 text-indigo-700',
      'Review Queue': 'bg-amber-100 text-amber-700',
      Academic: 'bg-emerald-100 text-emerald-700',
      Questions: 'bg-cyan-100 text-cyan-700',
      'My Contributions': 'bg-fuchsia-100 text-fuchsia-700',
      Practice: 'bg-blue-100 text-blue-700',
      'My Results': 'bg-teal-100 text-teal-700',
      Reviews: 'bg-orange-100 text-orange-700',
      'Change Password': 'bg-rose-100 text-rose-700'
    };

    return colors[label] || 'bg-gray-100 text-gray-700';
  };

  const navItems = getRoleNavigationItems();

  return (
    <nav className={`${navbarTheme.navBg} text-white shadow-lg sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-lg bg-white/20 ring-1 ring-white/25 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </span>
            <span className="text-[18px] font-bold tracking-wide leading-none">COM QB</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? navbarTheme.activeItem
                      : navbarTheme.inactiveItem
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${getMenuIconColorClasses(item.label)}`}>
                    <Icon className="w-[15px] h-[15px]" />
                  </span>
                  <span className="text-sm font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 ${navbarTheme.panel} hover:bg-white/20 rounded-lg transition-all`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 ${navbarTheme.panel} rounded-lg`}>
              <User className="w-4 h-4" />
              <span className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs opacity-75">({user?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 ${navbarTheme.logout} rounded-lg transition-all text-sm`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? navbarTheme.activeItem
                      : navbarTheme.inactiveItem
                  }`}
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${getMenuIconColorClasses(item.label)}`}>
                    <Icon className="w-[15px] h-[15px]" />
                  </span>
                  <span className="text-sm font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
            <div className={`px-4 py-2 text-sm border-t ${navbarTheme.divider}`}>
              {user?.firstName} {user?.lastName} ({user?.role})
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (user.mustChangePassword && location.pathname !== '/change-password') {
      navigate('/change-password');
      return;
    }

    const normalizedRole = user.role === 'admin' ? 'administrator' : user.role;
    const hasRoleAccess = normalizedRole === 'super_admin' || requiredRoles.includes(normalizedRole);

    if (requiredRoles.length > 0 && !hasRoleAccess) {
      navigate('/dashboard');
    }
  }, [token, user, navigate, requiredRoles, location.pathname]);

  if (!token || !user) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  const normalizedRole = user.role === 'admin' ? 'administrator' : user.role;

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <div className="flex items-center justify-center h-screen"><p>Please change your password to continue.</p></div>;
  }

  if (requiredRoles.length > 0 && !(normalizedRole === 'super_admin' || requiredRoles.includes(normalizedRole))) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 text-center max-w-md">
          <p className="text-base font-semibold text-gray-900">Access Denied</p>
          <p className="text-sm text-gray-600 mt-2">Your role does not have access to this area.</p>
        </div>
      </div>
    );
  }

  return children;
};

export const Layout = ({ children }) => {
  const { token } = useAuthStore();
  const { darkMode } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-light dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
      {token && <Navbar />}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};
