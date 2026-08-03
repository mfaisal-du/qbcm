import express from 'express';
import { 
  submitAnswer,
  getStudentAnswers,
  getStudentResult,
  getStudentStats
} from '../controllers/studentAnswerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Submit answer - Students only
router.post('/submit', authenticate, authorize(['student']), submitAnswer);

// Get student's answers
router.get('/my-answers', authenticate, authorize(['student']), getStudentAnswers);

// Get student's results
router.get('/my-results', authenticate, authorize(['student']), getStudentResult);

// Get student's stats
router.get('/my-stats', authenticate, authorize(['student']), getStudentStats);

export default router;
