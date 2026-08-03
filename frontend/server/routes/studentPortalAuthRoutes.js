import express from 'express';
import {
  registerStudent,
  loginStudent,
  forgotStudentPassword,
  getStudentProfile,
  changeStudentPassword
} from '../controllers/studentAuthController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);
router.post('/forgot-password', forgotStudentPassword);
router.put('/change-password', authenticate, authorize(['student']), changeStudentPassword);
router.get('/profile', authenticate, authorize(['student']), getStudentProfile);

export default router;
