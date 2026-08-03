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
    const [before] = await connection.execute(
      'SELECT status, COUNT(*) AS total FROM questions GROUP BY status ORDER BY status'
    );
    console.log('BEFORE:', before);

    await connection.execute("UPDATE questions SET status = 'draft' WHERE status = 'pending'");
    await connection.execute("UPDATE questions SET status = 'active' WHERE status = 'approved'");
    await connection.execute("UPDATE questions SET status = 'rejected' WHERE status = 'reject'");
    await connection.execute("UPDATE questions SET status = 'archived' WHERE status = 'archive'");

    const [users] = await connection.execute('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    if (!users.length) {
      throw new Error('No users found. Cannot insert test questions without createdBy user.');
    }
    const createdBy = users[0].id;

    for (const status of requiredStatuses) {
      const [rows] = await connection.execute('SELECT COUNT(*) AS c FROM questions WHERE status = ?', [status]);
      const count = Number(rows[0].c || 0);

      if (count === 0) {
        for (let i = 1; i <= 2; i += 1) {
          const questionText = `[TEST ${status.toUpperCase()}] Sample question ${i} generated on ${new Date().toISOString()}`;
          const options = JSON.stringify(['A', 'B', 'C', 'D']);
          const explanation = 'Auto-generated for status coverage testing.';

          await connection.execute(
            `INSERT INTO questions
              (questionText, questionType, subject, topic, year, semester, difficulty, options, correctAnswer, explanation, createdBy, status, createdAt, updatedAt)
             VALUES (?, 'multiple_choice', 'Testing Subject', 'Status Migration', 2026, 1, 'easy', ?, 'A', ?, ?, ?, NOW(), NOW())`,
            [questionText, options, explanation, createdBy, status]
          );
        }

        console.log(`INSERTED_TEST_QUESTIONS ${status}: 2`);
      }
    }

    const [after] = await connection.execute(
      'SELECT status, COUNT(*) AS total FROM questions GROUP BY status ORDER BY status'
    );
    console.log('AFTER:', after);

    console.log('Status normalization and seeding complete.');
  } catch (error) {
    console.error('Normalization/seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

run();
