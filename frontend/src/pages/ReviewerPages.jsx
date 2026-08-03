import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ClipboardList, TrendingUp, ArrowRight, FileText, Activity, Archive, User, Volume2, PauseCircle } from 'lucide-react';
import { reviewService, questionService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, Button, TextArea, Badge, Spinner, Alert, StatusGuide, STATUS_TOOLTIPS } from '../components/Common';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { SimpleBarChart } from '../components/dashboard/charts/SimpleBarChart';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export const ReviewerDashboard = () => {
  const [stats, setStats] = useState({ draft: 0, vetted: 0, active: 0, used: 0, rejected: 0, archived: 0, total: 0 });
  const [recentVetted, setRecentVetted] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use dedicated stats endpoint for accurate counts (no LIMIT issue)
        const [statsRes, vettedRes] = await Promise.all([
          questionService.getStats(),
          questionService.getVetted()
        ]);

        const s = statsRes.data.stats;
        setStats({
          draft: parseInt(s.draft) || 0,
          vetted: parseInt(s.vetted) || 0,
          active: parseInt(s.active) || 0,
          used: parseInt(s.used) || 0,
          rejected: parseInt(s.rejected) || 0,
          archived: parseInt(s.archived) || 0,
          total: parseInt(s.total) || 0
        });

        setRecentVetted((vettedRes.data.questions || []).slice(0, 6));
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const approvalRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const barData = [
    { name: 'Draft', value: stats.draft },
    { name: 'Vetted', value: stats.vetted },
    { name: 'Active', value: stats.active },
    { name: 'Used', value: stats.used },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Archived', value: stats.archived },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Reviewer Dashboard</h1>
          <p className="text-gray-500">Manage and track question review workflow</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <DashboardMetricCard label="Draft" value={stats.draft} sub="new submissions" tone="yellow" icon={<FileText className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
          <DashboardMetricCard label="Vetted" value={stats.vetted} sub="under review" tone="blue" icon={<Clock className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
          <DashboardMetricCard label="Active" value={stats.active} sub={`${approvalRate}% approval`} tone="emerald" icon={<CheckCircle className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
          <DashboardMetricCard label="Used" value={stats.used} sub="in exams" tone="gray" icon={<Activity className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
          <DashboardMetricCard label="Rejected" value={stats.rejected} sub="not approved" tone="red" icon={<XCircle className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
          <DashboardMetricCard label="Archived" value={stats.archived} sub="retired" tone="amber" icon={<Archive className="w-5 h-5" />} onClick={() => navigate('/reviewer/reviews')} />
        </div>

        <StatusGuide />

        {/* Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Status Distribution</h2>
          </div>
          <SimpleBarChart data={barData} xKey="name" yKey="value" height={240} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Questions to Review</h2>
              <button onClick={() => navigate('/reviewer/reviews')}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
                Review All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentVetted.length > 0 ? recentVetted.map((q) => (
                <div key={q.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-2xl hover:bg-yellow-50 transition-colors" onClick={() => navigate('/reviewer/reviews')}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-800 text-sm truncate">{q.questionText?.substring(0, 120)}...</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{q.subject}</span>
                      <span className="text-xs text-gray-500">{q.topic}</span>
                      <span className="text-xs text-gray-400">· Y{q.year}S{q.semester}</span>
                      {(q.creatorFirstName || q.creatorLastName) && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">· <User className="w-3 h-3" /> {q.creatorFirstName} {q.creatorLastName}</span>
                      )}
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">VETTED</span>
                </div>
              )) : (
                <div className="text-center py-10 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                  <p className="font-medium">All questions reviewed!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600 p-6 text-white cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate('/reviewer/reviews')}>
              <ClipboardList className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-xl font-bold mb-1">Start Reviewing</h3>
              <p className="text-teal-100 text-sm">{stats.draft + stats.vetted} questions waiting</p>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Review Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Approval Rate</span>
                  <span className="font-bold text-green-600">{approvalRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Reviewed</span>
                  <span className="font-bold text-gray-800">{stats.active + stats.used + stats.rejected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Awaiting Review</span>
                  <span className="font-bold text-blue-600">{stats.draft + stats.vetted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReviewerQuestionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    comments: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionService.getVetted();
      setQuestions(response.data.questions || []);
    } catch (error) {
      toast.error('Failed to load questions for review');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setReviewData({ status: 'approved', comments: '' });
    // Fetch usage history
    setUsageHistory([]);
    setUsageLoading(true);
    questionService.getUsageHistory(question.id)
      .then(res => setUsageHistory(res.data.records || []))
      .catch(() => setUsageHistory([]))
      .finally(() => setUsageLoading(false));
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comments.trim()) {
      toast.error('Please add comments');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.create({
        questionId: selectedQuestion.id,
        status: reviewData.status,
        comments: reviewData.comments
      });

      toast.success('Review submitted!');
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

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

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-dark mb-8">
          {selectedQuestion ? 'Review Question' : 'Questions to Review'}
        </h1>

        {!selectedQuestion ? (
          <>
            {!questions.length ? (
              <Alert
                type="info"
                title="No Questions to Review"
                message="All questions have been reviewed!"
              />
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <Card
                    key={q.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                    onClick={() => handleSelectQuestion(q)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="mb-2 flex gap-2">
                          <Badge type="info">{q.subject}</Badge>
                          {q.cognitiveLevel && <Badge type="default">{q.cognitiveLevel}</Badge>}
                          {q.assessmentType && <Badge type="info">{q.assessmentType}</Badge>}
                        </div>
                        <h3 className="font-semibold text-dark text-lg">{q.questionText.substring(0, 100)}...</h3>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); speakQuestion(q.questionText, q.id); }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              speakingQuestionId === q.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={speakingQuestionId === q.id ? 'Stop reading' : 'Read question aloud'}
                          >
                            {speakingQuestionId === q.id ? <PauseCircle className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {speakingQuestionId === q.id ? 'Reading...' : 'Listen'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          📚 {q.topic} · ⭐ {q.difficulty} · 📊 Y{q.year}S{q.semester}
                          {(q.creatorFirstName || q.creatorLastName) && <> · 👤 {q.creatorFirstName} {q.creatorLastName}</>}
                        </p>
                        {q.learningOutcome && <p className="text-sm text-gray-700 mt-1">📝 {q.learningOutcome.substring(0, 60)}</p>}
                      </div>
                      <Badge type="warning">Under Review</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Details */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  {selectedQuestion.questionText}
                  <button
                    type="button"
                    onClick={() => speakQuestion(selectedQuestion.questionText, selectedQuestion.id)}
                    className={`p-1.5 rounded-full transition-all ${
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
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-semibold">{selectedQuestion.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cognitive Level</p>
                    <p className="font-semibold">{selectedQuestion.cognitiveLevel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Topic</p>
                    <p className="font-semibold">{selectedQuestion.topic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-semibold">{selectedQuestion.difficulty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year / Semester</p>
                    <p className="font-semibold">Y{selectedQuestion.year} / S{selectedQuestion.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assessment Type</p>
                    <p className="font-semibold">{selectedQuestion.assessmentType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-semibold">{(selectedQuestion.creatorFirstName || selectedQuestion.creatorLastName) ? `${selectedQuestion.creatorFirstName || ''} ${selectedQuestion.creatorLastName || ''}`.trim() : 'N/A'}</p>
                  </div>
                </div>

                {selectedQuestion.learningOutcome && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-gray-600 mb-1">Learning Outcome</p>
                    <p className="text-sm">{selectedQuestion.learningOutcome}</p>
                  </div>
                )}

                {selectedQuestion.competencies && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-gray-600 mb-1">Competencies</p>
                    <p className="text-sm">{selectedQuestion.competencies}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-3">Answer Options:</p>
                  <ul className="space-y-2">
                    {selectedQuestion.options?.map((option, idx) => (
                      <li key={idx} className="text-sm">
                        <strong>{String.fromCharCode(65 + idx)}.</strong> {option}
                        {option === selectedQuestion.correctAnswer && (
                          <span className="ml-2 text-success font-semibold">✓ Correct</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedQuestion.explanation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
                    <p className="text-sm">{selectedQuestion.explanation}</p>
                  </div>
                )}

                {/* Assessment Usage History (read-only) */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Assessment Usage History</p>
                  </div>
                  {usageLoading ? (
                    <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
                  ) : usageHistory.length > 0 ? (
                    <div className="bg-white rounded-lg border border-orange-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-orange-100/50 text-orange-800">
                            <th className="text-left px-3 py-2 text-xs font-semibold">Assessment</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold">Year</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold">Semester</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold">Notes</th>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No assessment usage records for this question.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Review Form */}
            <div className="lg:col-span-1">
              <Card>
                <h3 className="text-lg font-bold mb-4">Review Decision</h3>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-3">Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50">
                      <input
                        type="radio"
                        name="status"
                        value="approved"
                        checked={reviewData.status === 'approved'}
                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                        className="mr-3 w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-semibold">✓ Approve</p>
                        <p className="text-xs text-gray-600">Accept this question</p>
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer p-2 border rounded hover:bg-gray-50">
                      <input
                        type="radio"
                        name="status"
                        value="rejected"
                        checked={reviewData.status === 'rejected'}
                        onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                        className="mr-3 w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-semibold">↺ Return for Revision</p>
                        <p className="text-xs text-gray-600">Return to faculty with required changes</p>
                      </div>
                    </label>
                  </div>
                </div>

                <TextArea
                  label="Review Comments *"
                  value={reviewData.comments}
                  onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                  placeholder="Provide detailed feedback for the faculty member..."
                  rows={6}
                />

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="primary"
                    onClick={handleSubmitReview}
                    loading={submittingReview}
                    className="flex-1"
                  >
                    Submit Review
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedQuestion(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
