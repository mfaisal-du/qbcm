import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, Clock, TrendingUp, BarChart3, Award, ArrowRight, Download, Upload, Filter, Search, X, FileText, Calendar, Activity, Send, Archive, User, BookOpen, Volume2, PauseCircle } from 'lucide-react';
import { questionService, reviewService, academicService, authService } from '../services/api';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, TextArea, Select, Modal, Badge, Spinner, StatusGuide, STATUS_TOOLTIPS } from '../components/Common';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { SimpleBarChart } from '../components/dashboard/charts/SimpleBarChart';
import { SimpleDonutChart, DonutLegend } from '../components/dashboard/charts/SimpleDonutChart';
import toast from 'react-hot-toast';

export const FacultyDashboard = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalQuestions: 0, draft: 0, vetted: 0, active: 0, used: 0, rejected: 0, archived: 0, contentByType: [], recentActivity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refreshProfileIfNeeded = async () => {
      if (user?.role !== 'faculty') return;
      if (user?.assignedSubject) return;
      try {
        const { data } = await authService.getProfile();
        if (!cancelled && data?.user?.assignedSubject) {
          setUser({ ...user, ...data.user });
        }
      } catch (err) {
        console.error('Profile refresh failed', err);
      }
    };
    refreshProfileIfNeeded();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await questionService.getByCreator();
        const questions = response.data.questions || [];

        const draft = questions.filter(q => q.status === 'draft').length;
        const vetted = questions.filter(q => q.status === 'vetted').length;
        const active = questions.filter(q => q.status === 'active').length;
        const used = questions.filter(q => q.status === 'used').length;
        const rejected = questions.filter(q => q.status === 'rejected').length;
        const archived = questions.filter(q => q.status === 'archived').length;

        const typeMap = {};
        questions.forEach(q => {
          const type = q.assessmentType || 'unspecified';
          typeMap[type] = (typeMap[type] || 0) + 1;
        });
        const contentByType = Object.entries(typeMap).map(([type, count]) => ({
          name: type, count,
          pct: Math.round((count / Math.max(questions.length, 1)) * 100)
        }));

        setStats({ totalQuestions: questions.length, draft, vetted, active, used, rejected, archived, contentByType, recentActivity: questions.slice(0, 5) });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const approvalRate = Math.round((stats.active / Math.max(stats.totalQuestions, 1)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Faculty Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.firstName}! Track your contributions</p>
          {user?.assignedSubject && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-100">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-semibold">Assigned Subject: {user.assignedSubject}</span>
            </div>
          )}
        </div>

        <StatusGuide />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <DashboardMetricCard label="Total Questions" value={stats.totalQuestions} sub="all time" tone="violet" icon={<BarChart3 className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Draft" value={stats.draft} sub="work in progress" tone="yellow" icon={<FileText className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Vetted" value={stats.vetted} sub="peer review & QA" tone="blue" icon={<Clock className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Active" value={stats.active} sub="approved & ready" tone="emerald" icon={<CheckCircle className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Used" value={stats.used} sub="administered in exam" tone="gray" icon={<Activity className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Rejected" value={stats.rejected} sub="critically flawed" tone="red" icon={<XCircle className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
          <DashboardMetricCard label="Archived" value={stats.archived} sub="retired from use" tone="amber" icon={<Archive className="w-5 h-5" />} onClick={() => navigate('/faculty/questions')} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-gray-900">Question Status Breakdown</h2>
              </div>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{approvalRate}% Approval Rate</span>
            </div>
            <SimpleBarChart
              data={[
                { name: 'Draft', value: stats.draft },
                { name: 'Vetted', value: stats.vetted },
                { name: 'Active', value: stats.active },
                { name: 'Used', value: stats.used },
                { name: 'Rejected', value: stats.rejected },
                { name: 'Archived', value: stats.archived },
              ]}
              xKey="name"
              yKey="value"
              height={240}
            />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-gray-900">Assessment Type Mix</h2>
            </div>
            {stats.contentByType.length > 0 ? (
              <>
                <SimpleDonutChart
                  data={stats.contentByType.map((t) => ({ name: t.name, value: t.count }))}
                  height={220}
                />
                <DonutLegend data={stats.contentByType.map((t) => ({ name: t.name, value: t.count }))} />
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">No questions created yet.</p>
            )}
          </div>
        </div>

        {/* Recent + Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Recent Questions</h2>
              <button onClick={() => navigate('/faculty/questions')}
                className="text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? stats.recentActivity.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-violet-50 transition-colors" onClick={() => navigate('/faculty/questions')}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold text-gray-800 truncate">{q.questionText?.substring(0, 90)}...</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{q.subject}</span>
                      <span className="text-xs text-gray-400">{q.topic}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    q.status === 'active' ? 'bg-green-100 text-green-700' :
                    q.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    q.status === 'vetted' ? 'bg-blue-100 text-blue-700' :
                    q.status === 'used' ? 'bg-gray-200 text-gray-600' :
                    q.status === 'archived' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-700'
                  }`}>{q.status?.toUpperCase()}</span>
                </div>
              )) : (
                <p className="text-gray-400 text-center py-6">No questions yet</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button onClick={() => navigate('/faculty/questions')}
              className="w-full rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 text-white p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Plus className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-xl font-bold">Create Question</p>
              <p className="text-violet-200 text-sm mt-1">Add to question bank</p>
            </button>
            <button onClick={() => navigate('/faculty/contributions')}
              className="w-full rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Award className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-xl font-bold">My Contributions</p>
              <p className="text-blue-200 text-sm mt-1">View all your submissions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FacultyQuestionsPage = ({ isAdmin = false }) => {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [activeSection, setActiveSection] = useState('tags');

  // Filters
  const [filters, setFilters] = useState({ subject: '', year: '', semester: '', topic: '', clo: '', slo: '', status: '', createdFrom: '', createdTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  // Usage history for view modal
  const [questionUsage, setQuestionUsage] = useState(null);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [showAddUsage, setShowAddUsage] = useState(false);
  const [usageForm, setUsageForm] = useState({ assessmentType: 'quiz', academicYear: new Date().getFullYear(), semester: 1, notes: '' });
  const [addingUsage, setAddingUsage] = useState(false);

  // Import
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importSelected, setImportSelected] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importType, setImportType] = useState('questions');
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);

  const [subjectsList, setSubjectsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [closList, setClosList] = useState([]);
  const [slosList, setSlosList] = useState([]);
  const difficulties = ['easy', 'medium', 'hard'];
  const cognitiveLevels = ['recall', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation', 'clinical_reasoning'];
  const assessmentTypes = ['formative', 'summative'];
  const coverageTypes = ['course', 'module', 'full_program'];
  const normalizedRole = user?.role === 'admin' ? 'administrator' : user?.role;
  const canOverrideQuestionLock = normalizedRole === 'super_admin';

  // Get subjectId for selected subject name
  const getSubjectId = (subjectName) => {
    const subject = subjectsList.find(s => s.name === subjectName);
    return subject ? subject.id : null;
  };

  // Audio
  const speakQuestion = (questionText, questionId) => {
    if (!window.speechSynthesis) {
      toast.error('Text-to-speech not supported in this browser');
      return;
    }

    if (speakingQuestionId === questionId) {
      window.speechSynthesis.cancel();
      setSpeakingQuestionId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingQuestionId(null);
    setSpeakingQuestionId(questionId);
    window.speechSynthesis.speak(utterance);
  };

  // Fetch SLOs when topic changes
  useEffect(() => {
    if (formData.topic) {
      const topicObj = topicsList.find(t => t.name === formData.topic);
      if (topicObj) {
        academicService.getSLOs({ topicId: topicObj.id })
          .then(res => setSlosList(res.data.slos || []))
          .catch(() => setSlosList([]));
      } else {
        setSlosList([]);
      }
    } else {
      setSlosList([]);
    }
  }, [formData.topic, topicsList]);

  function getInitialFormData() {
    return {
      questionText: '', questionType: 'multiple_choice',
      subject: '', topic: '', clo: '', slo: '',
      year: 1, semester: 1,
      difficulty: 'medium', cognitiveLevel: 'recall',
      assessmentType: 'formative', learningOutcome: '',
      competencies: '', weighting: 0, coverage: 'course',
      courseCode: '', phase: '', options: ['', '', '', ''],
      correctAnswer: '', explanation: '', audio: ''
    };
  };

// Extract user's assigned subject for faculty
  const facultySubject = user?.role === 'faculty' ? user.assignedSubject : null;

  useEffect(() => {
    fetchQuestions();
    fetchSubjectsList();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshProfileIfNeeded = async () => {
      if (user?.role !== 'faculty') return;
      if (user?.assignedSubject) return;
      try {
        const { data } = await authService.getProfile();
        if (!cancelled && data?.user?.assignedSubject) {
          setUser({ ...user, ...data.user });
        }
      } catch (err) {
        console.error('Profile refresh failed', err);
      }
    };
    refreshProfileIfNeeded();
    return () => { cancelled = true; };
  }, [user]);

  const fetchSubjectsList = async () => {
    try {
      let subjects = [];
      if (facultySubject) {
        const response = await academicService.getSubjects({ subject: facultySubject });
        subjects = response.data.subjects || [];
      } else {
        const response = await academicService.getSubjects({});
        subjects = response.data.subjects || [];
      }
      setSubjectsList(subjects);

      if (facultySubject) {
        setFormData(prev => ({ ...prev, subject: facultySubject }));
      }

      const matchedSubject = facultySubject
        ? subjects.find(s => s.name === facultySubject)
        : subjects[0];

      if (!matchedSubject) {
        setTopicsList([]);
        setClosList([]);
        return;
      }

      setTopicsList([]);
      setClosList([]);
      const topicRes = await academicService.getTopics({ subjectId: matchedSubject.id });
      setTopicsList(topicRes.data.topics || []);
      const closRes = await academicService.getCLOs({ subjectId: matchedSubject.id });
      setClosList(closRes.data.clos || []);
    } catch (error) {
      console.error('Failed to load subjects', error);
    }
  };

  // Derive unique subject names for filters
  const subjects = useMemo(() => [...new Set(subjectsList.map(s => s.name))], [subjectsList]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await questionService.getAll()
        : await questionService.getByCreator();
      setQuestions(response.data.questions || []);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.subject && q.subject !== filters.subject) return false;
      if (filters.year && String(q.year) !== String(filters.year)) return false;
      if (filters.semester && String(q.semester) !== String(filters.semester)) return false;
      if (filters.topic && !q.topic?.toLowerCase().includes(filters.topic.toLowerCase())) return false;
      if (filters.clo && q.clo !== filters.clo) return false;
      if (filters.slo && q.slo !== filters.slo) return false;
      if (filters.status && q.status !== filters.status) return false;
      if (filters.createdFrom) {
        const created = new Date(q.createdAt);
        const from = new Date(filters.createdFrom);
        if (created < from) return false;
      }
      if (filters.createdTo) {
        const created = new Date(q.createdAt);
        const to = new Date(filters.createdTo);
        to.setHours(23, 59, 59, 999);
        if (created > to) return false;
      }
      return true;
    });
  }, [questions, filters]);

  const clearFilters = () => setFilters({ subject: '', year: '', semester: '', topic: '', clo: '', slo: '', status: '', createdFrom: '', createdTo: '' });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // CSV helpers
  const CSV_HEADERS = ['questionText','questionType','subject','topic','clo','slo','year','semester','difficulty','cognitiveLevel','assessmentType','learningOutcome','competencies','weighting','coverage','courseCode','optionA','optionB','optionC','optionD','correctAnswer','explanation','audio'];

  const csvEscape = (val) => {
    const s = val == null ? '' : String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const buildCsvRow = (q) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const vals = [
      q.questionText, q.questionType || 'multiple_choice', q.subject, q.topic,
      q.clo || '', q.slo || '', q.year, q.semester, q.difficulty, q.cognitiveLevel,
      q.assessmentType, q.learningOutcome, q.competencies, q.weighting,
      q.coverage, q.courseCode,
      opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '',
      q.correctAnswer, q.explanation, q.audio || ''
    ];
    return vals.map(csvEscape).join(',');
  };

  const parseCsvToQuestions = (text) => {
    const parseRow = (line) => {
      const result = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === ',' && !inQ) {
          result.push(cur); cur = '';
        } else cur += ch;
      }
      result.push(cur);
      return result;
    };
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = parseRow(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = parseRow(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
      return {
        questionText: row.questionText,
        questionType: row.questionType || 'multiple_choice',
        subject: row.subject, topic: row.topic, clo: row.clo || '', slo: row.slo || '',
        year: parseInt(row.year) || 1, semester: parseInt(row.semester) || 1,
        difficulty: row.difficulty || 'medium',
        cognitiveLevel: row.cognitiveLevel || 'recall',
        assessmentType: row.assessmentType || 'formative',
        learningOutcome: row.learningOutcome || '',
        competencies: row.competencies || '',
        weighting: parseFloat(row.weighting) || 0,
        coverage: row.coverage || 'course',
        courseCode: row.courseCode || '',
        options: [row.optionA || '', row.optionB || '', row.optionC || '', row.optionD || ''],
        correctAnswer: row.correctAnswer || '', explanation: row.explanation || '',
        audio: row.audio || ''
      };
    }).filter(q => q.questionText);
  };

  // Export CSV
  const handleExport = () => {
    const header = CSV_HEADERS.join(',');
    const rows = filteredQuestions.map(buildCsvRow);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredQuestions.length} questions as CSV`);
  };

  // Import CSV
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file only');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result.replace(/^\uFEFF/, '');
        const parsed = parseCsvToQuestions(text);
        if (parsed.length === 0) { toast.error('No valid questions found in the file. Check the column headers.'); return; }
        const missingSubject = parsed.filter(q => !q.subject).length;
        const missingTopic = parsed.filter(q => !q.topic).length;
        const missingYear = parsed.filter(q => !q.year).length;
        const missingDifficulty = parsed.filter(q => !q.difficulty).length;
        if (missingSubject || missingTopic || missingYear || missingDifficulty) {
          toast.error(`${parsed.length} parsed. Missing: ${missingSubject ? `${missingSubject} subject, ` : ''}${missingTopic ? `${missingTopic} topic, ` : ''}${missingYear ? `${missingYear} year, ` : ''}${missingDifficulty ? `${missingDifficulty} difficulty` : ''}`);
        }
        setImportData(parsed);
        setImportSelected(parsed.map((_, i) => i));
        setImportModal(true);
      } catch (err) {
        toast.error('Failed to parse file. Please use the exported CSV template.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImportTypeSelect = (type) => {
    setImportType(type);
    setImportData([]);
    setImportSelected([]);
  };

  const handleDownloadTemplate = () => {
    const header = CSV_HEADERS.join(',');
    const example = [
      'What is the normal resting heart rate for adults?',
      'multiple_choice', 'Physiology', 'Cardiovascular System', 'CLO1', 'SLO1.1',
      '1', '1', 'easy', 'recall', 'formative',
      'Understand normal vital signs', 'Clinical assessment', '0', 'course', 'PHYS-101',
      '60-100 bpm', '40-60 bpm', '100-140 bpm', '20-40 bpm',
      '60-100 bpm', 'Normal adult resting heart rate is 60-100 beats per minute.', ''
    ].map(csvEscape).join(',');
    const csv = [header, example].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded — fill it in Excel and import');
  };

  const toggleImportSelect = (idx) => {
    setImportSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleImport = async () => {
    if (importSelected.length === 0) { toast.error('Select at least one question'); return; }
    setImportLoading(true);
    try {
      const selectedQuestions = importSelected.map(idx => importData[idx]).filter(Boolean);
      console.log('Importing questions:', selectedQuestions.length, selectedQuestions[0]);
      const response = await questionService.batchImport({ questions: selectedQuestions });
      console.log('Import response:', response.data);
      toast.success(`Imported ${response.data.imported} questions as draft` +
        (response.data.failed > 0 ? ` (${response.data.failed} failed)` : ''));
      setImportModal(false);
      setImportData([]);
      setImportSelected([]);
      setImportType('questions');
      fetchQuestions();
    } catch (err) {
      console.error('Import error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Import failed';
      if (err?.code === 'ERR_NETWORK') {
        toast.error('Cannot reach server. Check that backend is running on port 5000.');
      } else {
        toast.error(msg);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleViewQuestion = async (q) => {
    setSelectedQuestion(q);
    setQuestionUsage(null);
    setUsageHistory([]);
    setUsageLoading(true);
    setShowAddUsage(false);
    try {
      const [usageRes, historyRes] = await Promise.all([
        questionService.getUsage(q.id),
        questionService.getUsageHistory(q.id)
      ]);
      setQuestionUsage(usageRes.data.usage);
      setUsageHistory(historyRes.data.records || []);
    } catch {
      setQuestionUsage({ totalUses: 0, distinctYears: 0, yearsUsed: [] });
      setUsageHistory([]);
    } finally { setUsageLoading(false); }
  };

  const handleAddUsage = async () => {
    if (!selectedQuestion) return;
    if (!canOverrideQuestionLock && selectedQuestion.status !== 'draft') {
      toast.error('Question is locked. Only super admin can modify usage records after draft stage.');
      return;
    }

    setAddingUsage(true);
    try {
      await questionService.addUsageHistory(selectedQuestion.id, usageForm);
      toast.success('Usage record added');
      setShowAddUsage(false);
      setUsageForm({ assessmentType: 'quiz', academicYear: new Date().getFullYear(), semester: 1, notes: '' });
      // Refresh usage data
      const [usageRes, historyRes] = await Promise.all([
        questionService.getUsage(selectedQuestion.id),
        questionService.getUsageHistory(selectedQuestion.id)
      ]);
      setQuestionUsage(usageRes.data.usage);
      setUsageHistory(historyRes.data.records || []);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add usage record');
    } finally { setAddingUsage(false); }
  };

  const handleDeleteUsage = async (usageId) => {
    if (selectedQuestion && !canOverrideQuestionLock && selectedQuestion.status !== 'draft') {
      toast.error('Question is locked. Only super admin can modify usage records after draft stage.');
      return;
    }

    try {
      await questionService.deleteUsageHistory(usageId);
      toast.success('Usage record removed');
      const [usageRes, historyRes] = await Promise.all([
        questionService.getUsage(selectedQuestion.id),
        questionService.getUsageHistory(selectedQuestion.id)
      ]);
      setQuestionUsage(usageRes.data.usage);
      setUsageHistory(historyRes.data.records || []);
    } catch { toast.error('Failed to delete usage record'); }
  };

  const handleOpenModal = (question = null) => {
    if (question) {
      if (!canOverrideQuestionLock && question.status !== 'draft') {
        toast.error('Question is locked. Only super admin can edit non-draft questions.');
        return;
      }

      setEditingId(question.id);
      const opts = Array.isArray(question.options) ? question.options : ['', '', '', ''];
      setFormData({ ...getInitialFormData(), ...question, options: opts.length >= 4 ? opts : [...opts, '', '', '', ''].slice(0, 4) });
    } else {
      setEditingId(null);
      setFormData(getInitialFormData());
    }
    setActiveSection('tags');
    setShowModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!formData.questionText || !formData.subject || !formData.correctAnswer) {
      toast.error('Please fill all required fields (Question, Subject, Correct Answer)');
      return;
    }
    try {
      if (editingId) {
        const editingQuestion = questions.find((q) => q.id === editingId);
        if (editingQuestion && !canOverrideQuestionLock && editingQuestion.status !== 'draft') {
          toast.error('Question is locked. Only super admin can edit non-draft questions.');
          return;
        }

        await questionService.update(editingId, formData);
        toast.success('Question updated');
      } else {
        await questionService.create(formData);
        toast.success('Question created');
      }
      setShowModal(false);
      setEditingId(null);
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };

  const handleDelete = async (id) => {
    const targetQuestion = questions.find((q) => q.id === id);
    if (targetQuestion && !canOverrideQuestionLock && targetQuestion.status !== 'draft') {
      toast.error('Question is locked. Only super admin can delete non-draft questions.');
      return;
    }

    if (!window.confirm('Delete this question?')) return;
    try {
      await questionService.delete(id);
      toast.success('Question deleted');
      fetchQuestions();
    } catch { toast.error('Failed to delete question'); }
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...formData.options];
    newOptions[idx] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const statusIcon = (status) => ({
    active: <CheckCircle className="w-4 h-4 text-green-600" />,
    rejected: <XCircle className="w-4 h-4 text-red-600" />,
    draft: <FileText className="w-4 h-4 text-yellow-600" />,
    vetted: <Clock className="w-4 h-4 text-blue-600" />,
    used: <Activity className="w-4 h-4 text-gray-500" />,
    archived: <Archive className="w-4 h-4 text-amber-700" />,
  }[status] || null);

  const statusBadgeClass = (status) => ({
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    vetted: 'bg-blue-100 text-blue-700',
    used: 'bg-gray-200 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
    archived: 'bg-amber-100 text-amber-800',
  }[status] || 'bg-gray-100 text-gray-600');

  const formSections = [
    { id: 'tags', label: 'Select Tags' },
    { id: 'basic', label: 'Question & Options' },
    { id: 'meta', label: 'Classification' },
    { id: 'academic', label: 'Academic Details' },
  ];

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isAdmin ? 'Question Bank Management' : 'My Questions'}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {filteredQuestions.length} of {questions.length} questions
              {activeFilterCount > 0 && <span className="ml-2 text-indigo-600 font-medium">({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active)</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${showFilters ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>{activeFilterCount}</span>}
            </button>
            <button
              onClick={handleExport}
              disabled={filteredQuestions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-green-300 hover:text-green-700 transition-all disabled:opacity-40"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-400 hover:text-gray-900 transition-all"
            >
              <FileText className="w-4 h-4" /> Template
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Question
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" /> Filter Questions
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All Years</option>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <select value={filters.semester} onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <input
                value={filters.topic} onChange={e => setFilters(f => ({ ...f, topic: e.target.value }))}
                placeholder="Search topic..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none"
              />
              <select value={filters.clo} onChange={e => setFilters(f => ({ ...f, clo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All CLOs</option>
                {[...new Set(questions.map(q => q.clo).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.slo} onChange={e => setFilters(f => ({ ...f, slo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All SLOs</option>
                {[...new Set(questions.map(q => q.slo).filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="vetted">Vetted</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="date" value={filters.createdFrom} onChange={e => setFilters(f => ({ ...f, createdFrom: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none"
                  title="Created from"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input type="date" value={filters.createdTo} onChange={e => setFilters(f => ({ ...f, createdTo: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-indigo-300 outline-none"
                  title="Created to"
                />
              </div>
            </div>
          </div>
        )}

        {/* Question List */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center py-16">
            <p className="text-gray-400 text-lg mb-3">{questions.length === 0 ? 'No questions yet' : 'No questions match your filters'}</p>
            {questions.length === 0
              ? <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Create First Question</button>
              : <button onClick={clearFilters} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Clear Filters</button>
            }
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-indigo-100 group">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {statusIcon(q.status)}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(q.status)}`} title={STATUS_TOOLTIPS[q.status] || ''}>{q.status?.toUpperCase()}</span>
                      {!canOverrideQuestionLock && q.status !== 'draft' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700" title="Locked after draft stage">
                          LOCKED
                        </span>
                      )}
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{q.subject}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Y{q.year}·S{q.semester}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                        q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>{q.difficulty}</span>
                      {q.cognitiveLevel && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{q.cognitiveLevel}</span>}
                    </div>
                    <p className="text-gray-800 font-medium leading-snug mb-1">{q.questionText?.substring(0, 150)}{q.questionText?.length > 150 ? '…' : ''}</p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-xs text-gray-400">Topic: {q.topic}</p>
                      {(q.creatorFirstName || q.creatorLastName) && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {q.creatorFirstName} {q.creatorLastName}
                        </p>
                      )}
                      {q.createdAt && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleViewQuestion(q)} className="p-2 rounded-xl hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(q)}
                      disabled={!canOverrideQuestionLock && q.status !== 'draft'}
                      className="p-2 rounded-xl hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                      title={!canOverrideQuestionLock && q.status !== 'draft' ? 'Locked: only super admin can edit non-draft questions' : 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={!canOverrideQuestionLock && q.status !== 'draft'}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                      title={!canOverrideQuestionLock && q.status !== 'draft' ? 'Locked: only super admin can delete non-draft questions' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create / Edit Modal ─────────────────────── */}
        <Modal isOpen={showModal && !selectedQuestion} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? 'Edit Question' : 'Create New Question'} size="xl">
          {/* Section Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {formSections.map((s, idx) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeSection === s.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1.5 ${activeSection === s.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Section: Select Tags */}
          {activeSection === 'tags' && (
            <div className="space-y-5">
              {facultySubject && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Subject:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {facultySubject}
                  </span>
                </div>
              )}

               <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic</label>
                <select
                  value={formData.topic}
                  onChange={e => {
                    const selectedTopicName = e.target.value;
                    const selectedTopic = topicsList.find(t => t.name === selectedTopicName);
                    setFormData({ ...formData, topic: selectedTopicName, clo: '', slo: '' });
                    if (selectedTopic) {
                      academicService.getSLOs({ topicId: selectedTopic.id })
                        .then(res => setSlosList(res.data.slos || []))
                        .catch(() => setSlosList([]));
                    } else {
                      setSlosList([]);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
                >
                  <option value="">Select Topic</option>
                  {topicsList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CLO (Course Learning Outcome) <span className="text-gray-400 text-xs">(optional)</span></label>
                <select
                  value={formData.clo}
                  onChange={e => setFormData({ ...formData, clo: e.target.value, slo: '' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
                >
                  <option value="">Select CLO</option>
                  {closList.map(c => <option key={c.id} value={c.code}>{c.code}: {c.description?.substring(0, 60)}{c.description?.length > 60 ? '…' : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SLO (Student Learning Outcome) <span className="text-gray-400 text-xs">(optional)</span></label>
                <select
                  value={formData.slo}
                  onChange={e => setFormData({ ...formData, slo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
                >
                  <option value="">Select SLO</option>
                  {slosList.map(s => <option key={s.id} value={s.code}>{s.code}: {s.description?.substring(0, 60)}{s.description?.length > 60 ? '…' : ''}</option>)}
                </select>
              </div>

              {formData.topic && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-1 uppercase">Selected Tags</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.subject && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{formData.subject}</span>}
                    {formData.topic && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{formData.topic}</span>}
                    {formData.clo && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{formData.clo}</span>}
                    {formData.slo && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{formData.slo}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Question & Options */}
          {activeSection === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question Text <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.questionText}
                  onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none bg-gray-50"
                  placeholder="Enter your question here..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Answer Options <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{String.fromCharCode(65 + i)}</span>
                      <input
                        value={opt} onChange={e => handleOptionChange(i, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
                <select value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                  <option value="">-- Select correct answer --</option>
                  {formData.options.filter(Boolean).map((opt, i) => (
                    <option key={i} value={opt}>{String.fromCharCode(65 + formData.options.indexOf(opt))}. {opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation</label>
                <textarea
                  value={formData.explanation}
                  onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none bg-gray-50"
                  placeholder="Explain why this answer is correct..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Audio URL <span className="text-gray-400 text-xs">(optional)</span></label>
                <input
                  value={formData.audio || ''}
                  onChange={e => setFormData({ ...formData, audio: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50"
                  placeholder="https://example.com/audio.mp3"
                />
                <p className="text-xs text-gray-400 mt-1">Paste a direct audio file URL. Supports mp3, wav, ogg.</p>
              </div>
            </div>
          )}

          {/* Section: Classification */}
          {activeSection === 'meta' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                  <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cognitive Level</label>
                  <select value={formData.cognitiveLevel} onChange={e => setFormData({ ...formData, cognitiveLevel: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    {cognitiveLevels.map(cl => <option key={cl} value={cl}>{cl.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                  <select value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Semester</label>
                  <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>
            </div>
          )}

{/* Section: Academic Details */}
          {activeSection === 'academic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assessment Type</label>
                  <select value={formData.assessmentType} onChange={e => setFormData({ ...formData, assessmentType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    {assessmentTypes.map(at => <option key={at} value={at}>{at.charAt(0).toUpperCase() + at.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Coverage</label>
                  <select value={formData.coverage} onChange={e => setFormData({ ...formData, coverage: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50">
                    {coverageTypes.map(ct => <option key={ct} value={ct}>{ct.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Code</label>
                  <input value={formData.courseCode} readOnly
                    placeholder="Auto-filled from subject"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-100 outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phase</label>
                  <input value={formData.phase || ''} readOnly
                    placeholder="Auto-filled from subject"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-100 outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weighting (%)</label>
                  <input type="number" value={formData.weighting} onChange={e => setFormData({ ...formData, weighting: parseFloat(e.target.value) || 0 })}
                    min={0} max={100}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Learning Outcome</label>
                <textarea value={formData.learningOutcome} onChange={e => setFormData({ ...formData, learningOutcome: e.target.value })}
                  rows={2} placeholder="What should students learn from this topic?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Competencies</label>
                <input value={formData.competencies} onChange={e => setFormData({ ...formData, competencies: e.target.value })}
                  placeholder="e.g. Clinical reasoning, Diagnosis skills"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-gray-50" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-5 mt-5 border-t">
            {activeSection !== 'tags' && (
              <button onClick={() => {
                const idx = formSections.findIndex(s => s.id === activeSection);
                setActiveSection(formSections[idx - 1].id);
              }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            )}
            {activeSection !== 'academic' ? (
              <button onClick={() => {
                const idx = formSections.findIndex(s => s.id === activeSection);
                setActiveSection(formSections[idx + 1].id);
              }}
                className="ml-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={handleSaveQuestion}
                className="ml-auto px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                {editingId ? 'Save Changes' : 'Create Question'}
              </button>
            )}
            <button onClick={() => { setShowModal(false); setEditingId(null); }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>

         {/* ── View Details Modal ─────────────────────── */}
         {selectedQuestion && (
           <Modal isOpen={!!selectedQuestion} onClose={() => setSelectedQuestion(null)} title="Question Details" size="lg">
             <div className="space-y-5">
               <div className="flex items-center gap-3">
                 {statusIcon(selectedQuestion.status)}
                 <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusBadgeClass(selectedQuestion.status)}`}>{selectedQuestion.status?.toUpperCase()}</span>
                 <span className="text-sm bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-full">{selectedQuestion.subject}</span>
               </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wide">Question</p>
                  <div className="flex items-start gap-2">
                    <p className="text-gray-900 font-medium leading-relaxed flex-1">{selectedQuestion.questionText}</p>
                    <button
                      type="button"
                      onClick={() => speakQuestion(selectedQuestion.questionText, selectedQuestion.id)}
                      className={`p-1.5 rounded-full transition-all shrink-0 ${
                        speakingQuestionId === selectedQuestion.id
                          ? 'bg-teal-100 text-teal-600 animate-pulse'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={speakingQuestionId === selectedQuestion.id ? 'Stop reading' : 'Read question aloud'}
                    >
                      {speakingQuestionId === selectedQuestion.id ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {[
                   { label: 'Year', value: `Year ${selectedQuestion.year}` },
                   { label: 'Semester', value: `Semester ${selectedQuestion.semester}` },
                   { label: 'Course Code', value: selectedQuestion.courseCode || '—' },
                   { label: 'Phase', value: selectedQuestion.phase || '—' },
                   { label: 'Difficulty', value: selectedQuestion.difficulty },
                   { label: 'Topic', value: selectedQuestion.topic },
                   { label: 'CLO', value: selectedQuestion.clo || '—' },
                   { label: 'SLO', value: selectedQuestion.slo || '—' },
                   { label: 'Created By', value: (selectedQuestion.creatorFirstName || selectedQuestion.creatorLastName) ? `${selectedQuestion.creatorFirstName || ''} ${selectedQuestion.creatorLastName || ''}`.trim() : 'N/A' },
                   { label: 'Created On', value: selectedQuestion.createdAt ? new Date(selectedQuestion.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' },
                 ].map(({ label, value }) => (
                   <div key={label} className="bg-gray-50 rounded-xl p-3">
                     <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                     <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
                   </div>
                 ))}
               </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Answer Options</p>
                <div className="space-y-2">
                  {Array.isArray(selectedQuestion.options) ? selectedQuestion.options.filter(Boolean).map((opt, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${opt === selectedQuestion.correctAnswer ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${opt === selectedQuestion.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{String.fromCharCode(65 + i)}</span>
                      <span className="text-sm text-gray-800">{opt}</span>
                      {opt === selectedQuestion.correctAnswer && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                    </div>
                  )) : <p className="text-gray-400 text-sm">No options</p>}
                </div>
              </div>
              {selectedQuestion.explanation && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">Explanation</p>
                  <p className="text-sm text-gray-700">{selectedQuestion.explanation}</p>
                </div>
              )}
              {selectedQuestion.audio && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-xs text-purple-600 font-medium mb-2 uppercase tracking-wide">Audio</p>
                  <audio controls src={selectedQuestion.audio} className="w-full" preload="metadata">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {/* Usage / Exam History */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Assessment Usage History</p>
                  </div>
                  <button
                    onClick={() => setShowAddUsage(!showAddUsage)}
                    disabled={!canOverrideQuestionLock && selectedQuestion.status !== 'draft'}
                    className="text-xs bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-600"
                    title={!canOverrideQuestionLock && selectedQuestion.status !== 'draft' ? 'Locked: only super admin can modify usage records after draft stage' : 'Add Record'}
                  >
                    <Plus className="w-3 h-3" /> Add Record
                  </button>
                </div>

                {/* Add Usage Form */}
                {showAddUsage && (
                  <div className="bg-white rounded-lg p-3 border border-orange-200 mb-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Assessment Type</label>
                        <select value={usageForm.assessmentType} onChange={e => setUsageForm({ ...usageForm, assessmentType: e.target.value })}
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value="quiz">Quiz</option>
                          <option value="midterm">Mid Term</option>
                          <option value="endcourse">End Course</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Academic Year</label>
                        <input type="number" min="2000" max="2099" value={usageForm.academicYear}
                          onChange={e => setUsageForm({ ...usageForm, academicYear: parseInt(e.target.value) || '' })}
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Semester</label>
                        <select value={usageForm.semester} onChange={e => setUsageForm({ ...usageForm, semester: parseInt(e.target.value) })}
                          className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value={1}>Semester 1</option>
                          <option value={2}>Semester 2</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Notes (optional)</label>
                      <input type="text" value={usageForm.notes} onChange={e => setUsageForm({ ...usageForm, notes: e.target.value })}
                        placeholder="e.g. Section A, Paper 1" className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowAddUsage(false)} className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50">Cancel</button>
                      <button
                        onClick={handleAddUsage}
                        disabled={addingUsage || (!canOverrideQuestionLock && selectedQuestion.status !== 'draft')}
                        className="text-xs bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canOverrideQuestionLock && selectedQuestion.status !== 'draft' ? 'Locked: only super admin can add usage records after draft stage' : 'Save Record'}
                      >
                        {addingUsage ? 'Adding...' : 'Save Record'}
                      </button>
                    </div>
                  </div>
                )}

                {usageLoading ? (
                  <p className="text-sm text-gray-500 animate-pulse">Loading usage data...</p>
                ) : (
                  <div className="space-y-3">
                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2.5 border border-orange-100 text-center">
                        <p className="text-xl font-bold text-orange-700">{usageHistory.length}</p>
                        <p className="text-xs text-gray-500">Total Records</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-orange-100 text-center">
                        <p className="text-xl font-bold text-orange-700">{questionUsage?.distinctYears || 0}</p>
                        <p className="text-xs text-gray-500">Years Used</p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-orange-100 text-center">
                        <p className="text-xl font-bold text-orange-700">{[...new Set(usageHistory.map(r => r.assessmentType))].length}</p>
                        <p className="text-xs text-gray-500">Assessment Types</p>
                      </div>
                    </div>

                    {/* Usage records table */}
                    {usageHistory.length > 0 ? (
                      <div className="bg-white rounded-lg border border-orange-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-orange-100/50 text-orange-800">
                              <th className="text-left px-3 py-2 text-xs font-semibold">Assessment</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold">Year</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold">Semester</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold">Notes</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-50">
                            {usageHistory.map(record => (
                              <tr key={record.id} className="hover:bg-orange-50/50">
                                <td className="px-3 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    record.assessmentType === 'quiz' ? 'bg-blue-100 text-blue-700' :
                                    record.assessmentType === 'midterm' ? 'bg-purple-100 text-purple-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {record.assessmentType === 'quiz' ? 'Quiz' : record.assessmentType === 'midterm' ? 'Mid Term' : 'End Course'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-700">{record.academicYear}</td>
                                <td className="px-3 py-2 text-gray-700">Sem {record.semester}</td>
                                <td className="px-3 py-2 text-gray-500 text-xs">{record.notes || '—'}</td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => handleDeleteUsage(record.id)}
                                    disabled={!canOverrideQuestionLock && selectedQuestion.status !== 'draft'}
                                    className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-red-400"
                                    title={!canOverrideQuestionLock && selectedQuestion.status !== 'draft' ? 'Locked: only super admin can delete usage records after draft stage' : 'Delete record'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">No assessment usage records yet. Click "Add Record" to log when this question was used.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    if (!canOverrideQuestionLock && selectedQuestion.status !== 'draft') {
                      toast.error('Question is locked. Only super admin can edit non-draft questions.');
                      return;
                    }
                    handleOpenModal(selectedQuestion);
                    setSelectedQuestion(null);
                  }}
                  disabled={!canOverrideQuestionLock && selectedQuestion.status !== 'draft'}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                  title={!canOverrideQuestionLock && selectedQuestion.status !== 'draft' ? 'Locked: only super admin can edit non-draft questions' : 'Edit Question'}
                >
                  Edit Question
                </button>
                <button onClick={() => setSelectedQuestion(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Import Modal ─────────────────────── */}
        <Modal isOpen={importModal} onClose={() => { setImportModal(false); setImportData([]); setImportSelected([]); setImportType('questions'); }} title={`Import ${importType}`} size="xl">
          {!importData.length ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">What do you want to import?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'questions', label: 'Questions' },
                    { key: 'topics', label: 'Topics' },
                    { key: 'clos', label: 'CLOs' },
                    { key: 'slos', label: 'SLOs' }
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => handleImportTypeSelect(key)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${importType === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload CSV</label>
                <input type="file" accept=".csv" onChange={handleFileSelect}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50" />
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                {importType === 'questions' && <>Expected columns: questionText, subject, topic, year, semester, difficulty, optionA–D, correctAnswer, explanation — <button onClick={handleDownloadTemplate} className="text-indigo-600 hover:underline font-medium">download template</button></>}
                {importType === 'topics' && <>Expected columns: subject, topic, description</>}
                {importType === 'clos' && <>Expected columns: subject, clo, description</>}
                {importType === 'slos' && <>Expected columns: subject, topic, slo, description</>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <p className="text-sm font-medium text-indigo-700">{importSelected.length} of {importData.length} selected for import</p>
                <div className="flex gap-2">
                  <button onClick={() => setImportSelected(importData.map((_, i) => i))}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Select All</button>
                  <button onClick={() => setImportSelected([])}
                    className="text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50">None</button>
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {importData.map((q, i) => (
                    <div key={i} onClick={() => toggleImportSelect(i)}
                      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${importSelected.includes(i) ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-white hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${importSelected.includes(i) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                        {importSelected.includes(i) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium leading-snug">{q.questionText?.substring(0, 100)}{q.questionText?.length > 100 ? '…' : ''}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {q.subject && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{q.subject}</span>}
                          {q.topic && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.topic}</span>}
                          {q.clo && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{q.clo}</span>}
                          {q.slo && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{q.slo}</span>}
                          {q.year && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Y{q.year}·S{q.semester}</span>}
                          {q.difficulty && <span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{q.difficulty}</span>}
                  </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t">
                <button onClick={handleImport} disabled={importLoading || importSelected.length === 0}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {importLoading ? <><Spinner size="sm" /> Importing...</> : `Import ${importSelected.length} ${importType}`}
                </button>
                <button onClick={() => { setImportModal(false); setImportData([]); setImportSelected([]); setImportType('questions'); }}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export const FacultyContributionsPage = () => {
  const [contributions, setContributions] = useState({ draft: 0, vetted: 0, active: 0, used: 0, rejected: 0, archived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await questionService.getByCreator();
        const qs = response.data.questions || [];
        setContributions({
          draft: qs.filter(q => q.status === 'draft').length,
          vetted: qs.filter(q => q.status === 'vetted').length,
          active: qs.filter(q => q.status === 'active').length,
          used: qs.filter(q => q.status === 'used').length,
          rejected: qs.filter(q => q.status === 'rejected').length,
          archived: qs.filter(q => q.status === 'archived').length
        });
      } catch (error) {
        toast.error('Failed to load contributions');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-dark mb-8">My Contributions</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <Card className="text-center">
            <FileText className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-4xl font-bold text-yellow-500">{contributions.draft}</p>
            <p className="text-gray-600 mt-2">Draft</p>
          </Card>
          <Card className="text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-blue-600">{contributions.vetted}</p>
            <p className="text-gray-600 mt-2">Vetted</p>
          </Card>
          <Card className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-green-600">{contributions.active}</p>
            <p className="text-gray-600 mt-2">Active</p>
          </Card>
          <Card className="text-center">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-4xl font-bold text-gray-500">{contributions.used}</p>
            <p className="text-gray-600 mt-2">Used</p>
          </Card>
          <Card className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-red-600">{contributions.rejected}</p>
            <p className="text-gray-600 mt-2">Rejected</p>
          </Card>
          <Card className="text-center">
            <Archive className="w-12 h-12 text-amber-700 mx-auto mb-3" />
            <p className="text-4xl font-bold text-amber-700">{contributions.archived}</p>
            <p className="text-gray-600 mt-2">Archived</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
