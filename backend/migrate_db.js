import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
  });

  try {
    console.log('Starting database migration...');

    // Add new columns if they don't exist
    const columns = [
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS cognitiveLevel ENUM('recall', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation', 'clinical_reasoning') DEFAULT 'recall'",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS assessmentType ENUM('formative', 'summative') DEFAULT 'formative'",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS learningOutcome TEXT",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS competencies TEXT",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS weighting DECIMAL(5,2) DEFAULT 0",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS coverage ENUM('course', 'module', 'full_program') DEFAULT 'course'",
      "ALTER TABLE questions ADD COLUMN IF NOT EXISTS courseCode VARCHAR(50)",
      "CREATE INDEX IF NOT EXISTS idx_cognitive ON questions(cognitiveLevel)",
      "CREATE INDEX IF NOT EXISTS idx_assessment ON questions(assessmentType)",
      "CREATE INDEX IF NOT EXISTS idx_coverage ON questions(coverage)"
    ];

    for (const sql of columns) {
      try {
        await pool.execute(sql);
        console.log('✓ ' + sql.substring(0, 50) + '...');
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_KEYNAME') {
          console.error('Error:', err.message);
        }
      }
    }

    console.log('✓ Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
