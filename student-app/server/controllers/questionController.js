import * as Question from '../models/Question.js';
import * as QuestionUsage from '../models/QuestionUsage.js';

const normalizeRole = (role) => (role === 'admin' ? 'administrator' : role);

const isSuperAdmin = (role) => normalizeRole(role) === 'super_admin';

const ensureQuestionCanBeModified = async (req, questionId) => {
  const question = await Question.getQuestionById(questionId);
  if (!question) {
    return { error: { status: 404, message: 'Question not found' } };
  }

  if (isSuperAdmin(req.user.role)) {
    return { question };
  }

  if (normalizeRole(req.user.role) === 'faculty' && question.createdBy !== req.user.userId) {
    return { error: { status: 403, message: 'Access denied: You can only modify your own questions' } };
  }

  if (question.status !== 'draft') {
    return {
      error: {
        status: 403,
        message: 'Question is locked. Only super admin can modify questions after draft stage.'
      }
    };
  }

  return { question };
};

export const getPracticeQuestions = async (req, res) => {
  try {
    const filters = {
      subject: req.query.subject,
      topic: req.query.topic,
      difficulty: req.query.difficulty,
      year: req.query.year,
      semester: req.query.semester ? Number(req.query.semester) : undefined,
      cognitiveLevel: req.query.cognitiveLevel,
      limit: req.query.limit || 50
    };
    const questions = await Question.getPracticeQuestions(filters);
    res.json({
      message: 'Practice questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get practice questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionStats = async (req, res) => {
  try {
    const filters = {};
    if (req.query.createdBy) filters.createdBy = req.query.createdBy;
    // For faculty, only return their own stats
    if (req.user.role === 'faculty') filters.createdBy = req.user.userId;
    const stats = await Question.getQuestionStats(filters);
    res.json({ message: 'Stats retrieved', stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const importQuestionsBatch = async (req, res) => {
  let importErrors = [];
  try {
    const start = Date.now();
    const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];
    if (!questions.length) return res.status(400).json({ message: 'No questions provided' });
    let imported = 0, failed = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        const data = { ...q };
        if (data.question && !data.questionText) data.questionText = data.question;
        await Question.createQuestion({ ...data, createdBy: req.user.userId, status: 'draft' });
        imported++;
      } catch (err) {
        failed++;
        importErrors.push({ row: i + 1, error: err?.message || 'Unknown error' });
      }
    }

    res.json({
      ok: true,
      imported,
      failed,
      total: questions.length,
      durationMs: Date.now() - start,
      errors: importErrors.slice(0, 200)
    });
  } catch (error) {
    console.error('Batch import fatal error:', error);
    res.status(500).json({ ok: false, message: 'Server error during batch import', error: error?.message, errors: importErrors });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { questionText, questionType, subject, topic, year, semester, difficulty, 
      cognitiveLevel, assessmentType, learningOutcome, competencies, weighting, 
      coverage, courseCode, phase, options, correctAnswer, explanation, audio } = req.body;

    if (!questionText || !questionType || !subject || !topic || !year || !difficulty) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await Question.createQuestion({
      questionText, questionType, subject, topic, year, semester, difficulty,
      cognitiveLevel, assessmentType, learningOutcome, competencies, weighting, 
      coverage, courseCode, phase, options, correctAnswer, explanation, audio,
      createdBy: req.user.userId,
      status: 'draft'
    });

    res.status(201).json({
      message: 'Question created successfully',
      questionId: result.insertId
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.getQuestionById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question retrieved successfully',
      question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const filters = {
      year: req.query.year,
      semester: req.query.semester,
      subject: req.query.subject,
      topic: req.query.topic,
      difficulty: req.query.difficulty,
      status: req.query.status,
      cognitiveLevel: req.query.cognitiveLevel,
      assessmentType: req.query.assessmentType,
      coverage: req.query.coverage,
      createdBy: req.query.createdBy,
      createdFrom: req.query.createdFrom,
      createdTo: req.query.createdTo
    };

    const questions = await Question.getAllQuestions(filters);

    res.json({
      message: 'Questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get all questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionsByCreator = async (req, res) => {
  try {
    const createdBy = req.query.createdBy || req.user.userId;
    const { status } = req.query;
    
    const questions = await Question.getQuestionsByCreator(createdBy, status);

    res.json({
      message: 'Questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get questions by creator error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingQuestions = async (req, res) => {
  try {
    const questions = await Question.getPendingQuestions();

    res.json({
      message: 'Pending questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get pending questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { semester } = req.query;
    
    const questions = await Question.getQuestionsByYear(year, semester);

    res.json({
      message: 'Questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get questions by year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const { topic } = req.query;
    
    const questions = await Question.getQuestionsBySubject(subject, topic);

    res.json({
      message: 'Questions retrieved successfully',
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get questions by subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updateData = req.body;

    const lockCheck = await ensureQuestionCanBeModified(req, questionId);
    if (lockCheck.error) {
      return res.status(lockCheck.error.status).json({ message: lockCheck.error.message });
    }

    const result = await Question.updateQuestion(questionId, updateData);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const lockCheck = await ensureQuestionCanBeModified(req, questionId);
    if (lockCheck.error) {
      return res.status(lockCheck.error.status).json({ message: lockCheck.error.message });
    }

    const result = await Question.deleteQuestion(questionId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionUsage = async (req, res) => {
  try {
    const { questionId } = req.params;
    const usage = await Question.getQuestionUsageStats(questionId);
    res.json({ message: 'Usage stats retrieved', usage });
  } catch (error) {
    console.error('Get question usage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const archiveQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const lockCheck = await ensureQuestionCanBeModified(req, questionId);
    if (lockCheck.error) {
      return res.status(lockCheck.error.status).json({ message: lockCheck.error.message });
    }

    const result = await Question.archiveQuestion(questionId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question archived successfully' });
  } catch (error) {
    console.error('Archive question error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const submitForReview = async (req, res) => {
  try {
    const { questionId } = req.params;

    const lockCheck = await ensureQuestionCanBeModified(req, questionId);
    if (lockCheck.error) {
      return res.status(lockCheck.error.status).json({ message: lockCheck.error.message });
    }

    const result = await Question.updateQuestionStatus(questionId, 'vetted');
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question submitted for review' });
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getVettedQuestions = async (req, res) => {
  try {
    const questions = await Question.getVettedQuestions();
    res.json({ message: 'Vetted questions retrieved', count: questions.length, questions });
  } catch (error) {
    console.error('Get vetted questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Question Usage History ──────────────────────────

export const addQuestionUsage = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { assessmentType, academicYear, semester, notes } = req.body;

    const question = await Question.getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!isSuperAdmin(req.user.role) && question.status !== 'draft') {
      return res.status(403).json({ message: 'Question is locked. Only super admin can modify usage after draft stage.' });
    }

    if (!assessmentType || !academicYear || !semester) {
      return res.status(400).json({ message: 'assessmentType, academicYear, and semester are required' });
    }
    const validTypes = ['quiz', 'midterm', 'endcourse'];
    if (!validTypes.includes(assessmentType)) {
      return res.status(400).json({ message: 'assessmentType must be quiz, midterm, or endcourse' });
    }

    const result = await QuestionUsage.addUsageRecord({
      questionId: parseInt(questionId),
      assessmentType,
      academicYear: parseInt(academicYear),
      semester: parseInt(semester),
      notes,
      addedBy: req.user.userId
    });

    // Also increment the question's usageCount
    await Question.incrementUsageCount(questionId);

    res.status(201).json({ message: 'Usage record added', usageId: result.insertId });
  } catch (error) {
    console.error('Add question usage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestionUsageHistory = async (req, res) => {
  try {
    const { questionId } = req.params;
    const records = await QuestionUsage.getUsageByQuestion(questionId);
    const summary = await QuestionUsage.getUsageSummaryByQuestion(questionId);
    res.json({ message: 'Usage history retrieved', records, summary });
  } catch (error) {
    console.error('Get question usage history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteQuestionUsage = async (req, res) => {
  try {
    const { usageId } = req.params;

    if (!isSuperAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Only super admin can delete usage records' });
    }

    const result = await QuestionUsage.deleteUsageRecord(usageId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usage record not found' });
    }
    res.json({ message: 'Usage record deleted' });
  } catch (error) {
    console.error('Delete question usage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
