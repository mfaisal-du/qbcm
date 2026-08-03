import express from 'express';
import { 
  createQuestion, 
  importQuestionsBatch,
  getQuestion, 
  getAllQuestions, 
  getQuestionsByYear,
  getQuestionsBySubject,
  getQuestionsByCreator,
  getPendingQuestions,
  getPracticeQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  getQuestionUsage,
  archiveQuestion,
  submitForReview,
  getVettedQuestions,
  addQuestionUsage,
  getQuestionUsageHistory,
  deleteQuestionUsage
} from '../controllers/questionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create question - Administrator and Faculty
router.post('/', authenticate, authorize(['administrator', 'faculty']), createQuestion);

// Batch import questions - Faculty and Administrator
router.post('/batch/import', authenticate, authorize(['administrator', 'faculty']), importQuestionsBatch);

// Get all questions
router.get('/', authenticate, getAllQuestions);

// Get question stats summary (counts by status)
router.get('/stats/summary', authenticate, getQuestionStats);

// Get practice questions for students (faculty-created, approved only)
router.get('/practice/list', authenticate, authorize(['student']), getPracticeQuestions);

// Get pending questions (draft) - Administrator and Reviewer
router.get('/pending/all', authenticate, authorize(['administrator', 'reviewer']), getPendingQuestions);

// Get vetted questions (submitted for review) - Administrator and Reviewer
router.get('/vetted/all', authenticate, authorize(['administrator', 'reviewer']), getVettedQuestions);

// Get my questions (by creator)
router.get('/my-questions/list', authenticate, getQuestionsByCreator);

// Get questions by year (must come before /:questionId)
router.get('/year/:year', authenticate, getQuestionsByYear);

// Get questions by subject (must come before /:questionId)
router.get('/subject/:subject', authenticate, getQuestionsBySubject);

// Get question usage stats (times used in exams + years)
router.get('/:questionId/usage', authenticate, getQuestionUsage);

// Question usage history (detailed records with assessment type, year, semester)
router.get('/:questionId/usage-history', authenticate, getQuestionUsageHistory);
router.post('/:questionId/usage-history', authenticate, authorize(['administrator', 'faculty']), addQuestionUsage);

// Delete a usage record
router.delete('/usage-history/:usageId', authenticate, authorize(['administrator', 'faculty']), deleteQuestionUsage);

// Submit question for review (draft -> vetted)
router.put('/:questionId/submit-for-review', authenticate, authorize(['administrator', 'faculty']), submitForReview);

// Archive a question
router.put('/:questionId/archive', authenticate, authorize(['administrator']), archiveQuestion);

// Get question by ID (generic, must be last)
router.get('/:questionId', authenticate, getQuestion);

// Update question - Administrator and Faculty
router.put('/:questionId', authenticate, authorize(['administrator', 'faculty']), updateQuestion);

// Delete question - Administrator and Faculty
router.delete('/:questionId', authenticate, authorize(['administrator', 'faculty']), deleteQuestion);

export default router;
