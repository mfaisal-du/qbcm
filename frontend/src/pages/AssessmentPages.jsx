import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCheck, Clock3, FileCheck2, ListChecks, PlayCircle, Save, ShieldCheck, Users, Volume2, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';
import { assessmentService, questionService } from '../services/api';
import { Button, Card, Input, Modal, Select, Spinner, TextArea } from '../components/Common';

const TYPES = [
  { value: 'exam', label: 'Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'irat', label: 'TBL iRAT' },
  { value: 'trat', label: 'TBL tRAT' },
];

const formatLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizeRole = (role) => (role === 'admin' ? 'administrator' : role);

const getInitialForm = () => ({
  title: '',
  description: '',
  assessmentType: 'quiz',
  subject: '',
  year: 1,
  semester: 1,
  durationMinutes: 30,
  totalMarks: 100,
  attemptLimit: 1,
  startAt: '',
  endAt: '',
  isPublished: false,
  questionIds: [],
  randomizeQuestions: false,
  randomizeOptions: false,
  teamSize: null,
  negativeMarkingRules: null,
  questionMarksConfig: null,
});

export const AssessmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);
  const isStudent = role === 'student';
  const canManage = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getInitialForm());
  const [questionSearch, setQuestionSearch] = useState('');

  const [activeAttempt, setActiveAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [attemptResult, setAttemptResult] = useState(null);

  const [attemptListModal, setAttemptListModal] = useState({ open: false, title: '', rows: [] });
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);
  const speechSynthesisRef = useRef(null);

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

  const filteredAssessments = useMemo(() => {
    if (!typeFilter) return assessments;
    return assessments.filter((a) => a.assessmentType === typeFilter);
  }, [assessments, typeFilter]);

  const filteredQuestions = useMemo(() => {
    const q = questionSearch.trim().toLowerCase();
    if (!q) return questions.slice(0, 80);
    return questions
      .filter((item) => {
        return (
          item.questionText?.toLowerCase().includes(q) ||
          item.subject?.toLowerCase().includes(q) ||
          item.topic?.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [questions, questionSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessmentsRes, attemptsRes] = await Promise.all([
        assessmentService.list({ type: typeFilter || undefined }),
        isStudent ? assessmentService.myAttempts() : Promise.resolve({ data: { attempts: [] } }),
      ]);

      setAssessments(assessmentsRes.data.assessments || []);
      setAttempts(attemptsRes.data.attempts || []);

      if (canManage) {
        const questionsRes = await questionService.getAll({ limit: 500 });
        setQuestions(questionsRes.data.questions || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load assessments module');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  useEffect(() => {
    if (!activeAttempt?.endsAt) return undefined;

    const tick = () => {
      const now = Date.now();
      const delta = Math.max(0, Math.floor((new Date(activeAttempt.endsAt).getTime() - now) / 1000));
      setRemainingSeconds(delta);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeAttempt]);

  useEffect(() => {
    if (activeAttempt && remainingSeconds === 0) {
      handleSubmitAttempt(true);
    }
  }, [remainingSeconds]);

  const resetForm = () => {
    setEditingId(null);
    setForm(getInitialForm());
    setQuestionSearch('');
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (assessment) => {
    setEditingId(assessment.id);
    setForm({
      title: assessment.title || '',
      description: assessment.description || '',
      assessmentType: assessment.assessmentType || 'quiz',
      subject: assessment.subject || '',
      year: assessment.year || 1,
      semester: assessment.semester || 1,
      durationMinutes: assessment.durationMinutes || 30,
      totalMarks: assessment.totalMarks || 100,
      attemptLimit: assessment.attemptLimit || 1,
      startAt: formatLocalInput(assessment.startAt),
      endAt: formatLocalInput(assessment.endAt),
      isPublished: !!assessment.isPublished,
      questionIds: Array.isArray(assessment.questionIds) ? assessment.questionIds.map((id) => Number(id)) : [],
      randomizeQuestions: !!assessment.randomizeQuestions,
      randomizeOptions: !!assessment.randomizeOptions,
      teamSize: assessment.teamSize || null,
      negativeMarkingRules: assessment.negativeMarkingRules || null,
      questionMarksConfig: assessment.questionMarksConfig || null,
    });
    setShowModal(true);
  };

  const toggleQuestion = (id) => {
    setForm((prev) => ({
      ...prev,
      questionIds: prev.questionIds.includes(id)
        ? prev.questionIds.filter((qId) => qId !== id)
        : [...prev.questionIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.questionIds.length) {
      toast.error('Please select at least one question');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      };

      if (editingId) {
        await assessmentService.update(editingId, payload);
        toast.success('Assessment updated');
      } else {
        await assessmentService.create(payload);
        toast.success('Assessment created');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Archive this assessment?')) return;

    try {
      await assessmentService.remove(assessmentId);
      toast.success('Assessment archived');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive assessment');
    }
  };

  const handleStartAttempt = async (assessmentId) => {
    try {
      const response = await assessmentService.startAttempt(assessmentId);
      const data = response.data;
      const answers = data.attempt?.answers || {};

      setAttemptResult(null);
      setActiveAttempt({
        assessmentId,
        attemptId: data.attempt.id,
        title: data.assessment.title,
        durationMinutes: Number(data.assessment.durationMinutes || 30),
        questions: data.questions || [],
        answers,
        endsAt: new Date(new Date(data.attempt.startedAt).getTime() + Number(data.assessment.durationMinutes || 30) * 60000).toISOString(),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start attempt');
    }
  };

  const setAnswer = (questionId, value) => {
    setActiveAttempt((prev) => ({
      ...prev,
      answers: {
        ...(prev?.answers || {}),
        [questionId]: value,
      },
    }));
  };

  const handleSubmitAttempt = async (auto = false) => {
    if (!activeAttempt) return;

    try {
      const response = await assessmentService.submitAttempt(activeAttempt.assessmentId, {
        attemptId: activeAttempt.attemptId,
        answers: activeAttempt.answers || {},
      });

      setAttemptResult(response.data.result);
      setActiveAttempt(null);
      fetchData();
      toast.success(auto ? 'Time is up. Attempt submitted.' : 'Attempt submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit attempt');
    }
  };

  const openAttemptsForAssessment = async (assessment) => {
    try {
      const response = await assessmentService.getAttempts(assessment.id);
      setAttemptListModal({ open: true, title: assessment.title, rows: response.data.attempts || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load attempt list');
    }
  };

  const formatSeconds = (seconds) => {
    const safe = Math.max(0, Number(seconds || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const attemptMap = useMemo(() => {
    return attempts.reduce((acc, row) => {
      if (!acc[row.assessmentId]) acc[row.assessmentId] = [];
      acc[row.assessmentId].push(row);
      return acc;
    }, {});
  }, [attempts]);

  if (loading) {
    return (
      <div className="tab-canvas min-h-screen p-6 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="tab-canvas min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="dashboard-hero mb-6 hero-accent hero-admin">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessments Studio</h1>
              <p className="text-gray-600 mt-1">Activity module for Exam, Quiz, Midterm, TBL iRAT, and TBL tRAT sessions.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="insight-chip"><BookCheck className="w-3.5 h-3.5 text-indigo-600" /> Exam</span>
                <span className="insight-chip"><ListChecks className="w-3.5 h-3.5 text-sky-600" /> Quiz</span>
                <span className="insight-chip"><ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Midterm</span>
                <span className="insight-chip"><Users className="w-3.5 h-3.5 text-emerald-600" /> iRAT / tRAT</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[{ label: 'All Types', value: '' }, ...TYPES]}
              />
              {canManage && (
                <Button className="flex items-center gap-2" onClick={openCreate}>
                  <Save className="w-4 h-4" /> Create Assessment
                </Button>
              )}
            </div>
          </div>
        </div>

        {attemptResult && (
          <Card className="mb-6 bg-emerald-50 border border-emerald-200">
            <p className="text-emerald-800 font-semibold">Attempt Submitted</p>
            <p className="text-sm text-emerald-700 mt-1">
              Score: {attemptResult.totalCorrect}/{attemptResult.totalQuestions} correct | {attemptResult.scorePct}% | {attemptResult.scoreMarks} marks
            </p>
            {activeAttempt && (
              <Button
                className="mt-3"
                onClick={() => navigate(`/assessments/${activeAttempt.assessmentId}/review/${activeAttempt.attemptId}`)}
              >
                View Detailed Review
              </Button>
            )}
          </Card>
        )}

        {activeAttempt && (
          <Card className="mb-6 bg-white border-2 border-indigo-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeAttempt.title}</h2>
                <p className="text-sm text-gray-500">Answer all questions and submit before timer ends.</p>
              </div>
              <div className="glass-chip text-base px-3 py-1.5">
                <Clock3 className="w-4 h-4" /> {formatSeconds(remainingSeconds)}
              </div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
{activeAttempt.questions.map((q, idx) => (
                 <div key={q.id} className="soft-card p-4 bg-white">
                   <div className="flex items-start gap-2 mb-2">
                     <p className="text-sm font-semibold text-gray-900">Q{idx + 1}. {q.questionText}</p>
                     <button
                       type="button"
                       onClick={() => speakQuestion(q.questionText, q.id)}
                       className={`p-1 rounded-full transition-all ${
                         speakingQuestionId === q.id
                           ? 'bg-teal-100 text-teal-600 animate-pulse'
                           : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                       title={speakingQuestionId === q.id ? 'Stop reading' : 'Read question aloud'}
                     >
                       {speakingQuestionId === q.id ? (
                         <PauseCircle className="w-4 h-4" />
                       ) : (
                         <Volume2 className="w-4 h-4" />
                       )}
                     </button>
                   </div>
                   {q.questionType === 'multiple_choice' ? (
                     <div className="space-y-2">
                       {(Array.isArray(q.options) ? q.options : []).map((opt, optIndex) => (
                         <label key={`${q.id}-${optIndex}`} className="flex items-center gap-2 text-sm text-gray-700">
                           <input
                             type="radio"
                             name={`q_${q.id}`}
                             value={opt}
                             checked={(activeAttempt.answers?.[q.id] || '') === opt}
                             onChange={(e) => setAnswer(q.id, e.target.value)}
                           />
                           <span>{opt}</span>
                         </label>
                       ))}
                     </div>
                   ) : (
                     <TextArea
                       rows={3}
                       value={activeAttempt.answers?.[q.id] || ''}
                       onChange={(e) => setAnswer(q.id, e.target.value)}
                       placeholder="Type your answer"
                     />
                   )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="flex items-center gap-2" onClick={() => handleSubmitAttempt(false)}>
                <FileCheck2 className="w-4 h-4" /> Submit Attempt
              </Button>
            </div>
          </Card>
        )}

        <div className="stagger-in grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredAssessments.map((a) => {
            const myRows = attemptMap[a.id] || [];
            const submittedRows = myRows.filter((row) => row.status === 'submitted');
            return (
              <Card key={a.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">{(a.assessmentType || '').toUpperCase()}</p>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{a.description || 'No description provided.'}</p>
                  </div>
                  <span className={`badge ${a.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 mb-4">
                  <div className="glass-chip">Questions: {Array.isArray(a.questionIds) ? a.questionIds.length : 0}</div>
                  <div className="glass-chip">Duration: {a.durationMinutes}m</div>
                  <div className="glass-chip">Marks: {a.totalMarks}</div>
                  <div className="glass-chip">Attempts: {a.attemptLimit}</div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>Window: {a.startAt ? new Date(a.startAt).toLocaleString() : 'Any time'} - {a.endAt ? new Date(a.endAt).toLocaleString() : 'No end date'}</p>
                  {!isStudent && (
                    <p className="mt-1">Created by: {a.creatorFirstName || ''} {a.creatorLastName || ''}</p>
                  )}
                  {isStudent && submittedRows.length > 0 && (
                    <p className="mt-1 text-indigo-700 font-medium">Best Score: {Math.max(...submittedRows.map((row) => Number(row.scorePct || 0))).toFixed(2)}%</p>
                  )}
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => openEdit(a)}>Edit</Button>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => openAttemptsForAssessment(a)}>Attempts</Button>
                    <Button
                      variant={a.isPublished ? 'danger' : 'success'}
                      className="px-3 py-1.5 text-xs"
                      onClick={() => assessmentService.update(a.id, { isPublished: !a.isPublished }).then(fetchData).catch((err) => toast.error(err.response?.data?.message || 'Update failed'))}
                    >
                      {a.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => handleDelete(a.id)}>Archive</Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button className="px-3 py-1.5 text-xs flex items-center gap-1" onClick={() => handleStartAttempt(a.id)}>
                      <PlayCircle className="w-3.5 h-3.5" /> Start / Continue
                    </Button>
                    <span className="text-xs text-gray-500 self-center">Submitted Attempts: {submittedRows.length}/{a.attemptLimit}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Assessment' : 'Create Assessment'} size="2xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Select
            label="Type"
            value={form.assessmentType}
            onChange={(e) => setForm((p) => ({ ...p, assessmentType: e.target.value }))}
            options={TYPES}
          />
          <Input label="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
          <Input label="Year" type="number" min={1} max={8} value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) || 1 }))} />
          <Input label="Semester" type="number" min={1} max={2} value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: Number(e.target.value) || 1 }))} />
          <Input label="Duration (minutes)" type="number" min={5} value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) || 30 }))} />
          <Input label="Total Marks" type="number" min={1} value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: Number(e.target.value) || 100 }))} />
          <Input label="Attempt Limit" type="number" min={1} value={form.attemptLimit} onChange={(e) => setForm((p) => ({ ...p, attemptLimit: Number(e.target.value) || 1 }))} />
          <Input label="Start At" type="datetime-local" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
          <Input label="End At" type="datetime-local" value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} />
        </div>

        <div className="mt-4">
          <TextArea label="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
          />
          <label htmlFor="published" className="text-sm text-gray-700">Publish immediately</label>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Randomization & Grading (Advanced)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                id="randomizeQuestions"
                type="checkbox"
                checked={form.randomizeQuestions}
                onChange={(e) => setForm((p) => ({ ...p, randomizeQuestions: e.target.checked }))}
              />
              <label htmlFor="randomizeQuestions" className="text-sm text-gray-700">Shuffle question order</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="randomizeOptions"
                type="checkbox"
                checked={form.randomizeOptions}
                onChange={(e) => setForm((p) => ({ ...p, randomizeOptions: e.target.checked }))}
              />
              <label htmlFor="randomizeOptions" className="text-sm text-gray-700">Randomize MCQ options</label>
            </div>
            <Input
              label="Team Size (for tRAT mode)"
              type="number"
              min={0}
              placeholder="Leave empty for no team mode"
              value={form.teamSize || ''}
              onChange={(e) => setForm((p) => ({ ...p, teamSize: e.target.value ? Number(e.target.value) : null }))}
            />
            <Input
              label="Negative Marking % (JSON)"
              placeholder='{"default": 25} or {"1": 33, "2": 25, "default": 25}'
              value={form.negativeMarkingRules ? JSON.stringify(form.negativeMarkingRules) : ''}
              onChange={(e) => {
                try {
                  const val = e.target.value.trim();
                  setForm((p) => ({ ...p, negativeMarkingRules: val ? JSON.parse(val) : null }));
                } catch {
                  // Invalid JSON, don't update
                }
              }}
            />
          </div>
          <div className="mt-3">
            <TextArea
              label="Per-Question Marks (JSON) - Maps question IDs to marks"
              rows={2}
              placeholder='{"1": 10, "2": 5} - If not set, marks are divided equally'
              value={form.questionMarksConfig ? JSON.stringify(form.questionMarksConfig) : ''}
              onChange={(e) => {
                try {
                  const val = e.target.value.trim();
                  setForm((p) => ({ ...p, questionMarksConfig: val ? JSON.parse(val) : null }));
                } catch {
                  // Invalid JSON, don't update
                }
              }}
            />
          </div>
        </div>

        <div className="mt-4">
          <Input
            label="Search Questions"
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
            placeholder="Search by text, subject, or topic"
          />
          <div className="mt-2 max-h-[260px] overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
            {filteredQuestions.map((q) => (
              <label key={q.id} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.questionIds.includes(q.id)}
                  onChange={() => toggleQuestion(q.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">#{q.id}</span> {q.questionText?.slice(0, 140)}
                  <span className="text-xs text-gray-500 block">{q.subject} | {q.topic} | {q.difficulty}</span>
                </span>
              </label>
            ))}
            {!filteredQuestions.length && <p className="text-sm text-gray-500">No questions found.</p>}
          </div>
          <p className="text-xs text-gray-500 mt-2">Selected Questions: {form.questionIds.length}</p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editingId ? 'Update Assessment' : 'Create Assessment'}</Button>
        </div>
      </Modal>

      <Modal isOpen={attemptListModal.open} onClose={() => setAttemptListModal({ open: false, title: '', rows: [] })} title={`Attempts - ${attemptListModal.title}`} size="xl">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {!attemptListModal.rows.length && (
            <p className="text-sm text-gray-500">No attempts yet for this assessment.</p>
          )}
          {attemptListModal.rows.map((row) => (
            <div key={row.id} className="soft-card p-3 bg-white flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{row.firstName} {row.lastName} ({row.email})</p>
                <p className="text-xs text-gray-500">Attempt #{row.attemptNo} | {new Date(row.startedAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-700">{row.scorePct == null ? '-' : `${Number(row.scorePct).toFixed(2)}%`}</p>
                <p className="text-xs text-gray-500">{row.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
