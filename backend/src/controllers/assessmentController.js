import * as Assessment from '../models/Assessment.js';
import * as Question from '../models/Question.js';

const normalizeRole = (role) => (role === 'admin' ? 'administrator' : role);

const canManageAssessments = (role) => {
  const r = normalizeRole(role);
  return r === 'faculty' || r === 'administrator' || r === 'super_admin';
};

const typeMap = {
  exam: 'exam',
  quiz: 'quiz',
  midterm: 'midterm',
  irat: 'irat',
  trat: 'trat',
};

const normalizeType = (value) => typeMap[String(value || '').toLowerCase()] || null;

const sanitizeQuestion = (q) => ({
  id: q.id,
  questionText: q.questionText,
  questionType: q.questionType,
  options: q.options || [],
  subject: q.subject,
  topic: q.topic,
  difficulty: q.difficulty,
});

const parseAndValidateQuestionIds = (questionIds) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return [];
  const ids = questionIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
};

const parseJson = (value, fallback = null) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Calculate marks with negative marking rules and per-question marks configuration
const scoreAttemptAdvanced = (questions, answers, totalMarks, negativeMarkingRules, questionMarksConfig) => {
  const total = questions.length;
  if (!total) return { scorePct: 0, scoreMarks: 0, totalCorrect: 0, perQuestionScores: [] };

  const negRules = parseJson(negativeMarkingRules, {});
  const marksConfig = parseJson(questionMarksConfig, {});
  const perQuestionScores = [];

  let totalScore = 0;

  questions.forEach((q) => {
    const answer = answers?.[String(q.id)] ?? answers?.[q.id];
    const expected = (q.correctAnswer ?? '').toString().trim().toLowerCase();
    const actual = answer ? answer.toString().trim().toLowerCase() : '';

    // Determine marks for this question
    const questionMarks = marksConfig[q.id] !== undefined ? Number(marksConfig[q.id]) : totalMarks / total;

    let isCorrect = expected && actual === expected;
    let score = 0;

    if (isCorrect) {
      score = questionMarks;
    } else if (actual.length > 0) {
      // Apply negative marking if configured and answer was provided
      const negMarkPercentage = negRules[q.id] ?? negRules.default ?? 0;
      score = -1 * (questionMarks * (negMarkPercentage / 100));
    }
    // else: no answer, no negative mark, score = 0

    perQuestionScores.push({
      questionId: q.id,
      isCorrect,
      studentAnswer: answer,
      marks: Math.max(0, score), // Ensure no negative final marks
      maxMarks: questionMarks,
    });

    totalScore += score;
  });

  const finalMarks = Math.max(0, totalScore);
  const scorePct = (finalMarks / totalMarks) * 100;

  return {
    scorePct: Number(scorePct.toFixed(2)),
    scoreMarks: Number(finalMarks.toFixed(2)),
    totalCorrect: perQuestionScores.filter((s) => s.isCorrect).length,
    perQuestionScores,
  };
};

// Fallback to original scoring if no advanced rules
const scoreAttempt = (questions, answers, totalMarks) => {
  const total = questions.length;
  if (!total) return { scorePct: 0, scoreMarks: 0, totalCorrect: 0, totalQuestions: 0 };

  let correct = 0;
  questions.forEach((q) => {
    const answer = answers?.[String(q.id)] ?? answers?.[q.id];
    if (answer == null) return;

    const expected = (q.correctAnswer ?? '').toString().trim().toLowerCase();
    const actual = answer.toString().trim().toLowerCase();
    if (expected && actual === expected) correct += 1;
  });

  const scorePct = (correct / total) * 100;
  const scoreMarks = (scorePct / 100) * (Number(totalMarks) || 100);

  return {
    scorePct: Number(scorePct.toFixed(2)),
    scoreMarks: Number(scoreMarks.toFixed(2)),
    totalCorrect: correct,
    totalQuestions: total,
  };
};

export const listAssessments = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const type = normalizeType(req.query.type);

    const assessments = await Assessment.listAssessments({
      role,
      userId: req.user.userId,
      type,
    });

    if (role !== 'student') {
      return res.json({ message: 'Assessments retrieved', count: assessments.length, assessments });
    }

    const summaryMap = await Assessment.getAttemptSummaryMapForStudent(req.user.userId);
    const merged = assessments.map((a) => ({
      ...a,
      myAttempts: summaryMap[a.id] || {
        totalAttempts: 0,
        submittedAttempts: 0,
        bestScorePct: null,
        lastSubmittedAt: null,
      },
    }));

    return res.json({ message: 'Assessments retrieved', count: merged.length, assessments: merged });
  } catch (error) {
    console.error('List assessments error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAssessment = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const assessment = await Assessment.getAssessmentById(req.params.assessmentId);

    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (role === 'faculty' && assessment.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (role === 'student') {
      const now = new Date();
      const startAt = assessment.startAt ? new Date(assessment.startAt) : null;
      const endAt = assessment.endAt ? new Date(assessment.endAt) : null;
      if (!assessment.isPublished || (startAt && now < startAt) || (endAt && now > endAt)) {
        return res.status(403).json({ message: 'Assessment is not available' });
      }
    }

    const questionIds = parseAndValidateQuestionIds(assessment.questionIds);
    const questions = questionIds.length ? await Question.getQuestionsByIds(questionIds) : [];

    return res.json({
      message: 'Assessment retrieved',
      assessment: {
        ...assessment,
        questionCount: questionIds.length,
      },
      questions: questions.map(sanitizeQuestion),
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAssessment = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assessmentType = normalizeType(req.body.assessmentType);
    const title = String(req.body.title || '').trim();
    const questionIds = parseAndValidateQuestionIds(req.body.questionIds);

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!assessmentType) return res.status(400).json({ message: 'Invalid assessment type' });
    if (!questionIds.length) return res.status(400).json({ message: 'At least one question is required' });

    const existingQuestions = await Question.getQuestionsByIds(questionIds);
    if (existingQuestions.length !== questionIds.length) {
      return res.status(400).json({ message: 'One or more selected questions do not exist' });
    }

    const data = {
      title,
      description: req.body.description,
      assessmentType,
      subject: req.body.subject,
      year: req.body.year,
      semester: req.body.semester,
      durationMinutes: Number(req.body.durationMinutes) || 30,
      totalMarks: Number(req.body.totalMarks) || 100,
      attemptLimit: Number(req.body.attemptLimit) || 1,
      startAt: req.body.startAt || null,
      endAt: req.body.endAt || null,
      isPublished: !!req.body.isPublished,
      questionIds,
      randomizeQuestions: !!req.body.randomizeQuestions,
      randomizeOptions: !!req.body.randomizeOptions,
      negativeMarkingRules: req.body.negativeMarkingRules || null,
      questionMarksConfig: req.body.questionMarksConfig || null,
      teamSize: req.body.teamSize || null,
      createdBy: req.user.userId,
    };

    const result = await Assessment.createAssessment(data);
    return res.status(201).json({ message: 'Assessment created', assessmentId: result.insertId });
  } catch (error) {
    console.error('Create assessment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const role = normalizeRole(req.user.role);
    const assessmentId = Number(req.params.assessmentId);
    const assessment = await Assessment.getAssessmentById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (role === 'faculty' && assessment.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payload = { ...req.body };

    if (payload.assessmentType !== undefined) {
      const normalizedType = normalizeType(payload.assessmentType);
      if (!normalizedType) return res.status(400).json({ message: 'Invalid assessment type' });
      payload.assessmentType = normalizedType;
    }

    if (payload.questionIds !== undefined) {
      const questionIds = parseAndValidateQuestionIds(payload.questionIds);
      if (!questionIds.length) return res.status(400).json({ message: 'At least one question is required' });
      const existingQuestions = await Question.getQuestionsByIds(questionIds);
      if (existingQuestions.length !== questionIds.length) {
        return res.status(400).json({ message: 'One or more selected questions do not exist' });
      }
      payload.questionIds = questionIds;
    }

    const result = await Assessment.updateAssessment(assessmentId, payload);
    if (!result.affectedRows) return res.status(400).json({ message: 'No changes made' });

    return res.json({ message: 'Assessment updated' });
  } catch (error) {
    console.error('Update assessment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const role = normalizeRole(req.user.role);
    const assessmentId = Number(req.params.assessmentId);
    const assessment = await Assessment.getAssessmentById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (role === 'faculty' && assessment.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await Assessment.archiveAssessment(assessmentId);
    if (!result.affectedRows) return res.status(400).json({ message: 'Assessment already removed' });

    return res.json({ message: 'Assessment archived' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const startAttempt = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can start attempts' });
    }

    const assessmentId = Number(req.params.assessmentId);
    const assessment = await Assessment.getAssessmentById(assessmentId);

    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const now = new Date();
    const startAt = assessment.startAt ? new Date(assessment.startAt) : null;
    const endAt = assessment.endAt ? new Date(assessment.endAt) : null;

    if (!assessment.isPublished || (startAt && now < startAt) || (endAt && now > endAt)) {
      return res.status(403).json({ message: 'Assessment is not available currently' });
    }

    const submittedCount = await Assessment.countSubmittedAttempts(assessmentId, req.user.userId);
    if (submittedCount >= Number(assessment.attemptLimit || 1)) {
      return res.status(403).json({ message: 'Attempt limit reached' });
    }

    const existingInProgress = await Assessment.getInProgressAttempt(assessmentId, req.user.userId);
    if (existingInProgress) {
      let questions = await Question.getQuestionsByIds(existingInProgress.questionIds || []);
      
      // Apply randomization if options randomization is enabled
      if (assessment.randomizeOptions && assessment.randomizeOptions === 1) {
        questions = questions.map(q => Assessment.shuffleOptions(q, existingInProgress.id));
      }

      return res.json({
        message: 'Existing in-progress attempt loaded',
        attempt: existingInProgress,
        assessment,
        questions: questions.map(sanitizeQuestion),
      });
    }

    const questionIds = parseAndValidateQuestionIds(assessment.questionIds);
    if (!questionIds.length) {
      return res.status(400).json({ message: 'Assessment has no questions configured' });
    }

    const questions = await Question.getQuestionsByIds(questionIds);
    if (!questions.length) {
      return res.status(400).json({ message: 'Assessment questions are not available' });
    }

    const attemptNo = submittedCount + 1;
    const randomize = assessment.randomizeQuestions === 1;
    const result = await Assessment.createAttempt({
      assessmentId,
      studentId: req.user.userId,
      attemptNo,
      questionIds,
      randomize,
    });

    const attempt = await Assessment.getAttemptById(result.insertId);
    
    // Reorder questions based on shuffled IDs in attempt
    let returnQuestions = await Question.getQuestionsByIds(attempt.questionIds || []);
    
    // Apply randomization if options randomization is enabled
    if (assessment.randomizeOptions && assessment.randomizeOptions === 1) {
      returnQuestions = returnQuestions.map(q => Assessment.shuffleOptions(q, attempt.id));
    }

    return res.status(201).json({
      message: 'Attempt started',
      attempt,
      assessment,
      questions: returnQuestions.map(sanitizeQuestion),
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit attempts' });
    }

    const assessmentId = Number(req.params.assessmentId);
    const { attemptId, answers } = req.body;

    if (!attemptId || typeof answers !== 'object') {
      return res.status(400).json({ message: 'attemptId and answers are required' });
    }

    const assessment = await Assessment.getAssessmentById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const attempt = await Assessment.getAttemptById(Number(attemptId));
    if (!attempt || attempt.assessmentId !== assessmentId || attempt.studentId !== req.user.userId) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    const questions = await Question.getQuestionsByIds(attempt.questionIds || []);
    
    // Use advanced scoring if negative marking or per-question marks are configured
    const hasAdvancedConfig = assessment.negativeMarkingRules || assessment.questionMarksConfig;
    const scoring = hasAdvancedConfig
      ? scoreAttemptAdvanced(questions, answers, assessment.totalMarks, assessment.negativeMarkingRules, assessment.questionMarksConfig)
      : scoreAttempt(questions, answers, assessment.totalMarks);

    // Build detailed answers for review
    const detailedAnswers = questions.map((q) => {
      const answer = answers?.[String(q.id)] ?? answers?.[q.id];
      const perQ = scoring.perQuestionScores?.find(s => s.questionId === q.id) || {};
      return {
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        studentAnswer: answer,
        isCorrect: perQ.isCorrect ?? false,
        marks: perQ.marks ?? 0,
        maxMarks: perQ.maxMarks ?? (assessment.totalMarks / questions.length),
        explanation: q.explanation || '',
      };
    });

    const result = await Assessment.submitAttempt({
      attemptId: attempt.id,
      answers,
      detailedAnswers,
      scorePct: scoring.scorePct,
      scoreMarks: scoring.scoreMarks,
    });

    if (!result.affectedRows) {
      return res.status(400).json({ message: 'Unable to submit attempt' });
    }

    return res.json({
      message: 'Attempt submitted',
      result: scoring,
      detailedAnswers,
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAttemptReview = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const { assessmentId, attemptId } = req.params;

    const assessment = await Assessment.getAssessmentById(Number(assessmentId));
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const attempt = await Assessment.getAttemptById(Number(attemptId));
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    if (attempt.assessmentId !== Number(assessmentId)) {
      return res.status(400).json({ message: 'Attempt does not belong to this assessment' });
    }

    // Students can only view their own attempts
    if (role === 'student' && attempt.studentId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Faculty can only view attempts in their assessments
    if (role === 'faculty' && assessment.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (attempt.status !== 'submitted') {
      return res.status(400).json({ message: 'Attempt has not been submitted yet' });
    }

    const detailedAnswers = parseJson(attempt.detailedAnswers, []);

    return res.json({
      message: 'Attempt review retrieved',
      attempt: {
        id: attempt.id,
        assessmentId: attempt.assessmentId,
        studentId: attempt.studentId,
        scorePct: attempt.scorePct,
        scoreMarks: attempt.scoreMarks,
        submittedAt: attempt.submittedAt,
      },
      assessment: {
        id: assessment.id,
        title: assessment.title,
        totalMarks: assessment.totalMarks,
      },
      detailedAnswers,
    });
  } catch (error) {
    console.error('Get attempt review error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const listMyAttempts = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can view personal attempts' });
    }

    const attempts = await Assessment.listAttemptsForStudent(req.user.userId);
    return res.json({ message: 'Attempts retrieved', count: attempts.length, attempts });
  } catch (error) {
    console.error('List my attempts error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const listAssessmentAttempts = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const role = normalizeRole(req.user.role);
    const assessmentId = Number(req.params.assessmentId);

    const assessment = await Assessment.getAssessmentById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (role === 'faculty' && assessment.createdBy !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attempts = await Assessment.listAttemptsForAssessment(assessmentId);
    return res.json({ message: 'Assessment attempts retrieved', count: attempts.length, attempts });
  } catch (error) {
    console.error('List assessment attempts error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const stats = await Assessment.getDashboardStats({ role, userId: req.user.userId });
    return res.json({ message: 'Stats retrieved', stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Gradebook ────────────────────────────────────────────────────────────────

export const getGradebook = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const rows = await Assessment.getGradebook({ role, userId: req.user.userId });
    return res.json({ message: 'Gradebook retrieved', count: rows.length, rows });
  } catch (error) {
    console.error('Gradebook error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Announcements ─────────────────────────────────────────────────────────────

export const listAnnouncements = async (req, res) => {
  try {
    const items = await Assessment.listAnnouncements();
    return res.json({ message: 'Announcements retrieved', count: items.length, announcements: items });
  } catch (error) {
    console.error('List announcements error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const result = await Assessment.createAnnouncement({
      title,
      body,
      authorId: req.user.userId,
      isPinned: !!req.body.isPinned,
    });
    return res.status(201).json({ message: 'Announcement created', id: result.insertId });
  } catch (error) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const result = await Assessment.deleteAnnouncement(Number(req.params.id));
    if (!result.affectedRows) return res.status(404).json({ message: 'Announcement not found' });
    return res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleAnnouncementPin = async (req, res) => {
  try {
    if (!canManageAssessments(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await Assessment.toggleAnnouncementPin(Number(req.params.id));
    return res.json({ message: 'Announcement pin toggled' });
  } catch (error) {
    console.error('Toggle pin error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
