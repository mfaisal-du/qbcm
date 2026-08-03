import pool from '../config/database.js';

export const createReview = async (reviewData) => {
  const { questionId, reviewerId, status, comments } = reviewData;
  
  const query = `
    INSERT INTO reviews 
    (questionId, reviewerId, status, comments, createdAt) 
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  const [result] = await pool.execute(query, [questionId, reviewerId, status, comments]);
  
  return result;
};

export const getReviewsByQuestionId = async (questionId) => {
  const query = `
    SELECT r.*, u.firstName, u.lastName, u.email 
    FROM reviews r 
    JOIN users u ON r.reviewerId = u.id 
    WHERE r.questionId = ? 
    ORDER BY r.createdAt DESC
  `;
  
  const [rows] = await pool.execute(query, [questionId]);
  
  return rows;
};

export const getReviewsForReviewer = async (reviewerId) => {
  const query = `
    SELECT r.*, q.questionText, q.subject, q.topic, u_creator.firstName as creatorFirstName, u_creator.lastName as creatorLastName
    FROM reviews r 
    JOIN questions q ON r.questionId = q.id 
    JOIN users u_creator ON q.createdBy = u_creator.id
    WHERE r.reviewerId = ? 
    ORDER BY r.createdAt DESC
  `;
  
  const [rows] = await pool.execute(query, [reviewerId]);
  
  return rows;
};

export const getPendingReviewsForReviewer = async (reviewerId) => {
  const query = `
    SELECT r.*, q.questionText, q.subject, q.topic, u_creator.firstName as creatorFirstName, u_creator.lastName as creatorLastName
    FROM reviews r 
    JOIN questions q ON r.questionId = q.id 
    JOIN users u_creator ON q.createdBy = u_creator.id
    WHERE r.reviewerId = ?
    ORDER BY r.createdAt DESC
  `;
  
  const [rows] = await pool.execute(query, [reviewerId]);
  
  return rows;
};

export const updateReview = async (reviewId, updateData) => {
  const { status, comments } = updateData;
  
  const query = `
    UPDATE reviews 
    SET status = ?, comments = ?, updatedAt = NOW()
    WHERE id = ?
  `;
  
  const [result] = await pool.execute(query, [status, comments, reviewId]);
  
  return result;
};

export const getReviewById = async (reviewId) => {
  const query = 'SELECT * FROM reviews WHERE id = ?';
  const [rows] = await pool.execute(query, [reviewId]);
  
  return rows[0];
};
