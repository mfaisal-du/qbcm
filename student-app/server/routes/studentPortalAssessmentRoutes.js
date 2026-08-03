import express from 'express';
import {
  getAvailableAssessments,
  getAssessmentDetails,
  startAssessment,
  submitAssessmentAttempt,
  getMyAssessmentAttempts
} from '../controllers/studentAssessmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const studentAuth = [authenticate, authorize(['student'])];

// Get all available assessments for student
router.get('/available', studentAuth, getAvailableAssessments);

// Get details of a specific assessment
router.get('/:assessmentId', studentAuth, getAssessmentDetails);

// Start an assessment attempt
router.post('/:assessmentId/start', studentAuth, startAssessment);

// Submit assessment attempt
router.post('/:attemptId/submit', studentAuth, submitAssessmentAttempt);

// Get my assessment attempts
router.get('/my-attempts', studentAuth, getMyAssessmentAttempts);

export default router;
