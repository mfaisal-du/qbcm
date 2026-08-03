import * as Review from '../models/Review.js';
import * as Question from '../models/Question.js';

const normalizeRole = (role) => (role === 'admin' ? 'administrator' : role);
const isSuperAdmin = (role) => normalizeRole(role) === 'super_admin';

export const createReview = async (req, res) => {
  try {
    const { questionId, status, comments } = req.body;

    if (!questionId || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const question = await Question.getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!isSuperAdmin(req.user.role) && question.status !== 'vetted') {
      return res.status(403).json({ message: 'Review is locked. Only super admin can change status beyond vetted stage.' });
    }

    const result = await Review.createReview({
      questionId,
      reviewerId: req.user.userId,
      status,
      comments
    });

    // Update question status based on review
    if (status === 'approved') {
      await Question.updateQuestionStatus(questionId, 'active');
    } else if (status === 'rejected') {
      await Question.updateQuestionStatus(questionId, 'rejected');
    }

    res.status(201).json({
      message: 'Review created successfully',
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReviewsByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const reviews = await Review.getReviewsByQuestionId(questionId);

    res.json({
      message: 'Reviews retrieved successfully',
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews by question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReviewsForReviewer = async (req, res) => {
  try {
    const reviews = await Review.getReviewsForReviewer(req.user.userId);

    res.json({
      message: 'Reviews retrieved successfully',
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get reviews for reviewer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.getPendingReviewsForReviewer(req.user.userId);

    res.json({
      message: 'Pending reviews retrieved successfully',
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, comments } = req.body;

    const review = await Review.getReviewById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const question = await Question.getQuestionById(review.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!isSuperAdmin(req.user.role) && question.status !== 'vetted') {
      return res.status(403).json({ message: 'Review is locked. Only super admin can change status beyond vetted stage.' });
    }

    const result = await Review.updateReview(reviewId, { status, comments });

    // Update question status based on review
    if (status === 'approved') {
      await Question.updateQuestionStatus(review.questionId, 'active');
    } else if (status === 'rejected') {
      await Question.updateQuestionStatus(review.questionId, 'rejected');
    }

    res.json({
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
