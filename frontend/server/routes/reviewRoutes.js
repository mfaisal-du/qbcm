import express from 'express';
import { 
  createReview,
  getReviewsByQuestion,
  getReviewsForReviewer,
  getPendingReviews,
  updateReview
} from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create review - Reviewer and Administrator can review
router.post('/', authenticate, authorize(['reviewer', 'administrator']), createReview);

// Get reviews by question ID
router.get('/question/:questionId', authenticate, authorize(['administrator', 'faculty', 'reviewer']), getReviewsByQuestion);

// Get all reviews for reviewer/administrator
router.get('/', authenticate, authorize(['reviewer', 'administrator']), getReviewsForReviewer);

// Get pending reviews for reviewer/administrator
router.get('/pending', authenticate, authorize(['reviewer', 'administrator']), getPendingReviews);

// Update review - Reviewer and Administrator can update
router.put('/:reviewId', authenticate, authorize(['reviewer', 'administrator']), updateReview);

export default router;
