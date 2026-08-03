import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.student') });

import studentPortalAuthRoutes from './routes/studentPortalAuthRoutes.js';
import studentPortalQuestionRoutes from './routes/studentPortalQuestionRoutes.js';
import studentAnswerRoutes from './routes/studentAnswerRoutes.js';
import studentPortalAcademicRoutes from './routes/studentPortalAcademicRoutes.js';

const app = express();
const PORT = process.env.STUDENT_BACKEND_PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.STUDENT_CORS_ORIGIN || 'http://localhost:5174'
}));

app.get('/health', (req, res) => {
  res.json({ message: 'Student server is running', timestamp: new Date() });
});

// Dedicated student API surface only
app.use('/api/auth', studentPortalAuthRoutes);
app.use('/api/questions', studentPortalQuestionRoutes);
app.use('/api/student-answers', studentAnswerRoutes);
app.use('/api/academic', studentPortalAcademicRoutes);

app.use((err, req, res, next) => {
  console.error('Student server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found on student server' });
});

app.listen(PORT, () => {
  console.log(`\n🎓 Student backend running on http://localhost:${PORT}`);
  console.log('🛡️ Exposed routes: /api/auth, /api/questions/practice/list, /api/student-answers, /api/academic\n');
});

export default app;
