import express from 'express';
import { getYears, getSubjects, getTopics } from '../controllers/academicController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const studentAuth = [authenticate, authorize(['student'])];

router.get('/years', studentAuth, getYears);
router.get('/subjects', studentAuth, getSubjects);
router.get('/topics', studentAuth, getTopics);

export default router;
