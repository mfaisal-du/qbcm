import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { studentAnswerService } from '../services/api';
import { BarChart3, CheckCircle, Target, TrendingUp, ArrowRight, BookOpen, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalAttempts: 0, correctAnswers: 0, accuracy: 0, subjectStats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await studentAnswerService.getMyResults();
        const results = response.data.results || [];
        if (results.length > 0) {
          const correct = results.filter((r) => r.isCorrect).length;
          const accuracy = Math.round((correct / results.length) * 100);

          const subjectMap = {};
          results.forEach((r) => {
            const s = r.subject || 'General';
            if (!subjectMap[s]) subjectMap[s] = { total: 0, correct: 0 };
            subjectMap[s].total++;
            if (r.isCorrect) subjectMap[s].correct++;
          });

          const subjectStats = Object.entries(subjectMap).map(([name, c]) => ({
            name,
            correct: c.correct,
            total: c.total,
            pct: Math.round((c.correct / c.total) * 100)
          }));

          setStats({ totalAttempts: results.length, correctAnswers: correct, accuracy, subjectStats });
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Total Attempts',
      value: stats.totalAttempts,
      sub: 'questions answered',
      icon: <BarChart3 className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-t-4 border-blue-500',
      val: 'text-gray-900'
    },
    {
      label: 'Correct Answers',
      value: stats.correctAnswers,
      sub: `out of ${stats.totalAttempts}`,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-t-4 border-green-500',
      val: 'text-green-700'
    },
    {
      label: 'Accuracy Rate',
      value: `${stats.accuracy}%`,
      sub: 'overall performance',
      icon: <Target className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-t-4 border-purple-500',
      val: 'text-purple-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your practice summary.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {metricCards.map((card) => (
            <div key={card.label} className={`bg-white rounded-2xl shadow-sm ${card.border} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>{card.icon}</div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide text-right">{card.label}</p>
              </div>
              <p className={`text-3xl font-bold ${card.val} tabular-nums`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Subject Performance */}
        {stats.subjectStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Performance by Subject</h2>
            </div>
            <div className="space-y-4">
              {stats.subjectStats.map((subj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">{subj.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        subj.pct >= 80 ? 'bg-green-100 text-green-700' :
                        subj.pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{subj.pct}%</span>
                      <span className="text-xs text-gray-400">{subj.correct}/{subj.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${
                        subj.pct >= 80 ? 'bg-green-500' : subj.pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${subj.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            to="/practice"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-7 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <BookOpen className="w-10 h-10 mb-4 opacity-80" />
            <p className="text-xl font-bold">Start Practice</p>
            <p className="text-blue-200 mt-1 text-sm">Answer faculty-approved questions</p>
            <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm font-medium">
              Practice Now <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/results"
            className="bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-2xl p-7 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <ClipboardList className="w-10 h-10 mb-4 opacity-80" />
            <p className="text-xl font-bold">View Results</p>
            <p className="text-green-200 mt-1 text-sm">See your detailed answer history</p>
            <div className="mt-4 flex items-center gap-2 text-green-100 text-sm font-medium">
              View History <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
