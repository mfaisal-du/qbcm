import pool from '../config/database.js';

export const saveStudentAnswer = async (answerData) => {
  const { studentId, questionId, selectedAnswer, timeSpent } = answerData;
  
  const query = `
    INSERT INTO student_answers 
    (studentId, questionId, selectedAnswer, timeSpent, answeredAt) 
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      selectedAnswer = VALUES(selectedAnswer),
      timeSpent = VALUES(timeSpent),
      answeredAt = NOW()
  `;
  
  const [result] = await pool.execute(query, [studentId, questionId, selectedAnswer, timeSpent]);
  
  return result;
};

export const getStudentAnswers = async (studentId, questionId = null) => {
  let query = 'SELECT * FROM student_answers WHERE studentId = ?';
  const params = [studentId];
  
  if (questionId) {
    query += ' AND questionId = ?';
    params.push(questionId);
  }
  
  const [rows] = await pool.execute(query, params);
  
  return rows;
};

export const getStudentResult = async (studentId) => {
  const query = `
    SELECT 
      sa.questionId,
      q.questionText,
      q.correctAnswer,
      sa.selectedAnswer,
      q.subject,
      q.topic,
      CASE WHEN sa.selectedAnswer = q.correctAnswer THEN 1 ELSE 0 END as isCorrect
    FROM student_answers sa
    JOIN questions q ON sa.questionId = q.id
    WHERE sa.studentId = ?
    ORDER BY sa.answeredAt DESC
  `;
  
  const [rows] = await pool.execute(query, [studentId]);
  
  return rows;
};

export const getStudentStats = async (studentId) => {
  const query = `
    SELECT 
      COUNT(*) as totalQuestions,
      SUM(CASE WHEN sa.selectedAnswer = q.correctAnswer THEN 1 ELSE 0 END) as correctAnswers,
      SUM(CASE WHEN sa.selectedAnswer != q.correctAnswer THEN 1 ELSE 0 END) as incorrectAnswers,
      ROUND(SUM(CASE WHEN sa.selectedAnswer = q.correctAnswer THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as percentage
    FROM student_answers sa
    JOIN questions q ON sa.questionId = q.id
    WHERE sa.studentId = ?
  `;
  
  const [rows] = await pool.execute(query, [studentId]);
  
  return rows[0];
};

export const deleteStudentAnswer = async (answerId) => {
  const query = 'DELETE FROM student_answers WHERE id = ?';
  const [result] = await pool.execute(query, [answerId]);
  
  return result;
};
