import * as StudentAnswer from '../models/StudentAnswer.js';

export const submitAnswer = async (req, res) => {
  try {
    const { questionId, selectedAnswer, timeSpent } = req.body;

    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await StudentAnswer.saveStudentAnswer({
      studentId: req.user.userId,
      questionId,
      selectedAnswer,
      timeSpent: timeSpent || 0
    });

    res.status(201).json({
      message: 'Answer submitted successfully',
      answerId: result.insertId
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentAnswers = async (req, res) => {
  try {
    const { questionId } = req.query;
    const answers = await StudentAnswer.getStudentAnswers(req.user.userId, questionId);

    res.json({
      message: 'Answers retrieved successfully',
      count: answers.length,
      answers
    });
  } catch (error) {
    console.error('Get student answers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentResult = async (req, res) => {
  try {
    const results = await StudentAnswer.getStudentResult(req.user.userId);
    const stats = await StudentAnswer.getStudentStats(req.user.userId);

    res.json({
      message: 'Results retrieved successfully',
      stats,
      results
    });
  } catch (error) {
    console.error('Get student result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const stats = await StudentAnswer.getStudentStats(req.user.userId);

    res.json({
      message: 'Stats retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
