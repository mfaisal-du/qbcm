import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import studentPortalAuthRoutes from '../server/routes/studentPortalAuthRoutes.js';
import studentPortalQuestionRoutes from '../server/routes/studentPortalQuestionRoutes.js';
import studentAnswerRoutes from '../server/routes/studentAnswerRoutes.js';
import studentPortalAcademicRoutes from '../server/routes/studentPortalAcademicRoutes.js';
import studentPortalAssessmentRoutes from '../server/routes/studentPortalAssessmentRoutes.js';

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
  res.json({ message: 'Student serverless API is running', timestamp: new Date() });
});

app.use('/api/auth', studentPortalAuthRoutes);
app.use('/api/questions', studentPortalQuestionRoutes);
app.use('/api/student-answers', studentAnswerRoutes);
app.use('/api/academic', studentPortalAcademicRoutes);
app.use('/api/assessments', studentPortalAssessmentRoutes);

app.use((err, req, res, next) => {
  console.error('Function error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found on student server' });
});

export default app;