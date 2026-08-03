import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, Volume2, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assessmentService } from '../services/api';
import { Button, Spinner } from '../components/Common';

export const AssessmentReviewPage = () => {
  const navigate = useNavigate();
  const { assessmentId, attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [detailedAnswers, setDetailedAnswers] = useState([]);
  const [speakingQuestionId, setSpeakingQuestionId] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true);
      try {
        const response = await assessmentService.getReview(assessmentId, attemptId);
        const data = response.data;
        setAttempt(data.attempt);
        setAssessment(data.assessment);
        setDetailedAnswers(data.detailedAnswers || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load attempt review');
        navigate('/assessments');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId && attemptId) {
      fetchReview();
    }
  }, [assessmentId, attemptId, navigate]);

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

  if (loading) {
    return (
      <div className="tab-canvas min-h-screen p-6 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!attempt || !assessment) {
    return (
      <div className="tab-canvas min-h-screen p-6">
        <div className="text-center">
          <p className="text-gray-600">Attempt not found</p>
          <Button onClick={() => navigate('/assessments')} className="mt-4">Back to Assessments</Button>
        </div>
      </div>
    );
  }

  const totalCorrect = detailedAnswers.filter((a) => a.isCorrect).length;
  const totalMarksEarned = detailedAnswers.reduce((sum, a) => sum + (a.marks || 0), 0);

  return (
    <div className="tab-canvas min-h-screen p-6 bg-gradient-to-br from-indigo-50/40 via-white to-violet-50/40">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-panel mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/assessments')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Attempt Review</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Assessment</p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">{assessment.title}</h2>
              <p className="text-sm text-gray-600 mt-2">Submitted: {new Date(attempt.submittedAt).toLocaleString()}</p>
            </div>
            <div className="glass-card-strong p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Score</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{attempt.scorePct.toFixed(2)}%</p>
              <p className="text-sm text-emerald-600 mt-1">{totalMarksEarned.toFixed(2)} / {assessment.totalMarks} marks</p>
              <p className="text-xs text-emerald-600 mt-2">{totalCorrect} / {detailedAnswers.length} correct</p>
            </div>
          </div>
        </div>

        {/* Question Answers Review */}
        <div className="space-y-4">
          {detailedAnswers.map((answer, idx) => (
            <div key={answer.questionId} className="glass-panel p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`mt-1 flex-shrink-0 ${answer.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {answer.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                  <p className="font-semibold text-gray-900">Q{idx + 1}. {answer.questionText}</p>
                  <button
                    type="button"
                    onClick={() => speakQuestion(answer.questionText, answer.questionId)}
                    className={`p-1 rounded-full transition-all shrink-0 ${
                      speakingQuestionId === answer.questionId
                        ? 'bg-teal-100 text-teal-600 animate-pulse'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={speakingQuestionId === answer.questionId ? 'Stop reading' : 'Read question aloud'}
                  >
                    {speakingQuestionId === answer.questionId ? (
                      <PauseCircle className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{answer.questionType}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${answer.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {answer.marks.toFixed(2)} / {answer.maxMarks.toFixed(2)} marks
                  </p>
                </div>
              </div>

              {/* Answer Details */}
              <div className="space-y-3 mt-4">
                {/* Student Answer */}
                <div className="soft-card p-3 bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Your Answer</p>
                  <p className="text-sm text-gray-800 mt-1 break-words">
                    {answer.studentAnswer || '(No answer provided)'}
                  </p>
                </div>

                {/* Correct Answer */}
                {answer.correctAnswer && !answer.isCorrect && (
                  <div className="soft-card p-3 bg-emerald-50 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Correct Answer</p>
                    <p className="text-sm text-gray-800 mt-1 break-words">{answer.correctAnswer}</p>
                  </div>
                )}

                {/* Explanation */}
                {answer.explanation && (
                  <div className="soft-card p-3 bg-amber-50 border border-amber-100 flex gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Explanation</p>
                      <p className="text-sm text-gray-800 mt-1">{answer.explanation}</p>
                    </div>
                  </div>
                )}

                {/* MCQ Options Display */}
                {answer.questionType === 'mcq' && Array.isArray(answer.options) && answer.options.length > 0 && (
                  <div className="soft-card p-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Options</p>
                    <div className="space-y-1">
                      {answer.options.map((opt, oIdx) => {
                        const isSelected = opt === answer.studentAnswer;
                        const isCorrect = opt === answer.correctAnswer;
                        return (
                          <div
                            key={oIdx}
                            className={`text-sm p-2 rounded border-l-2 ${
                              isSelected && isCorrect
                                ? 'bg-emerald-100 border-l-emerald-600 text-emerald-900'
                                : isSelected && !isCorrect
                                ? 'bg-rose-100 border-l-rose-600 text-rose-900'
                                : isCorrect && !isSelected
                                ? 'bg-blue-100 border-l-blue-600 text-blue-900'
                                : 'bg-gray-100 border-l-gray-300 text-gray-600'
                            }`}
                          >
                            {isSelected && <span className="font-bold">→ </span>}
                            {opt}
                            {isCorrect && !isSelected && <span className="ml-2 text-xs font-bold">(Correct)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/assessments')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Assessments
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentReviewPage;
