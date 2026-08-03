import * as Assessment from '../models/Assessment.js';
import pool from '../config/database.js';

const parseJson = (value, fallback = null) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getAvailableAssessments = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const assessments = await Assessment.getStudentAvailableAssessments(studentId);
    res.json({
      message: 'Available assessments retrieved',
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    console.error('Get available assessments error:', error);
    res.status(500).json({
      message: 'Failed to retrieve assessments',
      error: error.message
    });
  }
};

export const getAssessmentDetails = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user.userId;

    const assessment = await Assessment.getStudentAssessmentWithQuestions(assessmentId, studentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found or not available' });
    }

    // Check if student can start new attempt
    if (!assessment.canAttempt && assessment.attemptRemaining <= 0) {
      return res.json({
        ...assessment,
        message: 'Maximum attempts reached'
      });
    }

    res.json({
      message: 'Assessment details retrieved',
      data: assessment
    });
  } catch (error) {
    console.error('Get assessment details error:', error);
    res.status(500).json({
      message: 'Failed to retrieve assessment',
      error: error.message
    });
  }
};

export const startAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user.userId;

    // Get assessment
    const assessment = await Assessment.getAssessmentById(assessmentId);
    if (!assessment || !assessment.isPublished) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check time window
    const now = new Date();
    if (assessment.startAt && new Date(assessment.startAt) > now) {
      return res.status(403).json({ message: 'Assessment has not started yet' });
    }
    if (assessment.endAt && new Date(assessment.endAt) < now) {
      return res.status(403).json({ message: 'Assessment has ended' });
    }

    // Check attempts
    const submitted = await Assessment.countSubmittedAttempts(assessmentId, studentId);
    if (submitted >= assessment.attemptLimit) {
      return res.status(403).json({
        message: 'Maximum attempts reached',
        attemptLimit: assessment.attemptLimit,
        attemptsUsed: submitted
      });
    }

    // Check for in-progress attempt
    let attempt = await Assessment.getInProgressAttempt(assessmentId, studentId);
    if (!attempt) {
      // Create new attempt
      const nextAttemptNo = submitted + 1;
      const questionIds = assessment.questionIds || [];
      const result = await Assessment.createAttempt({
        assessmentId,
        studentId,
        attemptNo: nextAttemptNo,
        questionIds,
        randomize: assessment.randomizeQuestions
      });
      attempt = {
        id: result.insertId,
        assessmentId,
        studentId,
        attemptNo: nextAttemptNo,
        status: 'in_progress',
        answers: {},
        questionIds: assessment.randomizeQuestions 
          ? Assessment.shuffleQuestions(questionIds, result.insertId * studentId)
          : questionIds
      };
    }

    // Get full questions
    const questionIds = attempt.questionIds || [];
    let questions = [];
    if (questionIds.length > 0) {
      const [rows] = await pool.execute(
        `SELECT id, questionText, questionType, options, difficulty, subject
         FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
        questionIds
      );

      questions = rows.map((q) => {
        const question = {
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: parseJson(q.options, []).map(opt => typeof opt === 'object' ? opt : { text: opt, value: opt }),
          difficulty: q.difficulty,
          subject: q.subject,
          marks: 1
        };

        // Apply option randomization if enabled
        if (assessment.randomizeOptions && question.questionType === 'mcq') {
          const shuffled = Assessment.shuffleOptions(question, attempt.id);
          question.options = shuffled.options;
        }

        return question;
      });
    }

    res.status(201).json({
      message: 'Assessment attempt started',
      data: {
        attemptId: attempt.id,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        durationMinutes: assessment.durationMinutes,
        totalMarks: assessment.totalMarks,
        questionCount: questions.length,
        startedAt: attempt.startedAt,
        endTime: new Date(new Date(attempt.startedAt).getTime() + assessment.durationMinutes * 60000),
        questions
      }
    });
  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({
      message: 'Failed to start assessment',
      error: error.message
    });
  }
};

export const submitAssessmentAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, detailedAnswers } = req.body;
    const studentId = req.user.userId;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid answers format' });
    }

    // Get attempt
    const attempt = await Assessment.getAttemptById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.studentId !== studentId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt is already submitted' });
    }

    // Get assessment
    const assessment = await Assessment.getAssessmentById(attempt.assessmentId);
    const questionIds = attempt.questionIds || [];

    // Get question data for scoring
    const [questions] = await pool.execute(
      `SELECT id, correctAnswer FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );

    // Calculate score
    let correctCount = 0;
    let totalMarks = 0;
    const scoredAnswers = [];

    (questions || []).forEach((q) => {
      const studentAnswer = answers[q.id];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      scoredAnswers.push({
        questionId: q.id,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect
      });
    });

    const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const scoreMarks = (scorePct / 100) * assessment.totalMarks;

    // Submit attempt
    await Assessment.submitAttempt({
      attemptId,
      answers,
      detailedAnswers: scoredAnswers,
      scorePct,
      scoreMarks
    });

    res.json({
      message: 'Assessment submitted successfully',
      data: {
        attemptId,
        scorePct,
        scoreMarks,
        totalMarks: assessment.totalMarks,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({
      message: 'Failed to submit assessment',
      error: error.message
    });
  }
};

export const getMyAssessmentAttempts = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const attempts = await Assessment.getStudentAssessmentAttempts(studentId);

    res.json({
      message: 'Assessment attempts retrieved',
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      message: 'Failed to retrieve attempts',
      error: error.message
    });
  }
};
