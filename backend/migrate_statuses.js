// Migration: Update question statuses from old system to new system
// Old: pending, approved, rejected
// New: draft, vetted, active, used, rejected, archived
//
// Mapping:
//   pending  -> draft
//   approved -> active
//   rejected -> rejected (unchanged)
//
// Also adds usageCount column to questions table

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank'
  });

  console.log('Connected to database. Starting migration...');

  try {
    // 1. Add usageCount column if not exists
    const [cols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'usageCount'`,
      [process.env.DB_NAME || 'com_question_bank']
    );
    if (cols.length === 0) {
      await connection.execute(`ALTER TABLE questions ADD COLUMN usageCount INT DEFAULT 0 AFTER createdBy`);
      console.log('Added usageCount column');
    } else {
      console.log('usageCount column already exists');
    }

    // 2. Migrate existing data BEFORE altering ENUM (to avoid empty string issue)
    const [r1] = await connection.execute(`UPDATE questions SET status = 'draft' WHERE status = 'pending'`);
    console.log(`Migrated ${r1.affectedRows} pending -> draft`);

    const [r2] = await connection.execute(`UPDATE questions SET status = 'active' WHERE status = 'approved'`);
    console.log(`Migrated ${r2.affectedRows} approved -> active`);

    // rejected stays rejected - no change needed

    // 3. Now safely alter the ENUM (all values are already valid)
    await connection.execute(
      `ALTER TABLE questions MODIFY COLUMN status ENUM('draft', 'vetted', 'active', 'used', 'rejected', 'archived') DEFAULT 'draft'`
    );
    console.log('Updated questions.status ENUM');

    // 4. Fix any empty-string statuses (safety net)
    const [r0] = await connection.execute(`UPDATE questions SET status = 'active' WHERE status = '' OR status IS NULL`);
    if (r0.affectedRows > 0) console.log(`Fixed ${r0.affectedRows} empty-status questions -> active`);

    // 5. Update usageCount from student_answers
    await connection.execute(`
      UPDATE questions q
      SET q.usageCount = (SELECT COUNT(*) FROM student_answers sa WHERE sa.questionId = q.id)
    `);
    console.log('Updated usageCount from student_answers');

    // 6. Mark questions with high usage as 'used'
    const [r3] = await connection.execute(`UPDATE questions SET status = 'used' WHERE status = 'active' AND usageCount > 0`);
    console.log(`Marked ${r3.affectedRows} active questions with usage as 'used'`);

    // 7. Update reviews table ENUM (remove 'pending', keep approved/rejected)
    await connection.execute(
      `ALTER TABLE reviews MODIFY COLUMN status ENUM('approved', 'rejected') DEFAULT 'approved'`
    );
    console.log('Updated reviews.status ENUM');

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
  }
};

run();
