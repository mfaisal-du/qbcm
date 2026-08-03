import express from 'express';
import {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  startAttempt,
  submitAttempt,
  getAttemptReview,
  listMyAttempts,
  listAssessmentAttempts,
  getDashboardStats,
  getGradebook,
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementPin,
} from '../controllers/assessmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Dashboard & Utilities
router.get('/dashboard-stats', authenticate, getDashboardStats);
router.get('/gradebook', authenticate, getGradebook);

// Announcements
router.get('/announcements', authenticate, listAnnouncements);
router.post('/announcements', authenticate, createAnnouncement);
router.delete('/announcements/:id', authenticate, deleteAnnouncement);
router.put('/announcements/:id/pin', authenticate, toggleAnnouncementPin);

// Assessments CRUD
router.get('/', authenticate, listAssessments);
router.get('/my-attempts', authenticate, listMyAttempts);
router.get('/:assessmentId/attempts', authenticate, listAssessmentAttempts);
router.get('/:assessmentId/review/:attemptId', authenticate, getAttemptReview);
router.get('/:assessmentId', authenticate, getAssessment);

router.post('/', authenticate, createAssessment);
router.put('/:assessmentId', authenticate, updateAssessment);
router.delete('/:assessmentId', authenticate, deleteAssessment);

router.post('/:assessmentId/start', authenticate, startAttempt);
router.post('/:assessmentId/submit', authenticate, submitAttempt);

export default router;
