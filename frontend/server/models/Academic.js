import pool from '../config/database.js';

// ─── Academic Years ───────────────────────────────────────────────────────────

export const getAcademicYears = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM academic_years ORDER BY yearNumber ASC'
  );
  return rows;
};

export const createAcademicYear = async ({ yearNumber, label, description }) => {
  const [result] = await pool.execute(
    'INSERT INTO academic_years (yearNumber, label, description) VALUES (?, ?, ?)',
    [yearNumber, label, description || null]
  );
  return result;
};

export const updateAcademicYear = async (id, { label, description }) => {
  const [result] = await pool.execute(
    'UPDATE academic_years SET label = ?, description = ? WHERE id = ?',
    [label, description || null, id]
  );
  return result;
};

export const deleteAcademicYear = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM academic_years WHERE id = ?',
    [id]
  );
  return result;
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const getSubjects = async (yearNumber = null, semester = null, phase = null, subjectName = null, subjectNames = null) => {
  let query = `
    SELECT s.*, ay.label AS yearLabel
    FROM subjects s
    LEFT JOIN academic_years ay ON ay.yearNumber = s.yearNumber
  `;
  const params = [];
  const conditions = [];

  if (yearNumber) { conditions.push('s.yearNumber = ?'); params.push(yearNumber); }
  if (semester)   { conditions.push('s.semester = ?');   params.push(semester); }
  if (phase)      { conditions.push('s.phase = ?');     params.push(phase); }
  if (subjectNames && Array.isArray(subjectNames) && subjectNames.length > 0) {
    const placeholders = subjectNames.map(() => '?').join(',');
    conditions.push(`s.name IN (${placeholders})`);
    params.push(...subjectNames);
  } else if (subjectName) { conditions.push('s.name = ?'); params.push(subjectName); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY s.yearNumber, s.semester, s.name';

  const [rows] = await pool.execute(query, params);
  return rows;
};

export const getSubjectsByIds = async (subjectIds = []) => {
  if (!subjectIds || subjectIds.length === 0) return [];
  
  const placeholders = subjectIds.map(() => '?').join(',');
  const query = `
    SELECT s.*, ay.label AS yearLabel
    FROM subjects s
    LEFT JOIN academic_years ay ON ay.yearNumber = s.yearNumber
    WHERE s.id IN (${placeholders})
    ORDER BY s.yearNumber, s.semester, s.name
  `;
  const [rows] = await pool.execute(query, subjectIds);
  return rows;
};

export const createSubject = async ({ name, courseCode, yearNumber, semester, phase, description }) => {
  const [result] = await pool.execute(
    'INSERT INTO subjects (name, courseCode, yearNumber, semester, phase, description) VALUES (?, ?, ?, ?, ?, ?)',
    [name, courseCode || null, yearNumber, semester, phase || 'Basic', description || null]
  );
  return result;
};

export const updateSubject = async (id, { name, courseCode, yearNumber, semester, phase, description }) => {
  const [result] = await pool.execute(
    'UPDATE subjects SET name = ?, courseCode = ?, yearNumber = ?, semester = ?, phase = ?, description = ? WHERE id = ?',
    [name, courseCode || null, yearNumber, semester, phase || 'Basic', description || null, id]
  );
  return result;
};

export const deleteSubject = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM subjects WHERE id = ?',
    [id]
  );
  return result;
};

// ─── Topics ───────────────────────────────────────────────────────────────────

export const getTopics = async (subjectId = null, subjectIds = null) => {
  let query = `
    SELECT t.*, s.name AS subjectName, s.yearNumber, s.semester
    FROM topics t
    LEFT JOIN subjects s ON s.id = t.subjectId
  `;
  const params = [];
  if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
    const placeholders = subjectIds.map(() => '?').join(',');
    query += ` WHERE t.subjectId IN (${placeholders})`;
    params.push(...subjectIds);
  } else if (subjectId) {
    query += ' WHERE t.subjectId = ?';
    params.push(subjectId);
  }
  query += ' ORDER BY s.name, t.name';

  const [rows] = await pool.execute(query, params);
  return rows;
};

export const createTopic = async ({ subjectId, name, description }) => {
  const [result] = await pool.execute(
    'INSERT INTO topics (subjectId, name, description) VALUES (?, ?, ?)',
    [subjectId, name, description || null]
  );
  return result;
};

export const updateTopic = async (id, { name, description }) => {
  const [result] = await pool.execute(
    'UPDATE topics SET name = ?, description = ? WHERE id = ?',
    [name, description || null, id]
  );
  return result;
};

export const deleteTopic = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM topics WHERE id = ?',
    [id]
  );
  return result;
};

// ─── CLOs (Course Learning Outcomes) ───────────────────────────────────────────

export const getCLOs = async (subjectId = null, subjectIds = null) => {
  let query = 'SELECT * FROM clos';
  const params = [];
  if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
    const placeholders = subjectIds.map(() => '?').join(',');
    query += ` WHERE subjectId IN (${placeholders})`;
    params.push(...subjectIds);
  } else if (subjectId) {
    query += ' WHERE subjectId = ?';
    params.push(subjectId);
  }
  query += ' ORDER BY code';
  const [rows] = await pool.execute(query, params);
  return rows;
};

export const createCLO = async ({ subjectId, code, description }) => {
  const [result] = await pool.execute(
    'INSERT INTO clos (subjectId, code, description) VALUES (?, ?, ?)',
    [subjectId, code, description]
  );
  return result;
};

export const updateCLO = async (id, { code, description }) => {
  const [result] = await pool.execute(
    'UPDATE clos SET code = ?, description = ? WHERE id = ?',
    [code, description, id]
  );
  return result;
};

export const deleteCLO = async (id) => {
  const [result] = await pool.execute('DELETE FROM clos WHERE id = ?', [id]);
  return result;
};

// ─── SLOs (Student Learning Outcomes) ───────────────────────────────────────────

export const getSLOs = async (cloId = null, topicId = null) => {
  let query = 'SELECT slo.*, clo.code AS cloCode, t.name AS topicName FROM slos slo LEFT JOIN clos clo ON clo.id = slo.cloId LEFT JOIN topics t ON t.id = slo.topicId';
  const params = [];
  const conditions = [];
  if (cloId) { conditions.push('slo.cloId = ?'); params.push(cloId); }
  if (topicId) { conditions.push('slo.topicId = ?'); params.push(topicId); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY slo.code';
  const [rows] = await pool.execute(query, params);
  return rows;
};

export const createSLO = async ({ cloId, topicId, code, description }) => {
  const [result] = await pool.execute(
    'INSERT INTO slos (cloId, topicId, code, description) VALUES (?, ?, ?, ?)',
    [cloId, topicId, code, description]
  );
  return result;
};

export const updateSLO = async (id, { code, description }) => {
  const [result] = await pool.execute(
    'UPDATE slos SET code = ?, description = ? WHERE id = ?',
    [code, description, id]
  );
  return result;
};

export const deleteSLO = async (id) => {
  const [result] = await pool.execute('DELETE FROM slos WHERE id = ?', [id]);
  return result;
};

export const getSLOsForTopics = async (topicIds = []) => {
  if (!topicIds || topicIds.length === 0) return [];
  
  const placeholders = topicIds.map(() => '?').join(',');
  const query = `
    SELECT slo.*, clo.code AS cloCode, t.name AS topicName 
    FROM slos slo 
    LEFT JOIN clos clo ON clo.id = slo.cloId 
    LEFT JOIN topics t ON t.id = slo.topicId 
    WHERE slo.topicId IN (${placeholders})
    ORDER BY slo.code
  `;
  const [rows] = await pool.execute(query, topicIds);
  return rows;
};
