import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  try {
    console.log('Creating question_usage table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS question_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        questionId INT NOT NULL,
        assessmentType ENUM('quiz', 'midterm', 'endcourse') NOT NULL,
        academicYear INT NOT NULL,
        semester INT NOT NULL,
        notes TEXT,
        addedBy INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (addedBy) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_questionId (questionId),
        INDEX idx_assessmentType (assessmentType),
        INDEX idx_academicYear (academicYear),
        INDEX idx_semester (semester)
      )
    `);
    console.log('question_usage table created successfully.');

    // Verify
    const [rows] = await connection.execute('DESCRIBE question_usage');
    console.log('Table columns:', rows.map(r => r.Field).join(', '));
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
  }
}

migrate();
