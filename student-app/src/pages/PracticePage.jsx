import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, XCircle, BookOpen, X, Play, Volume2, PauseCircle } from 'lucide-react';
import { questionService, studentAnswerService, academicService } from '../services/api';
import toast from 'react-hot-toast';

export default function PracticePage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [filters, setFilters] = useState({ year: '', semester: '', subject: '', topic: '', difficulty: '' });
  const [availableData, setAvailableData] = useState({ years: [], subjects: [], topics: [] });
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);

  useEffect(() => {
    academicService.getYears()
      .then((res) => {
        setAvailableData((p) => ({ ...p, years: res.data.years || [] }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (filters.year) params.yearNumber = filters.year;
    if (filters.semester) params.semester = filters.semester;

    academicService.getSubjects(params)
      .then((res) => {
        const subjects = res.data.subjects || [];
        setAvailableData((p) => ({ ...p, subjects, topics: [] }));
        setFilters((p) => ({
          ...p,
          subject: subjects.some((s) => s.name === p.subject) ? p.subject : '',
          topic: ''
        }));
      })
      .catch(() => {
        setAvailableData((p) => ({ ...p, subjects: [], topics: [] }));
      });
  }, [filters.year, filters.semester]);

  useEffect(() => {
    const subjectObj = filters.subject ? availableData.subjects.find((s) => s.name === filters.subject) : null;
    academicService.getTopics(subjectObj ? { subjectId: subjectObj.id } : {})
      .then((res) => {
        setAvailableData((p) => ({ ...p, topics: res.data.topics || [] }));
      })
      .catch(() => {
        setAvailableData((p) => ({ ...p, topics: [] }));
      });
  }, [filters.subject, availableData.subjects]);

  const getPracticeParams = () => ({
    year: filters.year || undefined,
    semester: filters.semester || undefined,
    subject: filters.subject || undefined,
    topic: filters.topic || undefined,
    difficulty: filters.difficulty || undefined,
    limit: 30
  });

  const handleStartPractice = async () => {
    setLoading(true);
    try {
      const response = await questionService.getPractice(getPracticeParams());
      setQuestions(response.data.questions || []);
      setSelectedAnswers({});
      setCurrentIdx(0);
      setSubmitted(false);
      setPracticeStarted(true);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleStopPractice = () => {
    setPracticeStarted(false);
    setQuestions([]);
    setSelectedAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
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

  const handleSelect = (answer) => {
    if (submitted) return;
    const qId = questions[currentIdx]?.id;
    setSelectedAnswers((p) => ({ ...p, [qId]: answer }));
  };

  const handleSubmit = async () => {
    const question = questions[currentIdx];
    const selected = selectedAnswers[question.id];
    if (!selected) { toast.error('Please select an answer first.'); return; }

    setIsSubmitting(true);
    try {
      await studentAnswerService.submit({ questionId: question.id, selectedAnswer: selected, timeSpent: 30 });
      setSubmitted(true);
      toast.success(selected === question.correctAnswer ? '✓ Correct!' : '✗ Incorrect');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters Screen
  if (!practiceStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Mode Setup</h1>
              <p className="text-gray-500 text-sm mt-1">Select any filters you want, or leave them blank for all questions</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value, semester: '', subject: '', topic: '' }))}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Years</option>
                  {availableData.years.map((y) => (
                    <option key={y.id} value={y.yearNumber}>{y.label || `Year ${y.yearNumber}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value, subject: '', topic: '' }))}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters((p) => ({ ...p, subject: e.target.value, topic: '' }))}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  <option value="">All Subjects</option>
                  {availableData.subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Topic</label>
                <select
                  value={filters.topic}
                  onChange={(e) => setFilters((p) => ({ ...p, topic: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  <option value="">All Topics</option>
                  {availableData.topics.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Question Level</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters((p) => ({ ...p, difficulty: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setFilters({ year: '', semester: '', subject: '', topic: '', difficulty: '' })}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                Clear All
              </button>
              <button
                onClick={handleStartPractice}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 transition-all shadow-md"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Loading...' : 'Start Practice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question View
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const question = questions[currentIdx];
  const selectedAnswer = question ? selectedAnswers[question.id] : null;
  const isCorrect = submitted && selectedAnswer === question?.correctAnswer;
  const progress = questions.length ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Practice Questions</h1>
          </div>
          <button
            onClick={handleStopPractice}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
            Stop Practice
          </button>
        </div>

{!questions.length ? (
           <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
             <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
             <p className="font-semibold text-gray-600">No questions found</p>
             <p className="text-sm mt-1 text-gray-500">Try adjusting your filters.</p>
           </div>
         ) : (
           <>
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
               <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                 <span>Question {currentIdx + 1} of {questions.length}</span>
                 <span>{progress}% Complete</span>
               </div>
               <div className="w-full bg-gray-100 rounded-full h-2">
                 <div
                   className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                   style={{ width: `${progress}%` }}
                 />
               </div>
             </div>

             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
               <div className="flex flex-wrap gap-2 mb-4">
                 {question.courseCode && (
                   <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{question.courseCode}</span>
                 )}
                 {question.subject && (
                   <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">{question.subject}</span>
                 )}
                 {question.year && (
                   <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">Y{question.year}</span>
                 )}
                 {question.semester && (
                   <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">Sem {question.semester}</span>
                 )}
                 {question.phase && (
                   <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                     question.phase === 'Basic' ? 'bg-blue-100 text-blue-700' :
                     question.phase === 'Integrated' ? 'bg-purple-100 text-purple-700' :
                     'bg-rose-100 text-rose-700'
                   }`}>{question.phase}</span>
                 )}
                 {question.topic && (
                   <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">{question.topic}</span>
                 )}
                 {question.difficulty && (
                   <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                     question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                     question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                     'bg-red-100 text-red-700'
                   }`}>{question.difficulty}</span>
                 )}
               </div>

               <div className="flex items-start gap-2 mb-6">
                 <h2 className="text-lg font-bold text-gray-900 leading-snug flex-1">{question.questionText}</h2>
                 <button
                   type="button"
                   onClick={() => speakQuestion(question.questionText, question.id)}
                   className={`p-1.5 rounded-full transition-all shrink-0 ${
                     speakingQuestionId === question.id
                       ? 'bg-teal-100 text-teal-600 animate-pulse'
                       : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                   }`}
                   title={speakingQuestionId === question.id ? 'Stop reading' : 'Read question aloud'}
                 >
                   {speakingQuestionId === question.id ? (
                     <PauseCircle className="w-4 h-4" />
                   ) : (
                     <Volume2 className="w-4 h-4" />
                   )}
                 </button>
               </div>

              <div className="space-y-3">
                {question.options?.map((option, idx) => {
                  let optionClass = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40';
                  if (selectedAnswer === option && !submitted) optionClass = 'border-blue-500 bg-blue-50';
                  if (submitted) {
                    if (option === question.correctAnswer) optionClass = 'border-green-500 bg-green-50';
                    else if (option === selectedAnswer) optionClass = 'border-red-400 bg-red-50';
                    else optionClass = 'border-gray-100 opacity-60';
                  }

                  return (
                    <label
                      key={idx}
                      onClick={() => handleSelect(option)}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${optionClass}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedAnswer === option ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {selectedAnswer === option && (
                          <div className={`w-2.5 h-2.5 rounded-full ${submitted ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'}`} />
                        )}
                      </div>
                      <span className="flex-1 text-sm text-gray-800">{option}</span>
                      {submitted && option === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                      {submitted && option === selectedAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    </label>
                  );
                })}
              </div>

              {submitted && (
                <div className={`mt-5 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-bold text-sm mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {question.explanation || 'No explanation available.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => { if (currentIdx > 0) { setCurrentIdx((p) => p - 1); setSubmitted(false); } }}
                disabled={isSubmitting || currentIdx === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedAnswer}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  Submit Answer <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => { if (currentIdx < questions.length - 1) { setCurrentIdx((p) => p + 1); setSubmitted(false); } }}
                  disabled={isSubmitting || currentIdx === questions.length - 1}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}