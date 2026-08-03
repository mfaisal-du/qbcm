import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Shield, Users, BookOpen, ClipboardList, TrendingUp, BarChart3, Target, CheckCircle, XCircle, Clock, Database, FileText, Activity, Archive, Volume2, PauseCircle, Settings, Lock, ShieldCheck, PieChart } from 'lucide-react';
import { userService, academicService, questionService, assessmentService } from '../services/api';
import { Card, Button, Input, Select, Modal, Badge, Spinner, Table, StatusGuide, STATUS_TOOLTIPS, CountUp, MiniSparkline, ProgressRing } from '../components/Common';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const normalizeRole = (role) => role === 'admin' ? 'administrator' : role;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const normalizedRole = normalizeRole(user?.role);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalAssessments: 0,
    publishedAssessments: 0,
    pendingReviews: 0
  });
  const [allUsers, setAllUsers] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [dashboardFilter, setDashboardFilter] = useState({ type: 'summary', label: 'Overview' });
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, questionsRes, subjectsRes, topicsRes, assessmentsRes, pendingRes] = await Promise.all([
          userService.getAll(),
          questionService.getAll({ limit: 1000 }),
          academicService.getSubjects({}),
          academicService.getTopics({}),
          assessmentService.getDashboardStats().catch(() => null),
          questionService.getPending().catch(() => null)
        ]);

        const users = usersRes.data.users || [];
        const questions = questionsRes.data.questions || [];
        const assessmentStats = assessmentsRes?.data?.stats || {};
        setAllUsers(users);
        setAllQuestions(questions);
        setStats({
          totalUsers: users.length,
          totalQuestions: questions.length,
          totalSubjects: subjectsRes.data.subjects?.length || 0,
          totalTopics: topicsRes.data.topics?.length || 0,
          totalAssessments: assessmentStats.total || 0,
          publishedAssessments: assessmentStats.published || 0,
          pendingReviews: pendingRes?.data?.questions?.length || 0
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      load();
    } else {
      setLoading(false);
    }
  }, [user]);

  const overviewCards = [
    { label: 'Total Users', value: stats.totalUsers, sub: 'All platform accounts', tone: 'indigo', icon: <Users className="w-6 h-6" />, href: '/admin/users' },
    { label: 'Questions', value: stats.totalQuestions, sub: 'Total question records', tone: 'emerald', icon: <Database className="w-6 h-6" />, href: '/admin/questions-bank' },
    { label: 'Subjects', value: stats.totalSubjects, sub: 'Curriculum subjects', tone: 'blue', icon: <BookOpen className="w-6 h-6" />, href: '/admin/academic' },
    { label: 'Pending Reviews', value: stats.pendingReviews, sub: 'Awaiting approval', tone: 'rose', icon: <Clock className="w-6 h-6" />, href: '/admin/questions' }
  ];

  const pageStatus = stats.pendingReviews > 0 ? 'Attention required' : 'Healthy';
  const pageStatusClass = stats.pendingReviews > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700';

  const questionCounts = {
    active: allQuestions.filter((q) => q.status === 'active').length,
    vetted: allQuestions.filter((q) => q.status === 'vetted').length,
    draft: allQuestions.filter((q) => q.status === 'draft').length,
    archived: allQuestions.filter((q) => q.status === 'archived').length
  };

  const userCounts = {
    faculty: allUsers.filter((u) => u.role === 'faculty').length,
    pending: allUsers.filter((u) => !u.isApproved).length,
    approved: allUsers.filter((u) => u.isApproved).length
  };

  const actionCards = [
    { title: 'Approve accounts', value: userCounts.pending, description: 'Review pending users and grant access quickly.', icon: <Users className="w-6 h-6 text-rose-600" />, href: '/admin/users', accent: 'bg-rose-50 text-rose-700', count: userCounts.pending },
    { title: 'Review questions', value: questionCounts.vetted, description: 'Check vetting progress and keep content moving.', icon: <ClipboardList className="w-6 h-6 text-indigo-600" />, href: '/admin/questions', accent: 'bg-indigo-50 text-indigo-700', count: questionCounts.vetted },
    { title: 'Manage curriculum', value: stats.totalSubjects, description: 'Keep subjects and topics aligned with assessment plans.', icon: <BookOpen className="w-6 h-6 text-emerald-600" />, href: '/admin/academic', accent: 'bg-emerald-50 text-emerald-700', count: stats.totalSubjects }
  ];

  const dashboardFilters = [
    { type: 'users', label: 'Pending approvals', count: userCounts.pending, description: 'Pending users waiting for approval.', filter: (u) => !u.isApproved },
    { type: 'users', label: 'Faculty roster', count: userCounts.faculty, description: 'Faculty accounts and assignments.', filter: (u) => u.role === 'faculty' },
    { type: 'questions', label: 'Active questions', count: questionCounts.active, description: 'Approved questions ready for use.', filter: (q) => q.status === 'active' },
    { type: 'questions', label: 'Vetted questions', count: questionCounts.vetted, description: 'Questions that passed quality review.', filter: (q) => q.status === 'vetted' }
  ];

  const applyDashboardFilter = (filter) => {
    setDashboardFilter(filter);
    if (filter.type === 'users') {
      setFilteredRecords(allUsers.filter(filter.filter).slice(0, 6));
    } else if (filter.type === 'questions') {
      setFilteredRecords(allQuestions.filter(filter.filter).slice(0, 6));
    } else {
      setFilteredRecords([]);
    }
  };

  useEffect(() => {
    if (dashboardFilter.type !== 'summary') {
      applyDashboardFilter(dashboardFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, allQuestions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] bg-white/90 border border-gray-200 shadow-xl p-8 backdrop-blur-lg">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                Admin Control Center
              </span>
              <h1 className="mt-5 text-4xl font-extrabold text-gray-950 tracking-tight">Manage users, curriculum, questions and review workflow from one place.</h1>
              <p className="mt-4 text-gray-600 leading-7">Use the admin command center to approve accounts, manage the curriculum structure, and keep the question bank in sync with faculty workflow.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => navigate('/admin/users')} className="flex items-center gap-2">Manage Users</Button>
                <Button variant="secondary" onClick={() => navigate('/admin/academic')}>Academic Setup</Button>
              </div>
            </div>
            <div className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ${pageStatusClass}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] font-semibold">Platform status</p>
                  <p className="mt-3 text-3xl font-extrabold">{pageStatus}</p>
                </div>
                <div className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <p className="mt-4 text-sm text-gray-600">{stats.pendingReviews > 0 ? `${stats.pendingReviews} review items are awaiting administrator action.` : 'No pending review items at the moment.'}</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Review load</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">{stats.pendingReviews}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressRing value={Math.min(stats.pendingReviews, 50)} max={50} size={76} stroke={10} color={stats.pendingReviews > 10 ? '#ef4444' : '#10b981'} label="Queue" />
                    <div>
                      <p className="text-sm text-slate-600">Avg review time</p>
                      <p className="text-xl font-bold text-slate-950">2.4 days</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Users</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">{stats.totalUsers}</p>
                  <MiniSparkline data={[Math.max(0, stats.totalUsers - 4), Math.max(0, stats.totalUsers - 2), stats.totalUsers, stats.totalUsers + 1, stats.totalUsers + 3]} className="mt-4 rounded-lg" stroke="#4338ca" fill="rgba(67, 56, 202, 0.12)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {overviewCards.map((metric) => (
            <DashboardMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              sub={metric.sub}
              tone={metric.tone}
              icon={metric.icon}
              onClick={() => navigate(metric.href)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {dashboardFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => applyDashboardFilter(filter)}
              className={`rounded-3xl border ${dashboardFilter.label === filter.label ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white'} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{filter.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{filter.description}</p>
                </div>
                <span className="text-3xl font-extrabold text-slate-950">{filter.count}</span>
              </div>
            </button>
          ))}
        </div>

        {dashboardFilter.type !== 'summary' && (
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950">{dashboardFilter.label}</h2>
                <p className="text-sm text-gray-500 mt-1">Showing the top {filteredRecords.length} records for this filter.</p>
              </div>
              <Button variant="secondary" onClick={() => setDashboardFilter({ type: 'summary', label: 'Overview' })}>Clear filter</Button>
            </div>
            <div className="grid gap-3">
              {filteredRecords.length ? (
                filteredRecords.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-gray-200 p-4 bg-slate-50">
                    {dashboardFilter.type === 'users' ? (
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-slate-950">{record.firstName} {record.lastName}</div>
                        <div className="text-sm text-slate-600">{record.email}</div>
                        <div className="text-xs text-slate-500">Role: {record.role} • {record.isApproved ? 'Approved' : 'Pending'}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-slate-950">{record.questionText?.substring(0, 120)}{record.questionText?.length > 120 ? '…' : ''}</div>
                        <div className="text-sm text-slate-600">Subject: {record.subject || 'Unassigned'} • Status: {record.status}</div>
                        <div className="text-xs text-slate-500">Difficulty: {record.difficulty || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No records match this selection.</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950">Quick Actions</h2>
                <p className="text-sm text-gray-500 mt-1">Navigate directly to the most important admin workflows.</p>
              </div>
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'User Management', desc: 'Create, approve, update and manage student, faculty, reviewer and administrator accounts.', icon: <Users className="w-6 h-6 text-indigo-600" />, href: '/admin/users', accent: 'from-indigo-500 to-blue-600' },
                { title: 'Academic Structure', desc: 'Maintain years, semesters, subjects, topics, CLOs and SLOs.', icon: <BookOpen className="w-6 h-6 text-emerald-600" />, href: '/admin/academic', accent: 'from-emerald-500 to-teal-600' },
                { title: 'Question Bank', desc: 'Browse, filter, archive and manage faculty-created questions.', icon: <Database className="w-6 h-6 text-amber-600" />, href: '/admin/questions-bank', accent: 'from-amber-500 to-orange-600' },
                { title: 'Review Queue', desc: 'Review pending and vetted questions before they become active.', icon: <ClipboardList className="w-6 h-6 text-rose-600" />, href: '/admin/questions', accent: 'from-rose-500 to-pink-600' }
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.href)}
                  className="rounded-3xl border border-gray-100 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.accent} text-white flex items-center justify-center mb-4`}>
                    {action.icon}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-extrabold text-gray-950">{action.title}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{action.count}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-950">Admin Permissions</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Roles and access checks</p>
              </div>
            </div>
            <PermissionMatrix role="administrator" />
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-950">Governance Highlights</h2>
              <p className="text-sm text-gray-500">Key admin responsibilities to keep the platform stable.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Manage non-privileged users',
              'Approve student and faculty accounts',
              'Manage academic years, subjects and topics',
              'Browse and manage question bank records',
              'Review pending and vetted questions',
              'Archive or deactivate content when required'
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalSubjects: 0,
    totalTopics: 0,
    totalAssessments: 0,
    publishedAssessments: 0,
    pendingReviews: 0,
    systemHealth: 'Operational'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, questionsRes, subjectsRes, topicsRes, assessmentsRes, pendingRes] = await Promise.all([
          userService.getAll(),
          questionService.getAll({ limit: 1000 }),
          academicService.getSubjects({}),
          academicService.getTopics({}),
          assessmentService.getDashboardStats().catch(() => null),
          questionService.getPending().catch(() => null)
        ]);

        const assessmentStats = assessmentsRes?.data?.stats || {};
        setStats({
          totalUsers: usersRes.data.users?.length || 0,
          totalQuestions: questionsRes.data.questions?.length || 0,
          totalSubjects: subjectsRes.data.subjects?.length || 0,
          totalTopics: topicsRes.data.topics?.length || 0,
          totalAssessments: assessmentStats.total || 0,
          publishedAssessments: assessmentStats.published || 0,
          pendingReviews: pendingRes?.data?.questions?.length || 0,
          systemHealth: 'Operational'
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const superChartData = useMemo(() => [
    { name: 'Users', value: stats.totalUsers },
    { name: 'Questions', value: stats.totalQuestions },
    { name: 'Subjects', value: stats.totalSubjects },
    { name: 'Topics', value: stats.totalTopics },
    { name: 'Assessments', value: stats.totalAssessments },
    { name: 'Pending', value: stats.pendingReviews },
  ], [stats]);

  const accessData = useMemo(() => ([
    { name: 'Users', value: 100 },
    { name: 'Academic', value: 100 },
    { name: 'Question Bank', value: 100 },
    { name: 'Reviews', value: 100 },
    { name: 'System', value: 100 },
  ]), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] bg-white/10 border border-white/15 p-6 text-white shadow-2xl backdrop-blur">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-wide">
                  Super Admin Portal
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/20 text-xs font-semibold">
                  Full Platform Access
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Super Admin Command Center</h1>
              <p className="text-white/70 mt-2">Complete authority over users, roles, question bank, curriculum and governance.</p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-white/10 border border-white/15 p-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-300 text-white flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/60">Signed in as</p>
                <p className="text-sm font-extrabold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-white/60 capitalize">super admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <DashboardMetricCard label="Total Users" value={stats.totalUsers} sub="All roles and accounts" tone="violet" icon={<Users className="w-6 h-6" />} onClick={() => navigate('/admin/users')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <DashboardMetricCard label="Question Bank" value={stats.totalQuestions} sub="All question records" tone="fuchsia" icon={<Database className="w-6 h-6" />} onClick={() => navigate('/admin/questions-bank')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <DashboardMetricCard label="Academic Subjects" value={stats.totalSubjects} sub="Curriculum coverage" tone="emerald" icon={<BookOpen className="w-6 h-6" />} onClick={() => navigate('/admin/academic')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <DashboardMetricCard label="Topics / Outcomes" value={stats.totalTopics} sub="CLOs, SLOs and topics" tone="amber" icon={<Target className="w-6 h-6" />} onClick={() => navigate('/admin/academic')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <DashboardMetricCard label="Assessments" value={stats.totalAssessments} sub={`${stats.publishedAssessments} published`} tone="blue" icon={<ClipboardList className="w-6 h-6" />} onClick={() => navigate('/admin/dashboard')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <DashboardMetricCard label="Pending Reviews" value={stats.pendingReviews} sub="Review queue load" tone="rose" icon={<Clock className="w-6 h-6" />} onClick={() => navigate('/admin/questions')} bg="bg-white/10" border="border border-white/15" text="text-white" />
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-white/70">Health</span>
            </div>
            <p className="text-3xl font-extrabold mt-5">OK</p>
            <p className="text-sm font-semibold mt-1">System Health</p>
            <p className="text-xs text-white/70 mt-1">API, routes and admin modules active</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold">Platform Overview</h2>
                <p className="text-sm text-white/70 mt-1">Users, questions, subjects, topics, assessments</p>
              </div>
              <BarChart3 className="w-5 h-5 text-white/90" />
            </div>
            <SimpleBarChart data={superChartData} xKey="name" yKey="value" height={240} color="#8b5cf6" />
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Users', value: stats.totalUsers, href: '/admin/users', accent: 'bg-white/10 hover:bg-white/20 text-white border border-white/10' },
                { label: 'Questions', value: stats.totalQuestions, href: '/admin/questions-bank', accent: 'bg-white/10 hover:bg-white/20 text-white border border-white/10' },
                { label: 'Pending Reviews', value: stats.pendingReviews, href: '/admin/questions', accent: 'bg-white/10 hover:bg-white/20 text-white border border-white/10' },
              ].map((item) => (
                <button key={item.label} onClick={() => navigate(item.href)} className={`rounded-xl p-3 text-left transition-colors ${item.accent}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">Open {item.label}</p>
                  <p className="text-xl font-black mt-0.5">{item.value}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold">Super Admin Rights</h2>
                <p className="text-xs text-white/70 uppercase tracking-wide">All question bank rights</p>
              </div>
            </div>
            <PermissionMatrix role="super_admin" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold">Platform Controls</h2>
                <p className="text-sm text-white/70 mt-1">Super admin modules with unrestricted access.</p>
              </div>
              <Settings className="w-5 h-5 text-white/90" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'User Governance', desc: 'Full user lifecycle control including super admin and privileged accounts.', icon: <Users className="w-6 h-6 text-violet-600" />, href: '/admin/users', accent: 'from-violet-600 to-fuchsia-600' },
                { title: 'Academic Structure', desc: 'Own all curriculum, subject, topic, CLO and SLO configuration.', icon: <BookOpen className="w-6 h-6 text-emerald-600" />, href: '/admin/academic', accent: 'from-emerald-500 to-teal-600' },
                { title: 'Question Bank', desc: 'Full question bank access across draft, vetted, active, archived and rejected states.', icon: <Database className="w-6 h-6 text-amber-600" />, href: '/admin/questions-bank', accent: 'from-amber-500 to-orange-600' },
                { title: 'Review Queue', desc: 'Final authority for review workflow, approvals and content quality.', icon: <ClipboardList className="w-6 h-6 text-rose-600" />, href: '/admin/questions', accent: 'from-rose-500 to-pink-600' }
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.href)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:border-rose-300/40 hover:bg-white/10 transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.accent} text-white flex items-center justify-center mb-4 shadow-sm`}>
                    {action.icon}
                  </div>
                  <p className="text-base font-extrabold text-white">{action.title}</p>
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-300/30 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Governance Overview</h2>
                <p className="text-sm text-white/70">Highest-level controls available to this role.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Create, update and delete every user role',
                'Reset any user password',
                'Manage privileged administrator accounts',
                'Full academic structure ownership',
                'Full question bank lifecycle control',
                'Final review and approval authority'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-300/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Access Status</h2>
                <p className="text-sm text-white/70">Role capability summary.</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['Users', 'Full'],
                ['Academic', 'Full'],
                ['Question Bank', 'Full'],
                ['Reviews', 'Full'],
                ['System', 'Full']
              ].map(([label, level]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-sm font-bold text-white/90">{label}</span>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-300">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const toneClasses = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' }
};

const getToneClasses = (tone) => toneClasses[tone] || toneClasses.indigo;

const PermissionMatrix = ({ role }) => {
  const isAdmin = role === 'administrator';
  const rows = isAdmin
    ? [
        ['Manage non-privileged users', true],
        ['Create administrator accounts', true],
        ['Manage academic structure', true],
        ['Manage question bank', true],
        ['Review and approve questions', true],
        ['Manage super admin accounts', false],
        ['Reset privileged passwords', false],
        ['Delete privileged users', false]
      ]
    : [
        ['Manage all user roles', true],
        ['Reset any user password', true],
        ['Manage academic structure', true],
        ['Manage all question bank records', true],
        ['Final review authority', true],
        ['Create super admin accounts', true],
        ['System governance', true],
        ['Archive or deactivate content', true]
      ];

  return (
    <div className="space-y-2">
      {rows.map(([label, allowed]) => (
        <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 p-3">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {allowed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" /> Allowed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700">
              <Lock className="w-3.5 h-3.5" /> Restricted
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const normalizedRole = normalizeRole(user?.role);
  const isSuperAdmin = normalizedRole === 'super_admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    assignedYear: '',
    assignedSemester: '',
    assignedSubject: ''
  });

  const displayedUsers = users.filter((u) => {
    if (statusFilter === 'pending') return !u.isApproved;
    if (statusFilter === 'approved') return !!u.isApproved;
    return true;
  });

  const pendingCount = users.filter((u) => !u.isApproved).length;
  const facultyCount = users.filter((u) => u.role === 'faculty').length;
  const approvedCount = users.filter((u) => u.isApproved).length;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ search, role: roleFilter || undefined });
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
      department: '',
      assignedYear: '',
      assignedSemester: '',
      assignedSubject: ''
    });
    setShowUserModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      password: '',
      role: u.role || 'student',
      department: u.department || '',
      assignedYear: u.assignedYear || '',
      assignedSemester: u.assignedSemester || '',
      assignedSubject: u.assignedSubject || ''
    });
    setShowUserModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department
      };

      if (editingUser) {
        if (isSuperAdmin) {
          payload.role = form.role;
          if (form.password) payload.password = form.password;
          payload.assignedYear = form.assignedYear || null;
          payload.assignedSemester = form.assignedSemester || null;
          payload.assignedSubject = form.assignedSubject || null;
        } else if (form.role === 'faculty') {
          payload.assignedYear = form.assignedYear || null;
          payload.assignedSemester = form.assignedSemester || null;
          payload.assignedSubject = form.assignedSubject || null;
        }

        await userService.update(editingUser.id, payload);
        toast.success('User updated');
      } else {
        if (!form.password) { toast.error('Password is required'); setSaving(false); return; }
        payload.email = form.email;
        payload.password = form.password;
        payload.role = form.role;
        payload.assignedYear = form.assignedYear || null;
        payload.assignedSemester = form.assignedSemester || null;
        payload.assignedSubject = form.assignedSubject || null;

        await userService.create(payload);
        toast.success('User created');
      }

      setShowUserModal(false);
      fetchUsers();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const target = users.find((u) => u.id === id);
    const isPrivileged = target?.role === 'super_admin' || target?.role === 'administrator';
    if (isPrivileged && !isSuperAdmin) {
      toast.error('Only super admin can delete privileged users');
      return;
    }
    if (!window.confirm('Delete this user?')) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleApprove = async (id) => {
    try {
      await userService.approve(id);
      toast.success('User approved');
      fetchUsers();
    } catch {
      toast.error('Failed to approve user');
    }
  };

  const roleBadge = (role) => {
    const cls = {
      super_admin: 'bg-violet-100 text-violet-700',
      administrator: 'bg-indigo-100 text-indigo-700',
      faculty: 'bg-emerald-100 text-emerald-700',
      student: 'bg-blue-100 text-blue-700',
      reviewer: 'bg-amber-100 text-amber-700'
    }[role] || 'bg-gray-100 text-gray-700';
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${cls}`}>{role?.toUpperCase()}</span>;
  };

  const roleOptions = isSuperAdmin
    ? [
        { label: 'Student', value: 'student' },
        { label: 'Faculty', value: 'faculty' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Administrator', value: 'administrator' },
        { label: 'Super Admin', value: 'super_admin' }
      ]
    : [
        { label: 'Student', value: 'student' },
        { label: 'Faculty', value: 'faculty' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Administrator', value: 'administrator' }
      ];

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (u) => (
        <div className="space-y-1">
          <div className="font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
          <div className="text-xs text-gray-500">{u.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (u) => <Badge type={u.role === 'faculty' ? 'success' : 'info'}>{u.role?.toUpperCase()}</Badge>
    },
    {
      key: 'assigned',
      label: 'Assignment',
      render: (u) => u.role === 'faculty' ? (
        <div className="space-y-1 text-sm text-gray-600">
          <div>{u.assignedSubject || 'No subject assigned'}</div>
          <div>{u.assignedYear ? `Year ${u.assignedYear}` : 'Year not set'}</div>
          <div>{u.assignedSemester ? `Sem ${u.assignedSemester}` : 'Sem not set'}</div>
        </div>
      ) : '-'
    },
    {
      key: 'status',
      label: 'Approval',
      render: (u) => (
        <Badge type={u.isApproved ? 'success' : 'warning'}>{u.isApproved ? 'Approved' : 'Pending'}</Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEdit(u)}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
          >
            Edit
          </button>
          {!u.isApproved && (isSuperAdmin || normalizedRole === 'administrator') && (
            <button
              type="button"
              onClick={() => handleApprove(u.id)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
            >
              Approve
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(u.id)}
            disabled={(u.role === 'super_admin' || u.role === 'administrator') && !isSuperAdmin}
            className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage platform users, approvals, and faculty assignments.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add User
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')} variant="secondary">Back</Button>
          </div>
        </div>

        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Faculty accounts</p>
            <p className="text-3xl font-bold text-gray-900">{facultyCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Pending approvals</p>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Select
                label="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { label: 'All roles', value: '' },
                  { label: 'Student', value: 'student' },
                  { label: 'Faculty', value: 'faculty' },
                  { label: 'Reviewer', value: 'reviewer' },
                  { label: 'Administrator', value: 'administrator' },
                  ...(isSuperAdmin ? [{ label: 'Super Admin', value: 'super_admin' }] : [])
                ]}
                className="max-w-xs"
              />
              <Select
                label="Approval status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All statuses', value: '' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Pending approval', value: 'pending' }
                ]}
                className="max-w-xs"
              />
            </div>
            <Button variant="secondary" onClick={fetchUsers}>Refresh</Button>
          </div>
          <Table columns={userColumns} data={displayedUsers} loading={loading} />
        </Card>

        <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Create User'} size="md">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editingUser} />
            {!editingUser && (
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            )}
            {isSuperAdmin && editingUser && (
              <Input label="New Password (leave blank to keep)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            )}
            <Select label="Role" value={form.role} disabled={editingUser && !isSuperAdmin} onChange={(e) => setForm({ ...form, role: e.target.value })} options={roleOptions} />
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            {(form.role === 'faculty' || (editingUser && editingUser.role === 'faculty')) && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Assigned Year" type="number" min="1" value={form.assignedYear} onChange={(e) => setForm({ ...form, assignedYear: e.target.value })} />
                  <Input label="Assigned Semester" type="number" min="1" value={form.assignedSemester} onChange={(e) => setForm({ ...form, assignedSemester: e.target.value })} />
                  <Input label="Assigned Subject" value={form.assignedSubject} onChange={(e) => setForm({ ...form, assignedSubject: e.target.value })} />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editingUser ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export const AdminQuestionsPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionQuestionId, setActionQuestionId] = useState(null);

  const questionStats = useMemo(() => {
    const counts = questions.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: questions.length,
      draft: counts.draft || 0,
      vetted: counts.vetted || 0,
      active: counts.active || 0,
      archived: counts.archived || 0,
      rejected: counts.rejected || 0
    };
  }, [questions]);

  const questionColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (q) => <span className="font-mono text-xs text-gray-600">#{q.id}</span>
    },
    {
      key: 'question',
      label: 'Question',
      render: (q) => (
        <div className="space-y-1">
          <div className="text-sm text-gray-800">{q.questionText?.substring(0, 100)}{q.questionText?.length > 100 ? '…' : ''}</div>
          <button
            type="button"
            onClick={() => speakQuestion(q.questionText, q.id)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {speakingQuestionId === q.id ? 'Stop reading' : 'Read aloud'}
          </button>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (q) => q.subject || '-'
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (q) => q.difficulty || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (q) => statusBadge(q.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleArchive(q.id)}
            disabled={actionLoading && actionQuestionId === q.id}
            className="text-amber-600 hover:text-amber-800 text-xs font-semibold"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={() => handleDeleteQuestion(q.id)}
            disabled={actionLoading && actionQuestionId === q.id}
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await questionService.getAll({ subject: subjectFilter || undefined, status: statusFilter || undefined });
      setQuestions(res.data.questions || []);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [subjectFilter, statusFilter]);

  const speakQuestion = (text, id) => {
    if (!window.speechSynthesis) {
      toast.error('Text-to-speech is not supported in this browser');
      return;
    }

    if (speakingQuestionId === id) {
      window.speechSynthesis.cancel();
      setSpeakingQuestionId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingQuestionId(null);
    utterance.onerror = () => setSpeakingQuestionId(null);
    setSpeakingQuestionId(id);
    window.speechSynthesis.speak(utterance);
  };

  const statusBadge = (status) => {
    const cls = {
      draft: 'bg-yellow-100 text-yellow-700',
      vetted: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      used: 'bg-gray-200 text-gray-700',
      rejected: 'bg-red-100 text-red-700',
      archived: 'bg-amber-100 text-amber-800'
    }[status] || 'bg-gray-100 text-gray-700';
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${cls}`}>{status?.toUpperCase()}</span>;
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this question?')) return;
    setActionLoading(true);
    setActionQuestionId(id);
    try {
      await questionService.archive(id);
      toast.success('Question archived');
      fetchQuestions();
    } catch {
      toast.error('Failed to archive question');
    } finally {
      setActionLoading(false);
      setActionQuestionId(null);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Permanently delete this question?')) return;
    setActionLoading(true);
    setActionQuestionId(id);
    try {
      await questionService.delete(id);
      toast.success('Question deleted');
      fetchQuestions();
    } catch {
      toast.error('Failed to delete question');
    } finally {
      setActionLoading(false);
      setActionQuestionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-500 text-sm mt-1">Browse and manage all questions</p>
          </div>
          <Button onClick={() => navigate('/admin/dashboard')} variant="secondary">Back to Dashboard</Button>
        </div>

        <Card>
          <div className="flex flex-wrap gap-3 mb-4">
            <Input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="Filter by subject" className="max-w-xs" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'draft' },
              { label: 'Vetted', value: 'vetted' },
              { label: 'Active', value: 'active' },
              { label: 'Used', value: 'used' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Archived', value: 'archived' }
            ]} className="max-w-xs" />
            <Button onClick={fetchQuestions} variant="secondary">Refresh</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-gray-500">Total questions</p>
              <p className="text-3xl font-bold text-gray-900">{questionStats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Draft</p>
              <p className="text-3xl font-bold text-gray-900">{questionStats.draft}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Vetted</p>
              <p className="text-3xl font-bold text-gray-900">{questionStats.vetted}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-3xl font-bold text-gray-900">{questionStats.active}</p>
            </Card>
          </div>

          <Table columns={questionColumns} data={questions} loading={loading} />
        </Card>
      </div>
    </div>
  );
};

const AcademicStructurePreview = () => {
  const medicalCurriculum = [
    { year: 1, semester: 1, season: 'Fall', courses: [
      { code: 'ENGL 101', name: 'Basic Academic English', phase: 'Basic' },
      { code: 'ARAB 101', name: 'Academic Writing in Arabic', phase: 'Basic' },
      { code: 'ENTR 200', name: 'Entrepreneurship: Innovation and Creativity', phase: 'Basic' },
      { code: 'SOCS 102', name: 'Omani Society', phase: 'Basic' },
      { code: 'MEDI 101', name: 'English for Medicine', phase: 'Basic' }
    ]},
    { year: 1, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 121', name: 'Cell Biology', phase: 'Basic' },
      { code: 'MEDI 122', name: 'Human Body Structure I', phase: 'Basic' },
      { code: 'MEDI 123', name: 'Human Physiology I', phase: 'Basic' },
      { code: 'MEDI 124', name: 'Biochemical Basis of Body Functions', phase: 'Basic' },
      { code: 'MEDI 125', name: 'Behavioral & Social Sciences', phase: 'Basic' },
      { code: 'MEDI 126', name: 'Medical Informatics', phase: 'Basic' }
    ]},
    { year: 2, semester: 1, season: 'Fall', courses: [
      { code: 'MEDI 211', name: 'Human Physiology II', phase: 'Basic' },
      { code: 'MEDI 212', name: 'Basics of Medical Genetics', phase: 'Basic' },
      { code: 'MEDI 213', name: 'Principles of Medical Microbiology and Immunology', phase: 'Integrated' },
      { code: 'MEDI 214', name: 'Introduction to Pharmacology', phase: 'Integrated' },
      { code: 'MEDI 215', name: 'Human Body Structure II', phase: 'Integrated' },
      { code: 'MEDI 216', name: 'General Pathology', phase: 'Integrated' },
      { code: 'MEDI 217', name: 'Early Clinical Exposure and Body Systems Integration I', phase: 'Clinical' }
    ]},
    { year: 2, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 221', name: 'Hematopoietic & Immune System', phase: 'Integrated' },
      { code: 'MEDI 222', name: 'Community and Global Health', phase: 'Integrated' },
      { code: 'MEDI 223', name: 'Research in Health and Biostatistics', phase: 'Integrated' },
      { code: 'MEDI 224', name: 'Respiratory System', phase: 'Integrated' },
      { code: 'MEDI 225', name: 'Cardiovascular System', phase: 'Integrated' }
    ]},
    { year: 3, semester: 1, season: 'Fall', courses: [
      { code: 'MEDI 311', name: 'Locomotor System', phase: 'Integrated' },
      { code: 'MEDI 312', name: 'Clinical Nutrition', phase: 'Integrated' },
      { code: 'MEDI 313', name: 'Alimentary System', phase: 'Integrated' },
      { code: 'MEDI 314', name: 'Urogenital System', phase: 'Integrated' },
      { code: 'MEDI 315', name: 'Research Project I', phase: 'Clinical' },
      { code: 'MEDI 316', name: 'Emerging Medical Technologies', phase: 'Clinical' },
      { code: 'MEDI 317', name: 'Early Clinical Exposure and Body Systems Integration II', phase: 'Clinical' }
    ]},
    { year: 3, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 321', name: 'Endocrine System', phase: 'Integrated' },
      { code: 'MEDI 322', name: 'Human Nervous System', phase: 'Integrated' },
      { code: 'MEDI 323', name: 'Special Senses', phase: 'Integrated' },
      { code: 'MEDI 324', name: 'Research Project II', phase: 'Clinical' }
    ]},
    { year: 4, semester: 1, season: 'Fall', courses: [
      { code: 'CLIN 411', name: 'Medical Ethics and Professionalism', phase: 'Clinical' },
      { code: 'CLIN 412', name: 'Patient Support and Safety', phase: 'Clinical' },
      { code: 'CLIN 413', name: 'Medical Imaging and Radiology', phase: 'Clinical' },
      { code: 'CLIN 414', name: 'Evidence Based Medicine', phase: 'Clinical' },
      { code: 'CLIN 415', name: 'Interpretation of Laboratory Data', phase: 'Clinical' },
      { code: 'CLIN 416', name: 'Clinical Psychology', phase: 'Clinical' },
      { code: 'CLIN 417', name: 'Communication Skills', phase: 'Clinical' }
    ]},
    { year: 4, semester: 2, season: 'Spring', courses: [
      { code: 'CLIN 421', name: 'Child Health Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 422', name: 'Surgical Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 423', name: 'Medical Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 424', name: 'Obs/Gyn Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 425', name: 'Mental Health I', phase: 'Clinical' }
    ]},
    { year: 5, semester: null, season: null, courses: [
      { code: 'CLIN 501', name: 'Medicine I', phase: 'Clinical' },
      { code: 'CLIN 502', name: 'Child Health I', phase: 'Clinical' },
      { code: 'CLIN 503', name: 'Surgery I', phase: 'Clinical' },
      { code: 'CLIN 504', name: 'Obs/Gyn I', phase: 'Clinical' },
      { code: 'CLIN 505', name: 'Community and Primary Care I', phase: 'Clinical' },
      { code: 'CLIN 506', name: 'Anesthesia', phase: 'Clinical' },
      { code: 'CLIN 507', name: 'Radiology', phase: 'Clinical' },
      { code: 'CLIN 508', name: 'ENT', phase: 'Clinical' },
      { code: 'CLIN 509', name: 'Dermatology', phase: 'Clinical' },
      { code: 'CLIN 510', name: 'Oral Health', phase: 'Clinical' },
      { code: 'CLIN 511', name: 'Community and Primary Care II', phase: 'Clinical' },
      { code: 'CLIN 512', name: 'Emergency Medicine', phase: 'Clinical' },
      { code: 'CLIN 513', name: 'Clinical Selective', phase: 'Clinical' },
      { code: 'CLIN 514', name: 'SLT (Forensic Medicine, Social Encounters with NGOs)', phase: 'Clinical' }
    ]},
    { year: 6, semester: null, season: null, courses: [
      { code: 'CLIN 601', name: 'Medicine II', phase: 'Clinical' },
      { code: 'CLIN 602', name: 'Clinical Elective', phase: 'Clinical' },
      { code: 'CLIN 603', name: 'Child Health II', phase: 'Clinical' },
      { code: 'CLIN 604', name: 'Hematology', phase: 'Clinical' },
      { code: 'CLIN 605', name: 'Community and Primary Care III', phase: 'Clinical' },
      { code: 'CLIN 606', name: 'Mental Health II', phase: 'Clinical' },
      { code: 'CLIN 607', name: 'Surgery II', phase: 'Clinical' },
      { code: 'CLIN 608', name: 'Orthopedic', phase: 'Clinical' },
      { code: 'CLIN 609', name: 'Obs/Gyn II', phase: 'Clinical' },
      { code: 'CLIN 610', name: 'Ophthalmology', phase: 'Clinical' }
    ]},
    { year: 'Pre-Internship', semester: null, season: null, courses: [
      { code: 'CLIN 621', name: 'Medicine', phase: 'Clinical' },
      { code: 'CLIN 622', name: 'Surgery', phase: 'Clinical' },
      { code: 'CLIN 623', name: 'Child Health', phase: 'Clinical' },
      { code: 'CLIN 624', name: 'Obs/Gyn and Primary Care', phase: 'Clinical' }
    ]}
  ];

  const phaseColors = {
    Basic: 'bg-blue-100 text-blue-700',
    Integrated: 'bg-purple-100 text-purple-700',
    Clinical: 'bg-rose-100 text-rose-700'
  };

  const totalCourses = medicalCurriculum.reduce((sum, y) => sum + y.courses.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="mb-3 flex gap-4">
        <p className="text-sm text-gray-600">Total Years: <span className="font-semibold text-gray-800">{medicalCurriculum.length}</span></p>
        <p className="text-sm text-gray-600">Total Courses: <span className="font-semibold text-gray-800">{totalCourses}</span></p>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {medicalCurriculum.map((yearData) => (
          <div key={yearData.year} className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>Year {yearData.year}</span>
              {yearData.semester && <span className="text-gray-500">• Semester {yearData.semester}</span>}
              {yearData.season && <span className="text-gray-400">({yearData.season})</span>}
            </h4>
            <div className="space-y-1.5">
              {yearData.courses.slice(0, 4).map((course) => (
                <div key={course.code} className="flex items-center justify-between text-xs">
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">{course.code}</span>
                  <span className="text-gray-700 flex-1 mx-2 truncate">{course.name}</span>
                  <span className={"px-1.5 py-0.5 rounded " + phaseColors[course.phase]}>{course.phase}</span>
                </div>
              ))}
              {yearData.courses.length > 4 && (
                <p className="text-xs text-gray-500 mt-1">+ {yearData.courses.length - 4} more courses</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
