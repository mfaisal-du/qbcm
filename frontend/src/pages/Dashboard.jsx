import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ClipboardList, BarChart3, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store';
import { Card, Button } from '../components/Common';

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect to role-specific dashboard
    const roleRoutes = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      administrator: '/admin/dashboard',
      admin: '/admin/dashboard',
      super_admin: '/super-admin/dashboard',
      reviewer: '/reviewer/dashboard'
    };

    if (roleRoutes[user.role]) {
      navigate(roleRoutes[user.role]);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-dark mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-gray-600 mb-8">Loading your dashboard...</p>
      </div>
    </div>
  );
};

// Role-based Quick Stats Component
export const QuickStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-dark">{stat.value}</p>
            <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
          </Card>
        );
      })}
    </div>
  );
};
