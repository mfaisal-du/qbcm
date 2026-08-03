import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from '../server/routes/authRoutes.js';
import questionRoutes from '../server/routes/questionRoutes.js';
import reviewRoutes from '../server/routes/reviewRoutes.js';
import studentAnswerRoutes from '../server/routes/studentAnswerRoutes.js';
import userRoutes from '../server/routes/userRoutes.js';
import academicRoutes from '../server/routes/academicRoutes.js';
import assessmentRoutes from '../server/routes/assessmentRoutes.js';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Serverless API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/student-answers', studentAnswerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/assessments', assessmentRoutes);

app.use((err, req, res, next) => {
  console.error('Function error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;