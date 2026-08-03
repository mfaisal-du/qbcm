import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ClipboardList, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { studentAnswerService } from '../services/api';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAnswerService.getMyResults()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, results: list } = data || { stats: null, results: [] };

  const statCards = stats ? [
    { label: 'Total Questions', value: stats.totalQuestions ?? list?.length ?? 0, icon: <BarChart3 className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-400' },
    { label: 'Correct', value: stats.correctAnswers ?? list?.filter(r => r.isCorrect).length ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', border: 'border-green-400' },
    { label: 'Incorrect', value: stats.incorrectAnswers ?? list?.filter(r => !r.isCorrect).length ?? 0, icon: <XCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50', border: 'border-red-400' },
    { label: 'Success Rate', value: `${stats.percentage ?? (list?.length ? Math.round((list.filter(r => r.isCorrect).length / list.length) * 100) : 0)}%`, icon: <Target className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-400' }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        </div>

        {/* Summary Cards */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className={`bg-white rounded-2xl border-t-4 ${card.border} shadow-sm p-4`}>
                <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Answer History</h2>
            {list?.length > 0 && (
              <span className="ml-auto text-xs text-gray-400">{list.length} entries</span>
            )}
          </div>

          {!list?.length ? (
            <div className="text-center py-14 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-500">No results yet</p>
              <p className="text-sm mt-1">Complete some practice questions to see your history here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {list.map((result, idx) => (
                <div key={idx} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${result.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                    {result.isCorrect
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {result.questionText?.substring(0, 80)}{result.questionText?.length > 80 ? '…' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {result.subject && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{result.subject}</span>
                      )}
                      {result.topic && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{result.topic}</span>
                      )}
                      {result.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          result.difficulty === 'easy' ? 'bg-green-50 text-green-700' :
                          result.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>{result.difficulty}</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1">
                      <p className="text-xs text-gray-500">
                        Your answer: <span className={`font-semibold ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{result.selectedAnswer}</span>
                      </p>
                      {!result.isCorrect && (
                        <p className="text-xs text-gray-500">
                          Correct: <span className="font-semibold text-green-600">{result.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {result.isCorrect ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
