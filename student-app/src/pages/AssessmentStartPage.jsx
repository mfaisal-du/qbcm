import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService, academicService } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, AlertCircle, BookOpen, Calendar, Award, Clock, FileText } from 'lucide-react';

export default function AssessmentStartPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSafeBrowser, setShowSafeBrowser] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [subjectDetails, setSubjectDetails] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await assessmentService.getAssessmentDetails(assessmentId);
        setAssessment(response.data.data);
        
        if (response.data.data?.subject) {
          try {
            const subjectsRes = await academicService.getSubjects({ subject: response.data.data.subject, limit: 1 });
            if (subjectsRes.data?.subjects?.length > 0) {
              setSubjectDetails(subjectsRes.data.subjects[0]);
            }
          } catch (e) {
            console.error('Failed to load subject details', e);
          }
        }
      } catch (err) {
        console.error('Failed to load assessment', err);
        toast.error('Assessment not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId, navigate]);

  const handleStartAssessment = async () => {
    if (!agreedTerms) {
      toast.error('Please agree to the terms');
      return;
    }

    try {
      const response = await assessmentService.startAssessment(assessmentId);
      toast.success('Assessment started!');
      
      // Enable safe browser if available
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          toast.warning('Full-screen mode could not be enabled');
        });
      }

      // Navigate to assessment attempt
      navigate(`/assessments/${assessmentId}/attempt/${response.data.data.attemptId}`);
    } catch (err) {
      console.error('Failed to start assessment', err);
      toast.error(err.response?.data?.message || 'Failed to start assessment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Assessment not available</div>
      </div>
    );
  }

  const startDate = assessment.startAt ? new Date(assessment.startAt) : null;
  const endDate = assessment.endAt ? new Date(assessment.endAt) : null;
  const now = new Date();
  const isActive = (!startDate || startDate <= now) && (!endDate || endDate >= now);
  const canAttempt = assessment.canAttempt && assessment.attemptRemaining > 0 && isActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-teal-700 hover:text-teal-800 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Assessment Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{assessment.title}</h1>
                <p className="text-teal-100 mt-2">{assessment.assessmentType.toUpperCase()} • {assessment.subject || 'General'}</p>
              </div>
              {!canAttempt && (
                <div className="bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold">
                  Unavailable
                </div>
              )}
            </div>
{assessment.description && (
               <p className="text-teal-50 mt-4">{assessment.description}</p>
             )}
           </div>

           {/* Academic Structure Details */}
           {subjectDetails && (
             <div className="bg-gray-50 border-t border-gray-200 p-6">
               <div className="flex items-center gap-2 mb-3">
                 <BookOpen className="w-4 h-4 text-teal-600" />
                 <h3 className="text-sm font-semibold text-gray-700">Academic Structure</h3>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                 <div>
                   <span className="text-gray-500">Subject:</span>
                   <span className="ml-1 font-medium text-gray-800">{assessment.subject}</span>
                 </div>
                 {subjectDetails.courseCode && (
                   <div>
                     <span className="text-gray-500">Course Code:</span>
                     <span className="ml-1 font-medium text-gray-800">{subjectDetails.courseCode}</span>
                   </div>
                 )}
                 {subjectDetails.yearNumber && (
                   <div>
                     <span className="text-gray-500">Year:</span>
                     <span className="ml-1 font-medium text-gray-800">{subjectDetails.yearNumber}</span>
                   </div>
                 )}
                 {subjectDetails.semester && (
                   <div>
                     <span className="text-gray-500">Semester:</span>
                     <span className="ml-1 font-medium text-gray-800">{subjectDetails.semester}</span>
                   </div>
                 )}
                 {subjectDetails.phase && (
                   <div>
                     <span className="text-gray-500">Phase:</span>
                     <span className="ml-1 font-medium text-gray-800">{subjectDetails.phase}</span>
                   </div>
                 )}
               </div>
             </div>
           )}

           <div className="p-8">
            {/* Assessment Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase">Duration</p>
                <p className="text-2xl font-bold text-blue-700 mt-2">{assessment.durationMinutes}</p>
                <p className="text-xs text-blue-600 mt-1">minutes</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 font-semibold uppercase">Total Marks</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{assessment.totalMarks}</p>
                <p className="text-xs text-green-600 mt-1">marks</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-purple-600 font-semibold uppercase">Attempts</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">{assessment.attemptLimit}</p>
                <p className="text-xs text-purple-600 mt-1">allowed</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-xs text-indigo-600 font-semibold uppercase">All Questions</p>
                <p className="text-2xl font-bold text-indigo-700 mt-2">{assessment.questions?.length || assessment.questionIds?.length || '?'}</p>
                <p className="text-xs text-indigo-600 mt-1">questions</p>
              </div>
            </div>

            {/* Time Window */}
            {(startDate || endDate) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Assessment Window
                </p>
                <div className="text-sm text-amber-800 space-y-1">
                  {startDate && (
                    <p>Start: {startDate.toLocaleString()}</p>
                  )}
                  {endDate && (
                    <p>End: {endDate.toLocaleString()}</p>
                  )}
                  {!isActive && (
                    <p className="text-red-600 font-semibold mt-2">This assessment is not currently active</p>
                  )}
                </div>
              </div>
            )}

            {/* Attempts Info */}
            {!assessment.canAttempt && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-sm font-semibold text-red-900 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Attempts Limit Reached
                </p>
                <p className="text-sm text-red-700 mt-2">
                  You have used all {assessment.attemptLimit} allowed attempt(s) for this assessment.
                </p>
              </div>
            )}

            {/* Safe Browser Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Exam Safe Browser</p>
                  <p className="text-sm text-blue-800 mt-1">
                    When you start this assessment, your browser will enter full-screen mode to ensure exam integrity. 
                    You will not be able to access other tabs or applications during the exam.
                  </p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSafeBrowser}
                      onChange={(e) => setShowSafeBrowser(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-blue-800">I understand the safe browser mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">Important Instructions:</p>
              <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                <li>You have {assessment.durationMinutes} minutes to complete this assessment</li>
                <li>Total marks for this assessment: {assessment.totalMarks}</li>
                <li>You are allowed {assessment.attemptLimit} attempt(s)</li>
                <li>Once submitted, you cannot retake the assessment until your next allowed attempt</li>
                <li>Your exam session will be monitored in full-screen mode</li>
                <li>Leaving full-screen mode during the exam is not allowed</li>
              </ul>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 mb-8 p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 mt-1 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I understand the instructions and agree to take this assessment in full-screen mode with exam monitoring enabled.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStartAssessment}
                disabled={!canAttempt || !agreedTerms}
                className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-all ${
                  canAttempt && agreedTerms
                    ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
