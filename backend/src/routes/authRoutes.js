import express from 'express';
import { register, login, getProfile, forgotPassword, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/change-password', authenticate, changePassword);
router.get('/profile', authenticate, getProfile);

export default router;
