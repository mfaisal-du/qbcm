import pool from '../config/database.js';

let schemaReadyPromise = null;

export const parseJson = (value, fallback = null) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Deterministic shuffle using seed for consistent ordering per attempt
const shuffleArray = (arr, seed) => {
  if (!Array.isArray(arr) || arr.length === 0) return arr;
  const copy = [...arr];
  
  // Seeded random: simple deterministic generator
  let rand = Math.sin(seed++) * 10000;
  rand = rand - Math.floor(rand);
  
  for (let i = copy.length - 1; i > 0; i--) {
    rand = Math.sin(seed++) * 10000;
    rand = rand - Math.floor(rand);
    const j = Math.floor(rand * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const shuffleQuestions = (questionIds, attemptId) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return questionIds;
  return shuffleArray(questionIds, attemptId * 12345);
};

export const shuffleOptions = (question, attemptId) => {
  if (!question || question.questionType !== 'mcq') return question;
  if (!Array.isArray(question.options) || question.options.length === 0) return question;
  
  return {
    ...question,
    options: shuffleArray(question.options, attemptId * 67890),
  };
};

export const ensureAssessmentSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS assessments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          assessmentType ENUM('exam', 'quiz', 'midterm', 'irat', 'trat') NOT NULL,
          subject VARCHAR(100),
          year INT,
          semester INT,
          durationMinutes INT NOT NULL DEFAULT 30,
          totalMarks DECIMAL(7,2) NOT NULL DEFAULT 100,
          attemptLimit INT NOT NULL DEFAULT 1,
          startAt DATETIME NULL,
          endAt DATETIME NULL,
          isPublished TINYINT(1) NOT NULL DEFAULT 0,
          questionIds JSON,
          randomizeQuestions TINYINT(1) NOT NULL DEFAULT 0,
          randomizeOptions TINYINT(1) NOT NULL DEFAULT 0,
          negativeMarkingRules JSON NULL,
          questionMarksConfig JSON NULL,
          teamSize INT NULL,
          createdBy INT NOT NULL,
          isArchived TINYINT(1) NOT NULL DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_assessment_type (assessmentType),
          INDEX idx_assessment_published (isPublished),
          INDEX idx_assessment_creator (createdBy),
          INDEX idx_assessment_window (startAt, endAt)
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS assessment_attempts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          assessmentId INT NOT NULL,
          studentId INT NOT NULL,
          attemptNo INT NOT NULL,
          status ENUM('in_progress', 'submitted') NOT NULL DEFAULT 'in_progress',
          scorePct DECIMAL(6,2) NULL,
          scoreMarks DECIMAL(8,2) NULL,
          answers JSON,
          detailedAnswers JSON NULL,
          questionIds JSON,
          teamId INT NULL,
          startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          submittedAt DATETIME NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (assessmentId) REFERENCES assessments(id) ON DELETE CASCADE,
          FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_attempt_assessment_student (assessmentId, studentId),
          INDEX idx_attempt_student (studentId),
          INDEX idx_attempt_status (status),
          INDEX idx_attempt_team (teamId),
          UNIQUE KEY uq_assessment_attempt_no (assessmentId, studentId, attemptNo)
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS assessment_teams (
          id INT PRIMARY KEY AUTO_INCREMENT,
          assessmentId INT NOT NULL,
          attemptId INT,
          teamName VARCHAR(255),
          members JSON NOT NULL,
          status ENUM('forming', 'in_progress', 'submitted') NOT NULL DEFAULT 'forming',
          teamScore DECIMAL(8,2) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assessmentId) REFERENCES assessments(id) ON DELETE CASCADE,
          FOREIGN KEY (attemptId) REFERENCES assessment_attempts(id) ON DELETE SET NULL,
          INDEX idx_team_assessment (assessmentId),
          INDEX idx_team_attempt (attemptId)
        )
      `);
    })();
  }

  return schemaReadyPromise;
};

export const createAssessment = async (data) => {
  await ensureAssessmentSchema();

  const query = `
    INSERT INTO assessments
      (title, description, assessmentType, subject, year, semester, durationMinutes, totalMarks, attemptLimit, startAt, endAt, isPublished, questionIds, randomizeQuestions, randomizeOptions, negativeMarkingRules, questionMarksConfig, teamSize, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(query, [
    data.title,
    data.description || null,
    data.assessmentType,
    data.subject || null,
    data.year || null,
    data.semester || null,
    data.durationMinutes || 30,
    data.totalMarks || 100,
    data.attemptLimit || 1,
    data.startAt || null,
    data.endAt || null,
    data.isPublished ? 1 : 0,
    JSON.stringify(data.questionIds || []),
    data.randomizeQuestions ? 1 : 0,
    data.randomizeOptions ? 1 : 0,
    JSON.stringify(data.negativeMarkingRules || null),
    JSON.stringify(data.questionMarksConfig || null),
    data.teamSize || null,
    data.createdBy,
  ]);

  return result;
};

export const updateAssessment = async (assessmentId, data) => {
  await ensureAssessmentSchema();

  const fields = [];
  const params = [];

  const allowed = {
    title: data.title,
    description: data.description,
    assessmentType: data.assessmentType,
    subject: data.subject,
    year: data.year,
    semester: data.semester,
    durationMinutes: data.durationMinutes,
    totalMarks: data.totalMarks,
    attemptLimit: data.attemptLimit,
    startAt: data.startAt,
    endAt: data.endAt,
    isPublished: data.isPublished == null ? undefined : (data.isPublished ? 1 : 0),
    randomizeQuestions: data.randomizeQuestions == null ? undefined : (data.randomizeQuestions ? 1 : 0),
    randomizeOptions: data.randomizeOptions == null ? undefined : (data.randomizeOptions ? 1 : 0),
    teamSize: data.teamSize,
  };

  Object.entries(allowed).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (data.questionIds !== undefined) {
    fields.push('questionIds = ?');
    params.push(JSON.stringify(data.questionIds || []));
  }

  if (data.negativeMarkingRules !== undefined) {
    fields.push('negativeMarkingRules = ?');
    params.push(JSON.stringify(data.negativeMarkingRules || null));
  }

  if (data.questionMarksConfig !== undefined) {
    fields.push('questionMarksConfig = ?');
    params.push(JSON.stringify(data.questionMarksConfig || null));
  }

  if (!fields.length) return { affectedRows: 0 };

  params.push(assessmentId);

  const [result] = await pool.execute(
    `UPDATE assessments SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ? AND isArchived = 0`,
    params
  );

  return result;
};

export const getAssessmentById = async (assessmentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `
      SELECT a.*, u.firstName AS creatorFirstName, u.lastName AS creatorLastName
      FROM assessments a
      LEFT JOIN users u ON u.id = a.createdBy
      WHERE a.id = ? AND a.isArchived = 0
      LIMIT 1
    `,
    [assessmentId]
  );

  if (!rows[0]) return null;

  return {
    ...rows[0],
    questionIds: parseJson(rows[0].questionIds, []),
  };
};

export const listAssessments = async ({ role, userId, type, publishedOnly = false }) => {
  await ensureAssessmentSchema();

  let query = `
    SELECT a.*, u.firstName AS creatorFirstName, u.lastName AS creatorLastName
    FROM assessments a
    LEFT JOIN users u ON u.id = a.createdBy
    WHERE a.isArchived = 0
  `;

  const params = [];

  if (type) {
    query += ' AND a.assessmentType = ?';
    params.push(type);
  }

  if (role === 'faculty') {
    query += ' AND a.createdBy = ?';
    params.push(userId);
  }

  if (role === 'student' || publishedOnly) {
    query += ' AND a.isPublished = 1';
    query += ' AND (a.startAt IS NULL OR a.startAt <= NOW())';
    query += ' AND (a.endAt IS NULL OR a.endAt >= NOW())';
  }

  query += ' ORDER BY COALESCE(a.startAt, a.createdAt) DESC';

  const [rows] = await pool.execute(query, params);

  return rows.map((row) => ({
    ...row,
    questionIds: parseJson(row.questionIds, []),
  }));
};

export const archiveAssessment = async (assessmentId) => {
  await ensureAssessmentSchema();
  const [result] = await pool.execute(
    'UPDATE assessments SET isArchived = 1, updatedAt = NOW() WHERE id = ? AND isArchived = 0',
    [assessmentId]
  );
  return result;
};

export const countSubmittedAttempts = async (assessmentId, studentId) => {
  await ensureAssessmentSchema();
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM assessment_attempts WHERE assessmentId = ? AND studentId = ? AND status = "submitted"',
    [assessmentId, studentId]
  );
  return rows[0]?.total || 0;
};

export const getInProgressAttempt = async (assessmentId, studentId) => {
  await ensureAssessmentSchema();
  const [rows] = await pool.execute(
    `
      SELECT *
      FROM assessment_attempts
      WHERE assessmentId = ? AND studentId = ? AND status = 'in_progress'
      ORDER BY startedAt DESC
      LIMIT 1
    `,
    [assessmentId, studentId]
  );

  if (!rows[0]) return null;
  return {
    ...rows[0],
    answers: parseJson(rows[0].answers, {}),
    questionIds: parseJson(rows[0].questionIds, []),
  };
};

export const createAttempt = async ({ assessmentId, studentId, attemptNo, questionIds, randomize = false }) => {
  await ensureAssessmentSchema();

  // Shuffle questions if randomization is enabled
  const shuffledQuestionIds = randomize ? shuffleQuestions(questionIds, attemptNo * studentId) : questionIds;

  const [result] = await pool.execute(
    `
      INSERT INTO assessment_attempts
        (assessmentId, studentId, attemptNo, status, answers, detailedAnswers, questionIds, startedAt)
      VALUES (?, ?, ?, 'in_progress', ?, ?, ?, NOW())
    `,
    [assessmentId, studentId, attemptNo, JSON.stringify({}), JSON.stringify([]), JSON.stringify(shuffledQuestionIds || [])]
  );

  return result;
};

export const getAttemptById = async (attemptId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute('SELECT * FROM assessment_attempts WHERE id = ? LIMIT 1', [attemptId]);
  if (!rows[0]) return null;

  return {
    ...rows[0],
    answers: parseJson(rows[0].answers, {}),
    questionIds: parseJson(rows[0].questionIds, []),
  };
};

export const submitAttempt = async ({ attemptId, answers, detailedAnswers, scorePct, scoreMarks }) => {
  await ensureAssessmentSchema();

  const [result] = await pool.execute(
    `
      UPDATE assessment_attempts
      SET status = 'submitted', answers = ?, detailedAnswers = ?, scorePct = ?, scoreMarks = ?, submittedAt = NOW(), updatedAt = NOW()
      WHERE id = ? AND status = 'in_progress'
    `,
    [JSON.stringify(answers || {}), JSON.stringify(detailedAnswers || []), scorePct, scoreMarks, attemptId]
  );

  return result;
};

export const listAttemptsForStudent = async (studentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `
      SELECT aa.*, a.title, a.assessmentType, a.subject, a.totalMarks
      FROM assessment_attempts aa
      INNER JOIN assessments a ON a.id = aa.assessmentId
      WHERE aa.studentId = ? AND a.isArchived = 0
      ORDER BY aa.createdAt DESC
    `,
    [studentId]
  );

  return rows.map((row) => ({
    ...row,
    answers: parseJson(row.answers, {}),
    questionIds: parseJson(row.questionIds, []),
  }));
};

export const listAttemptsForAssessment = async (assessmentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `
      SELECT aa.*, u.firstName, u.lastName, u.email
      FROM assessment_attempts aa
      INNER JOIN users u ON u.id = aa.studentId
      WHERE aa.assessmentId = ?
      ORDER BY aa.createdAt DESC
    `,
    [assessmentId]
  );

  return rows.map((row) => ({
    ...row,
    answers: parseJson(row.answers, {}),
    questionIds: parseJson(row.questionIds, []),
  }));
};

export const getAttemptSummaryMapForStudent = async (studentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `
      SELECT
        assessmentId,
        COUNT(*) AS totalAttempts,
        MAX(scorePct) AS bestScorePct,
        MAX(submittedAt) AS lastSubmittedAt,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submittedAttempts
      FROM assessment_attempts
      WHERE studentId = ?
      GROUP BY assessmentId
    `,
    [studentId]
  );

  return rows.reduce((acc, row) => {
    acc[row.assessmentId] = row;
    return acc;
  }, {});
};

// ── Announcements ─────────────────────────────────────────────────────────────

const ensureAnnouncementsSchema = async () => {
  await ensureAssessmentSchema();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assessment_announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      authorId INT NOT NULL,
      isPinned TINYINT(1) NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_ann_pinned (isPinned),
      INDEX idx_ann_created (createdAt)
    )
  `);
};

export const createAnnouncement = async ({ title, body, authorId, isPinned = false }) => {
  await ensureAnnouncementsSchema();
  const [result] = await pool.execute(
    'INSERT INTO assessment_announcements (title, body, authorId, isPinned) VALUES (?, ?, ?, ?)',
    [title, body, authorId, isPinned ? 1 : 0]
  );
  return result;
};

export const listAnnouncements = async () => {
  await ensureAnnouncementsSchema();
  const [rows] = await pool.execute(
    `SELECT aa.*, u.firstName AS authorFirstName, u.lastName AS authorLastName
     FROM assessment_announcements aa
     LEFT JOIN users u ON u.id = aa.authorId
     ORDER BY aa.isPinned DESC, aa.createdAt DESC
     LIMIT 50`
  );
  return rows;
};

export const deleteAnnouncement = async (id) => {
  await ensureAnnouncementsSchema();
  const [result] = await pool.execute('DELETE FROM assessment_announcements WHERE id = ?', [id]);
  return result;
};

export const toggleAnnouncementPin = async (id) => {
  await ensureAnnouncementsSchema();
  const [result] = await pool.execute(
    'UPDATE assessment_announcements SET isPinned = NOT isPinned WHERE id = ?',
    [id]
  );
  return result;
};

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async ({ role, userId }) => {
  await ensureAssessmentSchema();

  const isFacultyOrAdmin = role === 'faculty' || role === 'administrator' || role === 'super_admin';

  if (isFacultyOrAdmin) {
    const filter = role === 'faculty' ? 'AND a.createdBy = ?' : '';
    const params = role === 'faculty' ? [userId] : [];

    const [[totals]] = await pool.execute(
      `SELECT
        COUNT(*) AS total,
        SUM(isPublished = 1 AND isArchived = 0) AS published,
        SUM(isPublished = 0 AND isArchived = 0) AS drafts,
        SUM(isArchived = 1) AS archived
       FROM assessments a WHERE a.isArchived = 0 ${filter}`,
      params
    );

    const [[submissionStats]] = await pool.execute(
      `SELECT
        COUNT(*) AS totalAttempts,
        SUM(aa.status = 'submitted') AS submitted,
        AVG(CASE WHEN aa.status='submitted' THEN aa.scorePct END) AS avgScore
       FROM assessment_attempts aa
       INNER JOIN assessments a ON a.id = aa.assessmentId
       WHERE a.isArchived = 0 ${filter}`,
      params
    );

    const [[upcoming]] = await pool.execute(
      `SELECT COUNT(*) AS count FROM assessments a
       WHERE a.isArchived = 0 AND a.isPublished = 1 AND a.endAt > NOW() ${filter}`,
      params
    );

    return {
      total: totals.total || 0,
      published: totals.published || 0,
      drafts: totals.drafts || 0,
      totalAttempts: submissionStats.totalAttempts || 0,
      submitted: submissionStats.submitted || 0,
      avgScore: submissionStats.avgScore ? Number(submissionStats.avgScore).toFixed(1) : null,
      upcoming: upcoming.count || 0,
    };
  }

  // Student stats
  const [[myStats]] = await pool.execute(
    `SELECT
      COUNT(DISTINCT aa.assessmentId) AS attempted,
      SUM(aa.status = 'submitted') AS completed,
      AVG(CASE WHEN aa.status='submitted' THEN aa.scorePct END) AS avgScore,
      MAX(CASE WHEN aa.status='submitted' THEN aa.scorePct END) AS bestScore
     FROM assessment_attempts aa WHERE aa.studentId = ?`,
    [userId]
  );

  const [[available]] = await pool.execute(
    `SELECT COUNT(*) AS count FROM assessments
     WHERE isArchived = 0 AND isPublished = 1
       AND (startAt IS NULL OR startAt <= NOW())
       AND (endAt IS NULL OR endAt >= NOW())`
  );

  return {
    attempted: myStats.attempted || 0,
    completed: myStats.completed || 0,
    avgScore: myStats.avgScore ? Number(myStats.avgScore).toFixed(1) : null,
    bestScore: myStats.bestScore ? Number(myStats.bestScore).toFixed(1) : null,
    available: available.count || 0,
  };
};

// ── Gradebook ────────────────────────────────────────────────────────────────

export const getGradebook = async ({ role, userId }) => {
  await ensureAssessmentSchema();

  if (role === 'student') {
    const [rows] = await pool.execute(
      `SELECT aa.id AS attemptId, aa.assessmentId, aa.scorePct, aa.scoreMarks, aa.status,
              aa.submittedAt, a.title, a.totalMarks, a.assessmentType, a.subject
       FROM assessment_attempts aa
       INNER JOIN assessments a ON a.id = aa.assessmentId
       WHERE aa.studentId = ? AND aa.status = 'submitted'
       ORDER BY aa.submittedAt DESC`,
      [userId]
    );
    return rows;
  }

  // Faculty/admin: all student submissions
  const filter = role === 'faculty' ? 'AND a.createdBy = ?' : '';
  const params = role === 'faculty' ? [userId] : [];

  const [rows] = await pool.execute(
    `SELECT aa.id AS attemptId, aa.assessmentId, aa.studentId, aa.scorePct, aa.scoreMarks,
            aa.status, aa.submittedAt, aa.attemptNo,
            a.title AS assessmentTitle, a.totalMarks, a.assessmentType, a.subject,
            u.firstName, u.lastName, u.email
     FROM assessment_attempts aa
     INNER JOIN assessments a ON a.id = aa.assessmentId
     INNER JOIN users u ON u.id = aa.studentId
     WHERE aa.status = 'submitted' AND a.isArchived = 0 ${filter}
     ORDER BY a.title, u.lastName, u.firstName, aa.submittedAt DESC`,
    params
  );
  return rows;
};

// ── Student-specific methods ──────────────────────────────────────────────────

export const getStudentAvailableAssessments = async (studentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.assessmentType, a.subject, a.durationMinutes, a.totalMarks,
            a.attemptLimit, a.startAt, a.endAt, a.createdAt,
            u.firstName AS creatorFirstName, u.lastName AS creatorLastName,
            COUNT(DISTINCT aa.id) AS studentAttempts,
            MAX(aa.scorePct) AS bestScore,
            MAX(aa.submittedAt) AS lastAttemptDate
     FROM assessments a
     LEFT JOIN users u ON u.id = a.createdBy
     LEFT JOIN assessment_attempts aa ON aa.assessmentId = a.id AND aa.studentId = ?
     WHERE a.isArchived = 0 AND a.isPublished = 1
       AND (a.startAt IS NULL OR a.startAt <= NOW())
       AND (a.endAt IS NULL OR a.endAt >= NOW())
     GROUP BY a.id
     ORDER BY COALESCE(a.startAt, a.createdAt) DESC`,
    [studentId]
  );

  return rows.map((row) => ({
    ...row,
    canAttempt: row.studentAttempts < row.attemptLimit,
    attemptRemaining: row.attemptLimit - row.studentAttempts,
  }));
};

export const getStudentAssessmentWithQuestions = async (assessmentId, studentId) => {
  await ensureAssessmentSchema();

  const assessment = await getAssessmentById(assessmentId);
  if (!assessment || !assessment.isPublished) return null;

  // Check if student can attempt
  const submitted = await countSubmittedAttempts(assessmentId, studentId);
  const canAttempt = submitted < assessment.attemptLimit;

  // Get question details
  const questionIds = parseJson(assessment.questionIds, []);
  let questions = [];

  if (questionIds.length > 0) {
    const [rows] = await pool.execute(
      `SELECT id, questionText, questionType, options, correctAnswer, difficulty, subject
       FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );

    questions = rows.map((q) => ({
      ...q,
      options: parseJson(q.options, []),
    }));
  }

  return {
    ...assessment,
    questions,
    canAttempt,
    attemptCount: submitted,
    attemptRemaining: assessment.attemptLimit - submitted,
  };
};

export const getStudentAssessmentAttempts = async (studentId) => {
  await ensureAssessmentSchema();

  const [rows] = await pool.execute(
    `SELECT aa.id, aa.assessmentId, aa.attemptNo, aa.status, aa.scorePct, aa.scoreMarks,
            aa.startedAt, aa.submittedAt,
            a.title, a.totalMarks, a.assessmentType, a.subject, a.durationMinutes,
            u.firstName AS creatorFirstName, u.lastName AS creatorLastName
     FROM assessment_attempts aa
     INNER JOIN assessments a ON a.id = aa.assessmentId
     LEFT JOIN users u ON u.id = a.createdBy
     WHERE aa.studentId = ?
     ORDER BY aa.createdAt DESC`,
    [studentId]
  );

  return rows;
};

