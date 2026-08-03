import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { studentAnswerService, assessmentService } from '../services/api';
import { BarChart3, CheckCircle, Target, TrendingUp, ArrowRight, BookOpen, ClipboardList, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function CountUp({ value = 0, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    let frameId;
    let startTs;

    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

function MiniSparkline({ data = [], stroke = '#0ea5e9', fill = 'rgba(14, 165, 233, 0.12)' }) {
  const values = data.length ? data : [0, 0, 0, 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 72;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const area = [`0,${height}`, ...points, `${width},${height}`].join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[72px]" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={area} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressRing({ value = 0, size = 128 }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{pct}%</p>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mastery</p>
      </div>
    </div>
  );
}

function TimelineFeed({ items = [] }) {
  if (!items.length) return <p className="text-sm text-gray-400">No recent activity yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${item.dotClass || 'bg-blue-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
            {item.subtitle && <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>}
          </div>
          {item.time && <span className="text-[11px] text-gray-400 whitespace-nowrap">{item.time}</span>}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ totalAttempts: 0, correctAnswers: 0, accuracy: 0, subjectStats: [], recentActivity: [] });
  const [resultRecords, setResultRecords] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [drilldown, setDrilldown] = useState({ type: '', label: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await studentAnswerService.getMyResults();
        const results = response.data.results || [];
        setResultRecords(results);
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

          const recentActivity = [...results]
            .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0))
            .slice(0, 5)
            .map((r) => ({
              title: `${r.subject || 'General'} • ${r.isCorrect ? 'Correct' : 'Incorrect'}`,
              subtitle: r.questionText ? r.questionText.slice(0, 64) : 'Question attempt recorded',
              time: r.answeredAt ? new Date(r.answeredAt).toLocaleDateString() : '',
              dotClass: r.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
            }));

          setStats({ totalAttempts: results.length, correctAnswers: correct, accuracy, subjectStats, recentActivity });
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    const loadAssessments = async () => {
      try {
        const response = await assessmentService.getAvailableAssessments();
        setAssessments(response.data.data || []);
      } catch (err) {
        console.error('Failed to load assessments', err);
        toast.error('Failed to load assessments');
      } finally {
        setAssessmentsLoading(false);
      }
    };

    load();
    loadAssessments();
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
      value: stats.accuracy,
      suffix: '%',
      sub: 'overall performance',
      icon: <Target className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50',
      border: 'border-t-4 border-purple-500',
      val: 'text-purple-700'
    }
  ];

  const drilldownRecords = (() => {
    if (drilldown.type === 'all') return resultRecords;
    if (drilldown.type === 'correct') return resultRecords.filter((r) => r.isCorrect);
    if (drilldown.type === 'incorrect') return resultRecords.filter((r) => !r.isCorrect);
    if (drilldown.type === 'subject') return resultRecords.filter((r) => (r.subject || 'General') === drilldown.label);
    return [];
  })();

  return (
    <div className="dashboard-canvas min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="dashboard-hero hero-accent mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your practice summary and active assessments.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="insight-chip"><BarChart3 className="w-3.5 h-3.5 text-sky-600" /> {stats.totalAttempts} Attempts</span>
            <span className="insight-chip"><CheckCircle className="w-3.5 h-3.5 text-green-600" /> {stats.correctAnswers} Correct</span>
            <span className="insight-chip"><Target className="w-3.5 h-3.5 text-indigo-600" /> {stats.accuracy}% Accuracy</span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="stagger-in grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {metricCards.map((card) => (
            <div
              key={card.label}
              onClick={() => {
                if (card.label === 'Total Attempts') setDrilldown({ type: 'all', label: 'All Attempts' });
                if (card.label === 'Correct Answers') setDrilldown({ type: 'correct', label: 'Correct Answers' });
                if (card.label === 'Accuracy Rate') setDrilldown({ type: 'incorrect', label: 'Incorrect Answers' });
              }}
              className={`metric-tile bg-white rounded-2xl shadow-sm ${card.border} p-5 cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>{card.icon}</div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide text-right">{card.label}</p>
              </div>
              <p className={`text-3xl font-bold ${card.val} tabular-nums`}><CountUp value={card.value} />{card.suffix || ''}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-center">
            <ProgressRing value={stats.accuracy} />
          </div>
          <div
            onClick={() => setDrilldown({ type: 'all', label: 'Performance Trend Attempts' })}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <p className="text-sm font-bold text-gray-800">Performance Pulse</p>
            </div>
            <MiniSparkline data={stats.subjectStats.length ? stats.subjectStats.map((s) => s.pct) : [0, 15, 35, 55, stats.accuracy]} />
            <p className="text-xs text-gray-500 mt-2">Trend based on your subject-level accuracy scores.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-bold text-gray-800 mb-3">Recent Activity</p>
            <TimelineFeed items={stats.recentActivity} />
          </div>
        </div>

        {/* Available Assessments */}
        {!assessmentsLoading && assessments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-900">Available Assessments</h2>
              <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-semibold">{assessments.length} Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((assess) => {
                const startDate = assess.startAt ? new Date(assess.startAt) : null;
                const endDate = assess.endAt ? new Date(assess.endAt) : null;
                const now = new Date();
                const isActive = (!startDate || startDate <= now) && (!endDate || endDate >= now);
                const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div
                    key={assess.id}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{assess.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{assess.assessmentType.toUpperCase()} • {assess.subject || 'General'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                        assess.canAttempt 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {assess.canAttempt ? `${assess.attemptRemaining} Attempt${assess.attemptRemaining !== 1 ? 's' : ''}` : 'Limit Reached'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{assess.durationMinutes} mins • {assess.totalMarks} marks</span>
                      </div>
                      {startDate && (
                        <div className="text-xs text-gray-500">
                          <span>Start: {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      )}
                      {endDate && (
                        <div className={`text-xs ${daysLeft && daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          <span>End: {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {daysLeft && <span> ({daysLeft > 0 ? `${daysLeft} days left` : 'Expired'})</span>}
                        </div>
                      )}
                    </div>

                    {assess.lastAttemptDate && (
                      <div className="mb-3 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-lg">
                        Last attempt: {new Date(assess.lastAttemptDate).toLocaleDateString()}
                        {assess.bestScore !== null && <span> • Best: <strong>{assess.bestScore}%</strong></span>}
                      </div>
                    )}

                    <Link
                      to={`/assessments/${assess.id}`}
                      className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        assess.canAttempt && isActive
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={(e) => {
                        if (!assess.canAttempt || !isActive) e.preventDefault();
                      }}
                    >
                      {assess.canAttempt && isActive ? (
                        <>Start Assessment <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        <>Unavailable</>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <div className="flex justify-between items-center mb-1 cursor-pointer" onClick={() => setDrilldown({ type: 'subject', label: subj.name })}>
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
                      className={`h-2.5 rounded-full transition-all duration-700 progress-fill ${
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

        {drilldown.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDrilldown({ type: '', label: '' })}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{drilldown.label} Records</h2>
                <button onClick={() => setDrilldown({ type: '', label: '' })} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
              </div>
              {drilldownRecords.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">No records found for this selection.</p>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                  {drilldownRecords.slice(0, 50).map((r, idx) => (
                    <div key={`${r.id || idx}-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{r.questionText || 'Question record'}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{r.subject || 'General'}</span>
                        {r.topic && <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{r.topic}</span>}
                        <span className={`px-2 py-0.5 rounded-full ${r.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            to="/practice"
            className="action-tile bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-7 hover:shadow-xl transition-all hover:-translate-y-1"
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
            className="action-tile bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-2xl p-7 hover:shadow-xl transition-all hover:-translate-y-1"
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
