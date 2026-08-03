import pool from '../config/database.js';

const COLUMN_CACHE = { columns: null, timestamp: 0 };

async function getQuestionColumns() {
  const now = Date.now();
  if (!COLUMN_CACHE.columns || now - COLUMN_CACHE.timestamp > 60000) {
    const [cols] = await pool.execute(`SHOW COLUMNS FROM questions`);
    COLUMN_CACHE.columns = new Set((cols || []).map(c => c.Field));
    COLUMN_CACHE.timestamp = now;
  }
  return COLUMN_CACHE.columns;
}

export const createQuestion = async (questionData) => {
  const data = { ...questionData };
  if (data.question && !data.questionText) data.questionText = data.question;

  const base = {
    questionText: data.questionText,
    questionType: data.questionType || 'multiple_choice',
    subject: data.subject,
    topic: data.topic,
    year: data.year ? Number(data.year) : 1,
    semester: data.semester ? Number(data.semester) : 1,
    difficulty: data.difficulty || 'medium',
    options: Array.isArray(data.options) ? data.options : [
      data.optionA || '', data.optionB || '', data.optionC || '', data.optionD || ''
    ],
    correctAnswer: data.correctAnswer || '',
    explanation: data.explanation || '',
    createdBy: data.createdBy,
    status: data.status || 'draft'
  };

  const optional = {
    cognitiveLevel: data.cognitiveLevel || 'recall',
    assessmentType: data.assessmentType || 'formative',
    learningOutcome: data.learningOutcome || '',
    competencies: data.competencies || '',
    weighting: data.weighting ? Number(data.weighting) : 0,
    coverage: data.coverage || 'course',
    courseCode: data.courseCode || '',
    phase: data.phase || null,
    audio: data.audio || null,
    clo: data.clo || null,
    slo: data.slo || null
  };

  const existing = await getQuestionColumns();
  const all = { ...base, ...optional };
  const allowed = Object.keys(all).filter(k => existing.has(k));
  const values = allowed.map(k => (k === 'options' ? JSON.stringify(all[k]) : all[k]));

  const placeholders = allowed.map(() => '?').join(', ');
  const query = `
    INSERT INTO questions (${allowed.join(', ')}, createdAt)
    VALUES (${placeholders}, NOW())
  `;

  const [result] = await pool.execute(query, values);
  return result;
};

export const getQuestionById = async (questionId) => {
  const query = `
    SELECT q.*, u.firstName AS creatorFirstName, u.lastName AS creatorLastName
    FROM questions q
    LEFT JOIN users u ON q.createdBy = u.id
    WHERE q.id = ?
  `;
  const [rows] = await pool.execute(query, [questionId]);

  if (rows[0]) {
    rows[0].options = JSON.parse(rows[0].options || '[]');
  }

  return rows[0];
};

export const getQuestionsByYear = async (year, semester = null) => {
  let query = 'SELECT * FROM questions WHERE year = ?';
  const params = [year];

  if (semester) {
    query += ' AND semester = ?';
    params.push(semester);
  }

  query += ' ORDER BY createdAt DESC';
  const [rows] = await pool.execute(query, params);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getQuestionsBySubject = async (subject, topic = null) => {
  let query = 'SELECT * FROM questions WHERE subject = ?';
  const params = [subject];

  if (topic) {
    query += ' AND topic = ?';
    params.push(topic);
  }

  query += ' ORDER BY createdAt DESC';
  const [rows] = await pool.execute(query, params);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getQuestionsByTopic = async (topic) => {
  const query = 'SELECT * FROM questions WHERE topic = ? ORDER BY createdAt DESC';
  const [rows] = await pool.execute(query, [topic]);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getQuestionsByIds = async (questionIds = []) => {
  const ids = [...new Set((questionIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) return [];

  const placeholders = ids.map(() => '?').join(',');
  const query = `SELECT * FROM questions WHERE id IN (${placeholders}) ORDER BY createdAt DESC`;
  const [rows] = await pool.execute(query, ids);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getAllQuestions = async (filters = {}) => {
  const {
    year, semester, subject, topic, difficulty, status,
    cognitiveLevel, assessmentType, coverage, createdBy,
    createdFrom, createdTo, limit = 50, offset = 0
  } = filters;

  const conditions = [];
  const params = [];

  if (year) { conditions.push('year = ?'); params.push(year); }
  if (semester) { conditions.push('semester = ?'); params.push(semester); }
  if (subject) { conditions.push('subject = ?'); params.push(subject); }
  if (topic) { conditions.push('topic = ?'); params.push(topic); }
  if (difficulty) { conditions.push('difficulty = ?'); params.push(difficulty); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (cognitiveLevel) { conditions.push('cognitiveLevel = ?'); params.push(cognitiveLevel); }
  if (assessmentType) { conditions.push('assessmentType = ?'); params.push(assessmentType); }
  if (coverage) { conditions.push('coverage = ?'); params.push(coverage); }
  if (createdBy) { conditions.push('createdBy = ?'); params.push(createdBy); }
  if (createdFrom) { conditions.push('createdAt >= ?'); params.push(createdFrom); }
  if (createdTo) { conditions.push('createdAt <= ?'); params.push(createdTo); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM questions ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.execute(query, params);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getQuestionsByCreator = async (creatorId) => {
  const query = `SELECT * FROM questions WHERE createdBy = ? ORDER BY createdAt DESC`;
  const [rows] = await pool.execute(query, [creatorId]);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const getPracticeQuestions = async (filters = {}) => {
  const {
    subject, topic, difficulty, year, semester, cognitiveLevel, limit = 50
  } = filters;

  const conditions = ["status = 'active'"];
  const params = [];

  if (subject) { conditions.push('subject = ?'); params.push(subject); }
  if (topic) { conditions.push('topic = ?'); params.push(topic); }
  if (difficulty) { conditions.push('difficulty = ?'); params.push(difficulty); }
  if (year) { conditions.push('year = ?'); params.push(year); }
  if (semester) { conditions.push('semester = ?'); params.push(Number(semester)); }
  if (cognitiveLevel) { conditions.push('cognitiveLevel = ?'); params.push(cognitiveLevel); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM questions ${where} ORDER BY RAND() LIMIT ?`;
  params.push(Number(limit));

  const [rows] = await pool.execute(query, params);

  return rows.map(row => ({
    ...row,
    options: JSON.parse(row.options || '[]')
  }));
};

export const updateQuestion = async (questionId, questionData) => {
  const data = { ...questionData };
  if (data.question && !data.questionText) data.questionText = data.question;

  const base = {
    questionText: data.questionText,
    questionType: data.questionType,
    subject: data.subject,
    topic: data.topic,
    year: data.year ? Number(data.year) : 1,
    semester: data.semester ? Number(data.semester) : 1,
    difficulty: data.difficulty,
    options: Array.isArray(data.options) ? data.options : [
      data.optionA || '', data.optionB || '', data.optionC || '', data.optionD || ''
    ],
    correctAnswer: data.correctAnswer,
    explanation: data.explanation,
    status: data.status
  };

  const optional = {
    cognitiveLevel: data.cognitiveLevel,
    assessmentType: data.assessmentType,
    learningOutcome: data.learningOutcome,
    competencies: data.competencies,
    weighting: data.weighting ? Number(data.weighting) : 0,
    coverage: data.coverage,
    courseCode: data.courseCode,
    phase: data.phase || null,
    audio: data.audio || null,
    clo: data.clo || null,
    slo: data.slo || null,
    usageCount: data.usageCount
  };

  const all = { ...base, ...optional };
  const updates = [];
  const values = [];

  const existing = await getQuestionColumns();
  for (const [key, value] of Object.entries(all)) {
    const col = key;
    if (value !== undefined && existing.has(col)) {
      updates.push(`${col} = ?`);
      values.push(key === 'options' ? JSON.stringify(value) : value);
    }
  }

  if (!updates.length) return { affectedRows: 0 };

  values.push(questionId);
  const query = `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`;
  const [result] = await pool.execute(query, values);
  return result;
};
