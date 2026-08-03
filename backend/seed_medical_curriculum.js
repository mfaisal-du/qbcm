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
      name VARCHAR(255) NOT NULL,
      courseCode VARCHAR(20),
      yearNumber INT NOT NULL,
      semester INT NOT NULL DEFAULT 1,
      phase ENUM('Basic', 'Integrated', 'Clinical') DEFAULT 'Basic',
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_subject_year (yearNumber),
      INDEX idx_subject_phase (phase)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS topics (
      id INT PRIMARY KEY AUTO_INCREMENT,
      subjectId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
      INDEX idx_subject (subjectId)
    )
  `);

  const years = [
    [1, 'Year 1', 'Foundation year'],
    [2, 'Year 2', 'Basic medical sciences year 1'],
    [3, 'Year 3', 'Basic medical sciences year 2'],
    [4, 'Year 4', 'Clinical skills year'],
    [5, 'Year 5', 'Clinical clerkship year 1'],
    [6, 'Year 6', 'Clinical clerkship year 2'],
    [7, 'Pre-Internship', 'Pre-internship training'],
  ];

  for (const [yearNumber, label, description] of years) {
    await pool.execute(
      'INSERT IGNORE INTO academic_years (yearNumber, label, description) VALUES (?, ?, ?)',
      [yearNumber, label, description]
    );
  }

  const subjects = [
    ['ENGL 101', 'Basic Academic English', 1, 1, 'Basic'],
    ['ARAB 101', 'Academic Writing in Arabic', 1, 1, 'Basic'],
    ['ENTR 200', 'Entrepreneurship: Innovation and Creativity', 1, 1, 'Basic'],
    ['SOCS 102', 'Omani Society', 1, 1, 'Basic'],
    ['MEDI 101', 'English for Medicine', 1, 1, 'Basic'],

    ['MEDI 121', 'Cell Biology', 1, 2, 'Basic'],
    ['MEDI 122', 'Human Body Structure I', 1, 2, 'Basic'],
    ['MEDI 123', 'Human Physiology I', 1, 2, 'Basic'],
    ['MEDI 124', 'Biochemical Basis of Body Functions', 1, 2, 'Basic'],
    ['MEDI 125', 'Behavioral & Social Sciences', 1, 2, 'Basic'],
    ['MEDI 126', 'Medical Informatics', 1, 2, 'Basic'],

    ['MEDI 211', 'Human Physiology II', 2, 1, 'Basic'],
    ['MEDI 212', 'Basics of Medical Genetics', 2, 1, 'Basic'],
    ['MEDI 213', 'Principles of Medical Microbiology and Immunology', 2, 1, 'Basic'],
    ['MEDI 214', 'Introduction to Pharmacology', 2, 1, 'Basic'],
    ['MEDI 215', 'Human Body Structure II', 2, 1, 'Basic'],
    ['MEDI 216', 'General Pathology', 2, 1, 'Basic'],
    ['MEDI 217', 'Early Clinical Exposure and Body Systems Integration I', 2, 1, 'Integrated'],

    ['MEDI 221', 'Hematopoietic & Immune System', 2, 2, 'Integrated'],
    ['MEDI 222', 'Community and Global Health', 2, 2, 'Integrated'],
    ['MEDI 223', 'Research in Health and Biostatistics', 2, 2, 'Basic'],
    ['MEDI 224', 'Respiratory System', 2, 2, 'Integrated'],
    ['MEDI 225', 'Cardiovascular System', 2, 2, 'Integrated'],
    ['MEDI 217', 'Early Clinical Exposure and Body Systems Integration I', 2, 2, 'Integrated'],

    ['MEDI 311', 'Locomotor System', 3, 1, 'Integrated'],
    ['MEDI 312', 'Clinical Nutrition', 3, 1, 'Basic'],
    ['MEDI 313', 'Alimentary System', 3, 1, 'Integrated'],
    ['MEDI 314', 'Urogenital System', 3, 1, 'Integrated'],
    ['MEDI 315', 'Research Project I', 3, 1, 'Basic'],
    ['MEDI 316', 'Emerging Medical Technologies', 3, 1, 'Basic'],
    ['MEDI 317', 'Early Clinical Exposure and Body Systems Integration II', 3, 1, 'Integrated'],

    ['MEDI 321', 'Endocrine System', 3, 2, 'Integrated'],
    ['MEDI 322', 'Human Nervous System', 3, 2, 'Integrated'],
    ['MEDI 323', 'Special Senses', 3, 2, 'Integrated'],
    ['MEDI 324', 'Research Project II', 3, 2, 'Basic'],
    ['MEDI 317', 'Early Clinical Exposure and Body Systems Integration II', 3, 2, 'Integrated'],

    ['CLIN 411', 'Medical Ethics and Professionalism', 4, 1, 'Clinical'],
    ['CLIN 412', 'Patient Support and Safety', 4, 1, 'Clinical'],
    ['CLIN 413', 'Medical Imaging and Radiology', 4, 1, 'Clinical'],
    ['CLIN 414', 'Evidence Based Medicine', 4, 1, 'Clinical'],
    ['CLIN 415', 'Interpretation of Laboratory Data', 4, 1, 'Clinical'],
    ['CLIN 416', 'Clinical Psychology', 4, 1, 'Clinical'],
    ['CLIN 417', 'Communication Skills', 4, 1, 'Clinical'],

    ['CLIN 421', 'Child Health Skills and Procedures', 4, 2, 'Clinical'],
    ['CLIN 422', 'Surgical Skills and Procedures', 4, 2, 'Clinical'],
    ['CLIN 423', 'Medical Skills and Procedures', 4, 2, 'Clinical'],
    ['CLIN 424', 'Obs/Gyn Skills and Procedures', 4, 2, 'Clinical'],
    ['CLIN 425', 'Mental Health I', 4, 2, 'Clinical'],

    ['CLIN 501', 'Medicine I', 5, 1, 'Clinical'],
    ['CLIN 502', 'Child Health I', 5, 1, 'Clinical'],
    ['CLIN 503', 'Surgery I', 5, 1, 'Clinical'],
    ['CLIN 504', 'Obs/Gyn I', 5, 1, 'Clinical'],
    ['CLIN 505', 'Community and Primary Care I', 5, 1, 'Clinical'],
    ['CLIN 506', 'Anesthesia', 5, 1, 'Clinical'],
    ['CLIN 507', 'Radiology', 5, 1, 'Clinical'],
    ['CLIN 508', 'ENT', 5, 1, 'Clinical'],
    ['CLIN 509', 'Dermatology', 5, 1, 'Clinical'],
    ['CLIN 510', 'Oral Health', 5, 1, 'Clinical'],
    ['CLIN 511', 'Community and Primary Care II', 5, 2, 'Clinical'],
    ['CLIN 512', 'Emergency Medicine', 5, 2, 'Clinical'],
    ['CLIN 513', 'Clinical Selective', 5, 2, 'Clinical'],
    ['CLIN 514', 'SLT (Forensic Medicine, Social Encounters with NGOs)', 5, 2, 'Clinical'],

    ['CLIN 601', 'Medicine II', 6, 1, 'Clinical'],
    ['CLIN 602', 'Clinical Elective', 6, 1, 'Clinical'],
    ['CLIN 603', 'Child Health II', 6, 1, 'Clinical'],
    ['CLIN 604', 'Hematology', 6, 1, 'Clinical'],
    ['CLIN 605', 'Community and Primary Care III', 6, 1, 'Clinical'],
    ['CLIN 606', 'Mental Health II', 6, 1, 'Clinical'],
    ['CLIN 607', 'Surgery II', 6, 1, 'Clinical'],
    ['CLIN 608', 'Orthopedic', 6, 1, 'Clinical'],
    ['CLIN 609', 'Obs/Gyn II', 6, 1, 'Clinical'],
    ['CLIN 610', 'Ophthalmology', 6, 1, 'Clinical'],

    ['CLIN 621', 'Medicine', 7, 1, 'Clinical'],
    ['CLIN 622', 'Surgery', 7, 1, 'Clinical'],
    ['CLIN 623', 'Child Health', 7, 1, 'Clinical'],
    ['CLIN 624', "Obs/Gyn and Primary Care", 7, 1, 'Clinical'],
  ];

  const insertedSubjects = [];
  for (const [courseCode, name, yearNumber, semester, phase] of subjects) {
    await pool.execute(
      'INSERT IGNORE INTO subjects (name, courseCode, yearNumber, semester, phase) VALUES (?, ?, ?, ?, ?)',
      [name, courseCode, yearNumber, semester, phase]
    );
    insertedSubjects.push({ courseCode, name, yearNumber, semester, phase });
  }

  const [subRows] = await pool.execute('SELECT id, name, courseCode FROM subjects');
  const subMap = Object.fromEntries(subRows.map(s => [s.name, { id: s.id, code: s.courseCode }]));

  console.log('Academic years inserted:');
  const [yRows] = await pool.execute('SELECT * FROM academic_years ORDER BY yearNumber ASC');
  console.table(yRows);

  console.log(`\nSubjects inserted: ${subRows.length}`);
  console.table(subRows.map(s => ({ id: s.id, code: s.courseCode, name: s.name, year: s.yearNumber, semester: s.semester, phase: s.phase })));

  console.log('\nDone! Full medical curriculum structure seeded successfully.');
  await pool.end();
}

run().catch(console.error);
