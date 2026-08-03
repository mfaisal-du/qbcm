import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Filter, ChevronRight, CheckCircle, XCircle, TrendingUp, BarChart3, Target, ArrowRight, Volume2, PauseCircle } from 'lucide-react';
import { questionService, studentAnswerService, academicService } from '../services/api';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Select, Spinner, Alert, Badge } from '../components/Common';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { SimpleBarChart } from '../components/dashboard/charts/SimpleBarChart';
import toast from 'react-hot-toast';

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAttempts: 0, correctAnswers: 0, accuracy: 0, subjectStats: [] });
  const [academicStats, setAcademicStats] = useState({ subjects: 0, topics: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [resultsRes, subjectsRes, topicsRes] = await Promise.all([
          studentAnswerService.getMyResults(),
          academicService.getSubjects({ limit: 1 }),
          academicService.getTopics({ limit: 1 })
        ]);
        
        const results = resultsRes.data.results || [];

        if (results.length > 0) {
          const correctCount = results.filter(r => r.isCorrect).length;
          const accuracy = Math.round((correctCount / results.length) * 100);

          const subjectMap = {};
          results.forEach(r => {
            const subj = r.subject || 'General';
            if (!subjectMap[subj]) subjectMap[subj] = { total: 0, correct: 0 };
            subjectMap[subj].total++;
            if (r.isCorrect) subjectMap[subj].correct++;
          });

          const subjectStats = Object.entries(subjectMap).map(([name, c]) => ({
            name, correct: c.correct, total: c.total,
            pct: Math.round((c.correct / c.total) * 100)
          }));

          setStats({ totalAttempts: results.length, correctAnswers: correctCount, accuracy, subjectStats });
        }

        setAcademicStats({
          subjects: subjectsRes.data.subjects?.length || 0,
          topics: topicsRes.data.topics?.length || 0
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const chartData = stats.subjectStats.map(s => ({ name: s.name, value: s.pct, full: s.total, correct: s.correct }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Student Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.firstName}! Keep up the great work.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashboardMetricCard label="Total Attempts" value={stats.totalAttempts} sub="questions answered" tone="blue" icon={<BarChart3 className="w-6 h-6" />} onClick={() => navigate('/student/results')} />
          <DashboardMetricCard label="Correct Answers" value={stats.correctAnswers} sub={`out of ${stats.totalAttempts}`} tone="emerald" icon={<CheckCircle className="w-6 h-6" />} onClick={() => navigate('/student/results')} />
          <DashboardMetricCard label="Accuracy Rate" value={`${stats.accuracy}%`} sub="overall performance" tone="violet" icon={<Target className="w-6 h-6" />} onClick={() => navigate('/student/results')} />
          <DashboardMetricCard label="Subjects Covered" value={academicStats.subjects} sub={`${academicStats.topics} topics available`} tone="indigo" icon={<BookOpen className="w-6 h-6" />} onClick={() => navigate('/student/practice')} />
        </div>

        {/* Charts + Subject Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Subject Accuracy %</h2>
            </div>
            {chartData.length > 0 ? (
              <SimpleBarChart data={chartData} xKey="name" yKey="value" height={260} color="#6366f1" formatTooltip={(v) => `${v}% accuracy`} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">Practice questions to see subject performance data.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Latest Results</h2>
            </div>
            <div className="overflow-x-auto">
              <ResultsTable navigate={navigate} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => navigate('/student/practice')}
            className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5">
            <BookOpen className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-xl font-bold">Start Practice</p>
            <p className="text-blue-200 text-sm mt-1">Practice faculty-created questions by subject.</p>
            <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm font-medium">
              Practice Now <ArrowRight className="w-4 h-4" />
            </div>
          </button>
          <button onClick={() => navigate('/student/results')}
            className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 text-left hover:shadow-xl transition-all hover:-translate-y-0.5">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-xl font-bold">View Results</p>
            <p className="text-emerald-100 text-sm mt-1">See your detailed answer history and progress.</p>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 text-sm font-medium">
              View History <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export const StudentPracticePage = () => {
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '', yearNumber: '', semester: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const difficulties = ['easy', 'medium', 'hard'];
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    loadAcademicStructure();
  }, []);

  useEffect(() => {
    if (!filters.yearNumber && !filters.semester) {
      loadAcademicStructure();
    }
  }, [filters.yearNumber, filters.semester]);

  const loadAcademicStructure = async () => {
    try {
      const subjectsRes = await academicService.getSubjects({});
      const subjectsList = subjectsRes.data.subjects || [];
      setSubjects(subjectsList);
      
      if (filters.subject) {
        const subjectObj = subjectsList.find(s => s.name === filters.subject);
        if (subjectObj) {
          const topicsRes = await academicService.getTopics({ subjectId: subjectObj.id });
          setTopics(topicsRes.data.topics || []);
        }
      } else if (filters.yearNumber && filters.semester) {
        const filteredSubjects = subjectsList.filter(s => 
          s.yearNumber == filters.yearNumber && s.semester == filters.semester
        );
        setTopics([]);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error('Failed to load academic structure', error);
    }
  };

  useEffect(() => { fetchQuestions(); }, [filters]);

  const getYearOptions = () => {
    const years = Array.from({ length: 7 }, (_, i) => i + 1);
    return years.map(y => ({ label: `Year ${y}`, value: y }));
  };

  const getSemesterOptions = () => {
    return [1, 2].map(s => ({ label: `Semester ${s}`, value: s }));
  };

  const getSubjectOptions = () => {
    const filtered = filters.yearNumber && filters.semester
      ? subjects.filter(s => s.yearNumber == filters.yearNumber && s.semester == filters.semester)
      : subjects;
    return filtered.map(s => ({ label: `${s.courseCode ? s.courseCode + ' - ' : ''}${s.name}`, value: s.name }));
  };

  const getTopicOptions = () => {
    return topics.map(t => ({ label: t.name, value: t.name }));
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionService.getPractice({
        subject: filters.subject || undefined,
        topic: filters.topic || undefined,
        difficulty: filters.difficulty || undefined,
        year: filters.yearNumber ? Number(filters.yearNumber) : undefined,
        semester: filters.semester ? Number(filters.semester) : undefined,
        limit: 30
      });
      setQuestions(response.data.questions);
      setSelectedAnswers({});
      setCurrentQuestionIdx(0);
      setSubmitted(false);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIdx].id]: answer
    }));
  };

  const handleSubmitAnswer = async () => {
    const question = questions[currentQuestionIdx];
    const selectedAnswer = selectedAnswers[question.id];

    if (selectedAnswer === undefined) {
      toast.error('Please select an answer');
      return;
    }

    try {
      await studentAnswerService.submit({
        questionId: question.id,
        selectedAnswer: selectedAnswer,
        timeSpent: 30
      });
      
      setSubmitted(true);
      toast.success(selectedAnswer === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSubmitted(false);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
      setSubmitted(false);
    }
  };

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

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const currentQuestion = questions[currentQuestionIdx];
  const selectedAnswer = selectedAnswers[currentQuestion?.id];
  const isCorrect = submitted && selectedAnswer === currentQuestion?.correctAnswer;

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Practice Questions
          </h1>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Year"
              options={getYearOptions()}
              value={filters.yearNumber}
              onChange={(e) => {
                const year = e.target.value;
                setFilters({ ...filters, yearNumber: year, semester: '', subject: '' });
              }}
            />
            <Select
              label="Semester"
              options={getSemesterOptions()}
              value={filters.semester}
              onChange={(e) => {
                const semester = e.target.value;
                setFilters({ ...filters, semester, subject: '' });
              }}
            />
            <Select
              label="Subject"
              options={getSubjectOptions()}
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            />
            <Select
              label="Difficulty"
              options={difficulties.map(d => ({ label: d, value: d }))}
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            />
            <div className="md:col-span-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ subject: '', topic: '', difficulty: '', yearNumber: '', semester: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

{!questions.length ? (
           <Alert type="info" title="No Questions Found" message="Try adjusting your filters" />
         ) : (
           <>
             {/* Progress */}
             <div className="mb-4 bg-white rounded-lg p-4">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm font-semibold">
                   Question {currentQuestionIdx + 1} of {questions.length}
                 </span>
                 <span className="text-sm text-gray-600">
                   {Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}% Complete
                 </span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div
                   className="bg-primary h-2 rounded-full transition-all"
                   style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                 ></div>
               </div>
             </div>

{/* Question Card */}
              <Card className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentQuestion.courseCode && (
                        <Badge type="info">{currentQuestion.courseCode}</Badge>
                      )}
                      {currentQuestion.subject && (
                        <Badge type="info">{currentQuestion.subject}</Badge>
                      )}
                      {currentQuestion.year && (
                        <Badge type="secondary">Y{currentQuestion.year}</Badge>
                      )}
                      {currentQuestion.semester && (
                        <Badge type="secondary">Sem {currentQuestion.semester}</Badge>
                      )}
                      {currentQuestion.phase && (
                        <Badge type={currentQuestion.phase === 'Basic' ? 'success' : currentQuestion.phase === 'Integrated' ? 'warning' : 'error'}>
                          {currentQuestion.phase}
                        </Badge>
                      )}
                      {currentQuestion.topic && (
                        <Badge type="secondary">{currentQuestion.topic}</Badge>
                      )}
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <h2 className="text-xl font-bold">{currentQuestion.questionText}</h2>
                      <button
                        type="button"
                        onClick={() => speakQuestion(currentQuestion.questionText, currentQuestion.id)}
                        className={`p-1.5 rounded-full transition-all ${
                          speakingQuestionId === currentQuestion.id
                            ? 'bg-teal-100 text-teal-600 animate-pulse'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={speakingQuestionId === currentQuestion.id ? 'Stop reading' : 'Read question aloud'}
                      >
                        {speakingQuestionId === currentQuestion.id ? (
                          <PauseCircle className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Badge
                    type={
                      currentQuestion.difficulty === 'easy'
                        ? 'success'
                        : currentQuestion.difficulty === 'medium'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>

                {/* Options */}
                <div className="space-y-3 mt-6">
                  {currentQuestion.options?.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAnswer === option
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        submitted &&
                        (option === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-50'
                          : option === selectedAnswer && !isCorrect
                          ? 'border-red-500 bg-red-50'
                          : '')
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={() => !submitted && handleSelectAnswer(option)}
                        disabled={submitted}
                        className="mt-1 mr-3"
                      />
                      <span className="flex-1">{option}</span>
                      {submitted && option === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                      {submitted && selectedAnswer === option && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Explanation */}
                {submitted && (
                  <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-semibold mb-2">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
                    <p className="text-sm">{currentQuestion.explanation || 'No explanation available'}</p>
                  </div>
                )}
              </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="ghost"
                onClick={handlePrevQuestion}
                disabled={isSubmitting || currentQuestionIdx === 0}
              >
                Previous
              </Button>

              {!submitted ? (
                <Button
                  variant="primary"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !selectedAnswer}
                  className="flex items-center gap-2"
                >
                  Submit Answer <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting || currentQuestionIdx === questions.length - 1}
                  className="flex items-center gap-2"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const StudentResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await studentAnswerService.getMyResults();
        setResults(response.data);
      } catch (error) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>;

  const { stats, results: resultsList } = results || {};

  return (
    <div className="min-h-screen bg-light p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-dark mb-8">My Results</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Questions</p>
              <p className="text-3xl font-bold text-primary">{stats.totalQuestions}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-2">Correct</p>
              <p className="text-3xl font-bold text-success">{stats.correctAnswers}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-2">Incorrect</p>
              <p className="text-3xl font-bold text-danger">{stats.incorrectAnswers}</p>
            </Card>
            <Card className="text-center">
              <p className="text-sm text-gray-600 mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-primary">{stats.percentage || 0}%</p>
            </Card>
          </div>
        )}

        <Card>
          <h2 className="text-xl font-bold mb-4">Answer History</h2>
          {!resultsList?.length ? (
            <p className="text-gray-600">No results yet</p>
          ) : (
            <div className="space-y-3">
              {resultsList.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-semibold">{result.questionText.substring(0, 50)}...</p>
                    <p className="text-sm text-gray-600">{result.subject} - {result.topic}</p>
                  </div>
                  {result.isCorrect ? (
                    <Badge type="success">✓ Correct</Badge>
                  ) : (
                    <Badge type="error">✗ Incorrect</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
