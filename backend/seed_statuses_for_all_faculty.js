import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const requiredStatuses = ['draft', 'active', 'used', 'rejected', 'vetted', 'archived'];

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank'
  });

  try {
    const [facultyUsers] = await connection.execute(
      "SELECT id, firstName, lastName, email FROM users WHERE role = 'faculty' ORDER BY id"
    );

    if (!facultyUsers.length) {
      console.log('No faculty users found. Nothing to seed.');
      return;
    }

    for (const faculty of facultyUsers) {
      for (const status of requiredStatuses) {
        const [rows] = await connection.execute(
          'SELECT COUNT(*) AS c FROM questions WHERE createdBy = ? AND status = ?',
          [faculty.id, status]
        );

        const count = Number(rows[0].c || 0);

        if (count === 0) {
          const questionText = `[TEST ${status.toUpperCase()}][FACULTY ${faculty.id}] Seeded for status coverage ${new Date().toISOString()}`;
          const options = JSON.stringify(['A', 'B', 'C', 'D']);

          await connection.execute(
            `INSERT INTO questions
              (questionText, questionType, subject, topic, year, semester, difficulty, options, correctAnswer, explanation, createdBy, status, createdAt, updatedAt)
             VALUES (?, 'multiple_choice', 'Testing Subject', 'Faculty Status Coverage', 2026, 1, 'easy', ?, 'A', ?, ?, ?, NOW(), NOW())`,
            [
              questionText,
              options,
              'Auto-generated for faculty status coverage testing.',
              faculty.id,
              status
            ]
          );

          console.log(`Inserted 1 ${status} question for faculty ${faculty.id} (${faculty.email})`);
        }
      }
    }

    const [coverage] = await connection.execute(
      `SELECT u.id, u.email, q.status, COUNT(*) AS total
       FROM users u
       LEFT JOIN questions q ON q.createdBy = u.id
       WHERE u.role = 'faculty'
       GROUP BY u.id, u.email, q.status
       ORDER BY u.id, q.status`
    );

    console.log('FACULTY_STATUS_COVERAGE', coverage);
    console.log('Faculty status seeding complete.');
  } catch (error) {
    console.error('Faculty status seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

run();
