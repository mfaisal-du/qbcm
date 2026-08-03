import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Import routes
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import studentAnswerRoutes from './routes/studentAnswerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/student-answers', studentAnswerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/assessments', assessmentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Auto-seed default users if missing
async function seedDefaultUsers() {
  try {
    const [rows] = await pool.execute('SELECT email, role FROM users WHERE email IN (?, ?, ?, ?)', [
      'admin@comqb.local', 'faculty@comqb.local', 'student@comqb.local', 'reviewer@comqb.local'
    ]);
    const existing = new Set((rows || []).map(r => r.email));
    const hashed = {
      admin: '$2a$10$nCmB/FR8eQS9bha0zepfUebS0URH3s1aHiUndfEJ0OniaFvrpMtnu',
      faculty: '$2a$10$QAAGjkKIzzmeoI.yiPAAleatxlVI//flPdpOriGi5DIXsaoEAQqFG',
      student: '$2a$10$co0klfTBZIhziB2Q18NmvetoBJ3Kz6Y5rXrgqsqds/WtgLm7ObRYu',
      reviewer: '$2a$10$ywLdRqpoG4Itxek5CtqB8ef3IJ8yn2jkO83Oi0Jjbgl2T95MOqfWy'
    };
    const inserts = [];
    const params = [];
    if (!existing.has('admin@comqb.local')) {
      inserts.push("('Admin', 'User', 'admin@comqb.local', ?, 'super_admin', 1)");
      params.push(hashed.admin);
    }
    if (!existing.has('faculty@comqb.local')) {
      inserts.push("('Faculty', 'User', 'faculty@comqb.local', ?, 'faculty', 1)");
      params.push(hashed.faculty);
    }
    if (!existing.has('student@comqb.local')) {
      inserts.push("('Student', 'User', 'student@comqb.local', ?, 'student', 1)");
      params.push(hashed.student);
    }
    if (!existing.has('reviewer@comqb.local')) {
      inserts.push("('Reviewer', 'User', 'reviewer@comqb.local', ?, 'reviewer', 1)");
      params.push(hashed.reviewer);
    }
    if (inserts.length) {
      await pool.execute(`INSERT INTO users (firstName, lastName, email, password, role, isApproved) VALUES ${inserts.join(', ')}`, params);
      console.log(`🌱 Seeded ${inserts.length} default user(s)`);
    }
  } catch (e) {
    console.error('Seed error:', e.message);
  }
}

app.listen(PORT, async () => {
  await seedDefaultUsers();
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   Auth: POST /api/auth/register, POST /api/auth/login`);
  console.log(`   Questions: GET/POST/PUT/DELETE /api/questions`);
  console.log(`   Reviews: GET/POST/PUT /api/reviews`);
  console.log(`   Student Answers: POST/GET /api/student-answers\n`);
});

export default app;
