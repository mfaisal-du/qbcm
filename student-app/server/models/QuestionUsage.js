import pool from '../config/database.js';

export const addUsageRecord = async ({ questionId, assessmentType, academicYear, semester, notes, addedBy }) => {
  const query = `
    INSERT INTO question_usage (questionId, assessmentType, academicYear, semester, notes, addedBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await pool.execute(query, [questionId, assessmentType, academicYear, semester, notes || null, addedBy]);
  return result;
};

export const getUsageByQuestion = async (questionId) => {
  const query = `
    SELECT qu.*, u.firstName AS addedByFirstName, u.lastName AS addedByLastName
    FROM question_usage qu
    LEFT JOIN users u ON qu.addedBy = u.id
    WHERE qu.questionId = ?
    ORDER BY qu.academicYear DESC, qu.semester DESC, qu.createdAt DESC
  `;
  const [rows] = await pool.execute(query, [questionId]);
  return rows;
};

export const deleteUsageRecord = async (id) => {
  const query = 'DELETE FROM question_usage WHERE id = ?';
  const [result] = await pool.execute(query, [id]);
  return result;
};

export const getUsageSummaryByQuestion = async (questionId) => {
  const query = `
    SELECT 
      COUNT(*) AS totalRecords,
      COUNT(DISTINCT academicYear) AS distinctYears,
      COUNT(DISTINCT CONCAT(academicYear, '-', semester)) AS distinctSemesters,
      GROUP_CONCAT(DISTINCT assessmentType ORDER BY assessmentType ASC) AS assessmentTypes
    FROM question_usage
    WHERE questionId = ?
  `;
  const [rows] = await pool.execute(query, [questionId]);
  return rows[0];
};
