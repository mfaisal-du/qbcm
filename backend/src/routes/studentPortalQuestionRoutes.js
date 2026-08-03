import express from 'express';
import { getPracticeQuestions } from '../controllers/questionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Expose only student practice list from dedicated student server
router.get('/practice/list', authenticate, authorize(['student']), getPracticeQuestions);

export default router;
