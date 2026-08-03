import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'com_question_bank',
  port: parseInt(process.env.DB_PORT) || 3306
});

const MEDICAL_SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Pathology',
  'Microbiology', 'Forensic Medicine', 'Community Medicine', 'Internal Medicine',
  'Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Radiology',
  'Dermatology', 'Psychiatry', 'Orthopedics'
];

(async () => {
  try {
    for (const name of MEDICAL_SUBJECTS) {
      const [r] = await pool.execute(
        'INSERT IGNORE INTO subjects (name, courseCode, yearNumber, semester, phase, description) VALUES (?, ?, ?, ?, ?, ?)',
        [name, name.substring(0, 4).toUpperCase(), 1, 1, 'Basic', 'Medical College Subject']
      );
      if (r.affectedRows) console.log('Created subject:', name);
    }
    console.log('Medical subjects seeding complete');
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
