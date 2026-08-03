import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, AlertCircle, Award, BarChart3, BookCheck, BookMarked,
  Calendar, CheckCircle2, ChevronRight, Clock, ClipboardList,
  Download, Edit3, Eye, FileText, GraduationCap, LayoutDashboard,
  Megaphone, Pin, PinOff, PlayCircle, Plus, Search, Star,
  TrendingUp, Trash2, Users, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { assessmentService } from '../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeRole = (r) => (r === 'admin' ? 'administrator' : r);

const TYPE_LABELS = {
  exam: 'Exam',
  quiz: 'Quiz',
  midterm: 'Midterm',
  irat: 'TBL iRAT',
  trat: 'TBL tRAT',
};

const TYPE_COLORS = {
  exam:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  quiz:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  midterm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  irat:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  trat:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const gradeLabel = (pct) => {
  if (pct === null || pct === undefined) return { label: '—', color: 'text-gray-400' };
  if (pct >= 90) return { label: 'A+', color: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 80) return { label: 'A',  color: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 70) return { label: 'B',  color: 'text-blue-600 dark:text-blue-400' };
  if (pct >= 60) return { label: 'C',  color: 'text-amber-600 dark:text-amber-400' };
  if (pct >= 50) return { label: 'D',  color: 'text-orange-600 dark:text-orange-400' };
  return { label: 'F', color: 'text-red-600 dark:text-red-400' };
};

const fmt = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusBadge = (a) => {
  if (!a.isPublished) return { label: 'Draft', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
  const now = new Date();
  if (a.startAt && new Date(a.startAt) > now) return { label: 'Scheduled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  if (a.endAt && new Date(a.endAt) < now) return { label: 'Closed', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' };
  return { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
};

// ── Reusable Sub-Components ───────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-500">
    <Icon className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm">{text}</p>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Tab: Overview ─────────────────────────────────────────────────────────────

const OverviewTab = ({ stats, assessments, role, navigate, onTabChange }) => {
  const upcoming = useMemo(() => (
    assessments
      .filter(a => a.isPublished && a.startAt && new Date(a.startAt) > new Date())
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 5)
  ), [assessments]);

  const recent = useMemo(() => (
    assessments
      .filter(a => a.isPublished)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5)
  ), [assessments]);

  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {canManage ? (
            <>
              <StatCard icon={BookCheck} label="Total Assessments" value={stats.total} color="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" />
              <StatCard icon={Activity} label="Active" value={stats.published} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
              <StatCard icon={ClipboardList} label="Submissions" value={stats.submitted} sub={stats.avgScore ? `Avg: ${stats.avgScore}%` : undefined} color="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" />
              <StatCard icon={Calendar} label="Upcoming" value={stats.upcoming} color="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
            </>
          ) : (
            <>
              <StatCard icon={BookCheck} label="Available" value={stats.available} color="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
              <StatCard icon={TrendingUp} label="Avg Score" value={stats.avgScore ? `${stats.avgScore}%` : '—'} color="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" />
              <StatCard icon={Star} label="Best Score" value={stats.bestScore ? `${stats.bestScore}%` : '—'} color="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assessments */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader icon={Calendar} title="Upcoming Assessments" />
          {upcoming.length === 0 ? (
            <EmptyState icon={Calendar} text="No upcoming assessments scheduled" />
          ) : (
            <ul className="space-y-3">
              {upcoming.map(a => {
                const { label, cls } = statusBadge(a);
                return (
                  <li key={a.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors cursor-pointer group"
                    onClick={() => canManage ? onTabChange('manage') : navigate(`/assessments/${a.id}/attempt`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                      <BookCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {a.subject && <span className="mr-2">{a.subject}</span>}
                        Opens: {fmtDateTime(a.startAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[a.assessmentType] || ''}`}>
                        {TYPE_LABELS[a.assessmentType] || a.assessmentType}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500 shrink-0" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader icon={Activity} title="Recent Activity" />
          {recent.length === 0 ? (
            <EmptyState icon={Activity} text="No assessment activity yet" />
          ) : (
            <ul className="space-y-3">
              {recent.map(a => {
                const { label, cls } = statusBadge(a);
                return (
                  <li key={a.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${a.isPublished ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{fmtDateTime(a.updatedAt || a.createdAt)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <SectionHeader icon={LayoutDashboard} title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {canManage && (
            <button onClick={() => onTabChange('manage', { openCreate: true })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 transition-colors group">
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">New Assessment</span>
            </button>
          )}
          <button onClick={() => onTabChange('manage')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors group">
            <BookMarked className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">{canManage ? 'View All' : 'Take Assessment'}</span>
          </button>
          <button onClick={() => onTabChange('gradebook')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors group">
            <Award className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Gradebook</span>
          </button>
          {canManage && (
            <button onClick={() => onTabChange('announcements')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 transition-colors group">
              <Megaphone className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Announcements</span>
            </button>
          )}
          {canManage && (
            <button onClick={() => onTabChange('reports')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 transition-colors group">
              <BarChart3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Reports</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tab: Manage (Assessment List) ──────────────────────────────────────────────

const ManageTab = ({ assessments, loading, role, navigate, onEdit, onDelete, onPublish }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectsMap, setSubjectsMap] = useState({});

  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  useEffect(() => {
    const loadSubjectDetails = async () => {
      const uniqueSubjects = [...new Set(assessments.map(a => a.subject).filter(Boolean))];
      if (uniqueSubjects.length === 0) return;
      
      try {
        const res = await assessmentService.getSubjects({ subject: uniqueSubjects.join(','), limit: 100 });
        const map = {};
        (res.data.subjects || []).forEach(s => {
          map[s.name] = s;
        });
        setSubjectsMap(map);
      } catch (e) {
        console.error('Failed to load subject details', e);
      }
    };
    loadSubjectDetails();
  }, [assessments]);

  const filtered = useMemo(() => {
    let list = assessments;
    if (typeFilter) list = list.filter(a => a.assessmentType === typeFilter);
    if (statusFilter === 'published') list = list.filter(a => a.isPublished);
    if (statusFilter === 'draft') list = list.filter(a => !a.isPublished);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || (a.subject || '').toLowerCase().includes(q));
    }
    return list;
  }, [assessments, typeFilter, statusFilter, search]);

  // Group by subject with academic details
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(a => {
      const key = a.subject || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {canManage && (
          <button
            onClick={() => navigate('/assessments/manage')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        )}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={BookCheck} text="No assessments found" />
      ) : (
        Object.entries(grouped).map(([subject, items]) => (
          <div key={subject}>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{subject}</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">{items.length} assessment{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(a => {
                const { label, cls } = statusBadge(a);
                const qCount = Array.isArray(a.questionIds) ? a.questionIds.length : 0;
                return (
                  <div key={a.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-700 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.assessmentType] || 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_LABELS[a.assessmentType] || a.assessmentType}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{a.title}</h4>
                        {a.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{a.description}</p>}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{qCount} Qs</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />{a.totalMarks} marks</span>
                      {a.startAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(a.startAt)}</span>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => onEdit(a)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
                            <Edit3 className="w-3 h-3" />Edit
                          </button>
                          <button onClick={() => onPublish(a)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              a.isPublished
                                ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                : 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300'
                            }`}>
                            {a.isPublished ? <Eye className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {a.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button onClick={() => onDelete(a)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate('/assessments/manage')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 transition-colors">
                          <PlayCircle className="w-3.5 h-3.5" />Start
                        </button>
                      )}
                      <span className="text-xs text-gray-400">
                        {a.creatorFirstName ? `by ${a.creatorFirstName} ${a.creatorLastName}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ── Tab: Gradebook ────────────────────────────────────────────────────────────

const GradebookTab = ({ role }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  useEffect(() => {
    assessmentService.getGradebook()
      .then(r => setRows(r.data.rows || []))
      .catch(() => toast.error('Failed to load gradebook'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      (r.firstName || '').toLowerCase().includes(q) ||
      (r.lastName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.assessmentTitle || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const exportCSV = () => {
    const header = canManage
      ? 'Student,Email,Assessment,Type,Subject,Score %,Marks,Total Marks,Grade,Date\n'
      : 'Assessment,Type,Subject,Score %,Marks,Total Marks,Grade,Date\n';
    const body = filtered.map(r => {
      const g = gradeLabel(r.scorePct);
      return canManage
        ? `"${r.firstName} ${r.lastName}","${r.email}","${r.assessmentTitle}","${TYPE_LABELS[r.assessmentType] || r.assessmentType}","${r.subject || ''}","${r.scorePct}","${r.scoreMarks}","${r.totalMarks}","${g.label}","${fmtDateTime(r.submittedAt)}"`
        : `"${r.assessmentTitle}","${TYPE_LABELS[r.assessmentType] || r.assessmentType}","${r.subject || ''}","${r.scorePct}","${r.scoreMarks}","${r.totalMarks}","${g.label}","${fmtDateTime(r.submittedAt)}"`;
    }).join('\n');

    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Gradebook exported');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={canManage ? 'Search by student or assessment...' : 'Search assessments...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={Award} text="No grade records found" />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  {canManage && (
                    <>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Student</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Email</th>
                    </>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Assessment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Score</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Grade</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((r, i) => {
                  const g = gradeLabel(r.scorePct);
                  return (
                    <tr key={`${r.attemptId}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      {canManage && (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{r.email}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{r.assessmentTitle}</p>
                        {r.subject && <p className="text-xs text-gray-400">{r.subject}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[r.assessmentType] || 'bg-gray-100 text-gray-600'}`}>
                          {TYPE_LABELS[r.assessmentType] || r.assessmentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{r.scorePct?.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400">{r.scoreMarks}/{r.totalMarks} marks</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-black ${g.color}`}>{g.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs hidden lg:table-cell">{fmtDateTime(r.submittedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 text-right">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Tab: Announcements ────────────────────────────────────────────────────────

const AnnouncementsTab = ({ role }) => {
  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', isPinned: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    assessmentService.listAnnouncements()
      .then(r => setItems(r.data.announcements || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body are required'); return; }
    setSaving(true);
    try {
      await assessmentService.createAnnouncement(form);
      toast.success('Announcement posted');
      setForm({ title: '', body: '', isPinned: false });
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await assessmentService.deleteAnnouncement(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePin = async (id) => {
    try {
      await assessmentService.toggleAnnouncementPin(id);
      load();
    } catch {
      toast.error('Failed to update pin');
    }
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-teal-200 dark:border-teal-700 space-y-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Post New Announcement</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Message *</label>
            <textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Write your announcement here..."
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                className="w-4 h-4 accent-teal-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Pin this announcement</span>
            </label>
            <button type="submit" disabled={saving}
              className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {saving ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={Megaphone} text="No announcements yet" />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border transition-colors ${
                item.isPinned ? 'border-teal-300 dark:border-teal-700' : 'border-gray-100 dark:border-gray-700'
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.isPinned && <Pin className="w-4 h-4 text-teal-500 shrink-0" />}
                  <h4 className="text-base font-bold text-gray-800 dark:text-gray-100">{item.title}</h4>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handlePin(item.id)}
                      title={item.isPinned ? 'Unpin' : 'Pin'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-teal-600 transition-colors">
                      {item.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{item.body}</p>
              <p className="mt-3 text-xs text-gray-400">
                Posted by {item.authorFirstName} {item.authorLastName} · {fmtDateTime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab: Reports ──────────────────────────────────────────────────────────────

const ReportsTab = ({ assessments, stats }) => {
  const typeCounts = useMemo(() => {
    const map = {};
    assessments.forEach(a => {
      map[a.assessmentType] = (map[a.assessmentType] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [assessments]);

  const maxCount = typeCounts.reduce((m, [, c]) => Math.max(m, c), 1);

  const subjectCounts = useMemo(() => {
    const map = {};
    assessments.forEach(a => {
      const k = a.subject || 'Unspecified';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [assessments]);

  const maxSubCount = subjectCounts.reduce((m, [, c]) => Math.max(m, c), 1);

  const passRate = stats && stats.submitted > 0
    ? null // would need actual pass threshold data
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assessment Types Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader icon={BarChart3} title="Assessments by Type" />
          {typeCounts.length === 0 ? (
            <EmptyState icon={BarChart3} text="No data available" />
          ) : (
            <div className="space-y-3">
              {typeCounts.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{TYPE_LABELS[type] || type}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assessments by Subject */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader icon={GraduationCap} title="Assessments by Subject" />
          {subjectCounts.length === 0 ? (
            <EmptyState icon={GraduationCap} text="No data available" />
          ) : (
            <div className="space-y-3">
              {subjectCounts.map(([subject, count]) => (
                <div key={subject}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{subject}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 ml-2">{count}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {assessments.find(a => a.subject === subject)?.year && (
                      <span>Year {assessments.find(a => a.subject === subject)?.year} • </span>
                    )}
                    {assessments.find(a => a.subject === subject)?.semester && (
                      <span>Semester {assessments.find(a => a.subject === subject)?.semester}</span>
                    )}
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(count / maxSubCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Table */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader icon={TrendingUp} title="Summary Statistics" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Assessments', value: stats.total },
              { label: 'Published', value: stats.published },
              { label: 'Drafts', value: stats.drafts },
              { label: 'Total Submissions', value: stats.submitted || stats.totalAttempts },
              { label: 'Avg Score', value: stats.avgScore ? `${stats.avgScore}%` : '—' },
              { label: 'Upcoming', value: stats.upcoming },
            ].filter(s => s.value !== undefined).map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{s.value ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <SectionHeader icon={CheckCircle2} title="Assessment Status Overview" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Assessment</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">Type</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Subject</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {assessments.slice(0, 15).map(a => {
                const { label, cls } = statusBadge(a);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate">{a.title}</td>
                    <td className="py-2.5 px-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[a.assessmentType] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[a.assessmentType] || a.assessmentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{a.subject || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-gray-400 hidden lg:table-cell">
                      {a.startAt ? `${fmt(a.startAt)} – ${fmt(a.endAt) || 'No end'}` : 'Always open'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────────────────────────

const TABS_MANAGE = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'manage', label: 'Assessments', icon: BookCheck },
  { id: 'gradebook', label: 'Gradebook', icon: Award },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const TABS_STUDENT = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'manage', label: 'My Assessments', icon: BookMarked },
  { id: 'gradebook', label: 'My Grades', icon: Award },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

export const AssessmentsDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);
  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabParam);

  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  const tabs = canManage ? TABS_MANAGE : TABS_STUDENT;

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  useEffect(() => {
    // Load stats
    assessmentService.getDashboardStats()
      .then(r => setStats(r.data.stats))
      .catch(() => {});

    // Load assessments list
    assessmentService.list()
      .then(r => setAssessments(r.data.assessments || []))
      .catch(() => toast.error('Failed to load assessments'))
      .finally(() => setAssessmentsLoading(false));
  }, []);

  const onTabChange = useCallback((tab, _opts = {}) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
    if (tab === 'manage' && _opts.openCreate) {
      navigate('/assessments/manage');
    }
  }, [setSearchParams, navigate]);

  // Lightweight edit/delete/publish from dashboard manage tab
  const handleEdit = (a) => navigate('/assessments/manage');
  const handleDelete = async (a) => {
    if (!window.confirm(`Archive "${a.title}"?`)) return;
    try {
      await assessmentService.remove(a.id);
      toast.success('Assessment archived');
      setAssessments(prev => prev.filter(x => x.id !== a.id));
    } catch {
      toast.error('Failed to archive');
    }
  };
  const handlePublish = async (a) => {
    try {
      await assessmentService.update(a.id, { isPublished: !a.isPublished });
      toast.success(a.isPublished ? 'Unpublished' : 'Published');
      setAssessments(prev => prev.map(x => x.id === a.id ? { ...x, isPublished: !x.isPublished } : x));
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {canManage ? 'Assessments Dashboard' : 'My Assessments'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {canManage
              ? 'Manage, monitor, and analyse your assessments'
              : 'View available assessments and track your progress'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => navigate('/assessments/manage')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            assessments={assessments}
            role={role}
            navigate={navigate}
            onTabChange={onTabChange}
          />
        )}
        {activeTab === 'manage' && (
          <ManageTab
            assessments={assessments}
            loading={assessmentsLoading}
            role={role}
            navigate={navigate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublish={handlePublish}
          />
        )}
        {activeTab === 'gradebook' && <GradebookTab role={role} />}
        {activeTab === 'announcements' && <AnnouncementsTab role={role} />}
        {activeTab === 'reports' && canManage && (
          <ReportsTab assessments={assessments} stats={stats} />
        )}
      </div>
    </div>
  );
};
