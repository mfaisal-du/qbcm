import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id INT PRIMARY KEY AUTO_INCREMENT,
      yearNumber INT NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      yearNumber INT NOT NULL,
      semester INT NOT NULL DEFAULT 1,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_year_sem (yearNumber, semester)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS topics (
      id INT PRIMARY KEY AUTO_INCREMENT,
      subjectId INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
      INDEX idx_subject (subjectId)
    )
  `);

  for (let y = 1; y <= 6; y++) {
    await pool.execute('INSERT IGNORE INTO academic_years (yearNumber, label) VALUES (?, ?)', [y, 'Year ' + y]);
  }

  const subs = [
    ['Anatomy', 1, 1, 'Study of body structure'],
    ['Physiology', 1, 1, 'Study of body functions'],
    ['Biochemistry', 1, 2, 'Chemical processes in living organisms'],
    ['Pathology', 2, 1, 'Study of disease'],
    ['Pharmacology', 2, 2, 'Study of drugs'],
    ['Medicine', 3, 1, 'Clinical medicine'],
    ['Surgery', 3, 2, 'Surgical principles'],
    ['Microbiology', 2, 1, 'Study of microorganisms']
  ];
  for (const [name, yearNumber, semester, description] of subs) {
    await pool.execute(
      'INSERT IGNORE INTO subjects (name, yearNumber, semester, description) VALUES (?,?,?,?)',
      [name, yearNumber, semester, description]
    );
  }

  const [subRows] = await pool.execute('SELECT id, name FROM subjects');
  const subMap = Object.fromEntries(subRows.map(s => [s.name, s.id]));

  const topicData = [
    [subMap['Anatomy'], 'Upper Limb'],
    [subMap['Anatomy'], 'Lower Limb'],
    [subMap['Anatomy'], 'Head & Neck'],
    [subMap['Physiology'], 'Cardiovascular System'],
    [subMap['Physiology'], 'Respiratory System'],
    [subMap['Pathology'], 'Cell Injury'],
    [subMap['Pathology'], 'Inflammation'],
    [subMap['Pharmacology'], 'Antibiotics'],
    [subMap['Medicine'], 'Cardiology'],
    [subMap['Surgery'], 'General Surgery Principles']
  ];
  for (const [subjectId, name] of topicData) {
    if (subjectId) {
      await pool.execute('INSERT IGNORE INTO topics (subjectId, name) VALUES (?,?)', [subjectId, name]);
    }
  }

  console.log('Done! Academic structure created.');
  await pool.end();
}

run().catch(console.error);
