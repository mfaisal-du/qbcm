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

(async () => {
  try {
    const [users] = await pool.execute(
      "SELECT id, firstName, lastName, email, password FROM users WHERE role = 'faculty'"
    );
    console.log('Faculty users in database:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}`);
    });
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
