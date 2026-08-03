import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PLAN_OF_STUDY = [
  // Year 1, Semester 1 - Basic Phase
  { courseCode: 'ENGL 101', name: 'Basic Academic English', year: 1, semester: 1, phase: 'Basic' },
  { courseCode: 'ARAB 101', name: 'Academic Writing in Arabic', year: 1, semester: 1, phase: 'Basic' },
  { courseCode: 'ENTR 200', name: 'Entrepreneurship: Innovation & Creativity', year: 1, semester: 1, phase: 'Basic' },
  { courseCode: 'SOCS 102', name: 'Omani Society', year: 1, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 101', name: 'English for Medicine', year: 1, semester: 1, phase: 'Basic' },

  // Year 1, Semester 2 - Basic Phase
  { courseCode: 'MEDI 121', name: 'Cell Biology', year: 1, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 122', name: 'Human Body Structure I', year: 1, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 123', name: 'Human Physiology I', year: 1, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 124', name: 'Biochemical Basis of Body Functions', year: 1, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 125', name: 'Behavioral & Social Sciences', year: 1, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 126', name: 'Medical Informatics', year: 1, semester: 2, phase: 'Basic' },

  // Year 2, Semester 1 - Basic/Integrated Phase
  { courseCode: 'MEDI 211', name: 'Human Physiology II', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 212', name: 'Basics of Medical Genetics', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 213', name: 'Principles of Medical Microbiology & Immunology', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 214', name: 'Introduction to Pharmacology', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 215', name: 'Human Body Structure II', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 216', name: 'General Pathology', year: 2, semester: 1, phase: 'Basic' },
  { courseCode: 'MEDI 217', name: 'Early Clinical Exposure & Body Systems Integration I', year: 2, semester: 1, phase: 'Integrated' },

  // Year 2, Semester 2 - Integrated/Basic Phase
  { courseCode: 'MEDI 221', name: 'Hematopoietic & Immune System', year: 2, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 222', name: 'Community & Global Health', year: 2, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 223', name: 'Research in Health & Biostatistics', year: 2, semester: 2, phase: 'Basic' },
  { courseCode: 'MEDI 224', name: 'Respiratory System', year: 2, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 225', name: 'Cardiovascular System', year: 2, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 227', name: 'Early Clinical Exposure & Body Systems Integration I', year: 2, semester: 2, phase: 'Integrated' },

  // Year 3, Semester 1 - Integrated Phase
  { courseCode: 'MEDI 311', name: 'Locomotor System', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 312', name: 'Clinical Nutrition', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 313', name: 'Alimentary System', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 314', name: 'Urogenital System', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 315', name: 'Research Project I', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 316', name: 'Emerging Medical Technologies', year: 3, semester: 1, phase: 'Integrated' },
  { courseCode: 'MEDI 317', name: 'Early Clinical Exposure & Body Systems Integration II', year: 3, semester: 1, phase: 'Integrated' },

  // Year 3, Semester 2 - Integrated Phase
  { courseCode: 'MEDI 321', name: 'Endocrine System', year: 3, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 322', name: 'Human Nervous System', year: 3, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 323', name: 'Special Senses', year: 3, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 324', name: 'Research Project II', year: 3, semester: 2, phase: 'Integrated' },
  { courseCode: 'MEDI 325', name: 'Early Clinical Exposure & Body Systems Integration II', year: 3, semester: 2, phase: 'Integrated' },

  // Year 4, Semester 1 - Clinical Phase
  { courseCode: 'CLIN 411', name: 'Medical Ethics & Professionalism', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 412', name: 'Patient Support & Safety', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 413', name: 'Medical Imaging & Radiology', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 414', name: 'Evidence-Based Medicine', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 415', name: 'Interpretation of Laboratory Data', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 416', name: 'Clinical Psychology', year: 4, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 417', name: 'Communication Skills', year: 4, semester: 1, phase: 'Clinical' },

  // Year 4, Semester 2 - Clinical Phase
  { courseCode: 'CLIN 421', name: 'Child Health Skills & Procedures', year: 4, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 422', name: 'Surgical Skills & Procedures', year: 4, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 423', name: 'Medical Skills & Procedures', year: 4, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 424', name: 'Obs/Gyn Skills & Procedures', year: 4, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 425', name: 'Mental Health I', year: 4, semester: 2, phase: 'Clinical' },

  // Year 5 - Clinical Phase (no specific semester)
  { courseCode: 'CLIN 501', name: 'Medicine Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 502', name: 'Child Health Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 503', name: 'Surgery Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 504', name: 'Obs/Gyn Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 505', name: 'Community & Primary Care I JC', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 506', name: 'Anesthesia Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 507', name: 'Radiology Junior Clerkship', year: 5, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 508', name: 'ENT Junior Clerkship', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 509', name: 'Dermatology Junior Clerkship', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 510', name: 'Oral Health Junior Clerkship', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 511', name: 'Community & Primary Care II JC', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 512', name: 'Emergency Medicine', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 513', name: 'Elective Junior Clerkship', year: 5, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 514', name: 'SLT (Forensic & NGO Encounters)', year: 5, semester: 2, phase: 'Clinical' },

  // Year 6 - Clinical Phase (no specific semester)
  { courseCode: 'CLIN 601', name: 'Medicine Senior Clerkship', year: 6, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 602', name: 'Elective II Senior Clerkship', year: 6, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 603', name: 'Child Health Senior Clerkship', year: 6, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 604', name: 'Hematology Senior Clerkship', year: 6, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 605', name: 'Community & Primary Care III SC', year: 6, semester: 1, phase: 'Clinical' },
  { courseCode: 'CLIN 606', name: 'Mental Health II SC', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 607', name: 'Surgery Senior Clerkship', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 608', name: 'Orthopedic Senior Clerkship', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 609', name: 'Obs/Gyn Senior Clerkship', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 610', name: 'Ophthalmology Senior Clerkship', year: 6, semester: 2, phase: 'Clinical' },

  // Pre-Internship (Year 6+)
  { courseCode: 'CLIN 621', name: 'Pre-Internship: Medicine', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 622', name: 'Pre-Internship: Surgery', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 623', name: 'Pre-Internship: Child Health', year: 6, semester: 2, phase: 'Clinical' },
  { courseCode: 'CLIN 624', name: 'Pre-Internship: Obs/Gyn & Primary Care', year: 6, semester: 2, phase: 'Clinical' },
];

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'com_question_bank',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  try {
    // 1. Add courseCode and phase columns to subjects table
    console.log('--- Step 1: Adding courseCode and phase to subjects table ---');
    try {
      await connection.execute('ALTER TABLE subjects ADD COLUMN courseCode VARCHAR(20) AFTER name');
      console.log('  Added courseCode column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  courseCode column already exists');
      else throw e;
    }
    try {
      await connection.execute("ALTER TABLE subjects ADD COLUMN phase ENUM('Basic','Integrated','Clinical') DEFAULT 'Basic' AFTER semester");
      console.log('  Added phase column');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  phase column already exists');
      else throw e;
    }

    // 2. Add phase column to questions table  
    console.log('--- Step 2: Adding phase to questions table ---');
    try {
      await connection.execute("ALTER TABLE questions ADD COLUMN phase ENUM('Basic','Integrated','Clinical') DEFAULT NULL AFTER courseCode");
      console.log('  Added phase column to questions');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  phase column already exists in questions');
      else throw e;
    }

    // 3. Ensure academic_years table exists and is populated
    console.log('--- Step 3: Ensuring academic_years exist ---');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id INT PRIMARY KEY AUTO_INCREMENT,
        yearNumber INT UNIQUE NOT NULL,
        label VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);
    for (let y = 1; y <= 6; y++) {
      await connection.execute(
        'INSERT IGNORE INTO academic_years (yearNumber, label) VALUES (?, ?)',
        [y, `Year ${y}`]
      );
    }
    console.log('  Academic years (1-6) present');

    // 4. Ensure subjects table exists with new columns
    console.log('--- Step 4: Ensuring subjects table exists ---');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        courseCode VARCHAR(20),
        yearNumber INT NOT NULL,
        semester INT NOT NULL,
        phase ENUM('Basic','Integrated','Clinical') DEFAULT 'Basic',
        description TEXT,
        UNIQUE KEY unique_course (courseCode)
      )
    `);

    // 5. Ensure topics table exists
    console.log('--- Step 5: Ensuring topics table exists ---');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        subjectId INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 6. Clear existing subjects and seed with Plan of Study data
    console.log('--- Step 6: Seeding Plan of Study subjects ---');
    // Delete old topics and subjects
    await connection.execute('DELETE FROM topics');
    await connection.execute('DELETE FROM subjects');
    console.log('  Cleared old subjects and topics');

    let inserted = 0;
    for (const course of PLAN_OF_STUDY) {
      await connection.execute(
        'INSERT INTO subjects (name, courseCode, yearNumber, semester, phase, description) VALUES (?, ?, ?, ?, ?, ?)',
        [course.name, course.courseCode, course.year, course.semester, course.phase, `${course.courseCode} - ${course.name}`]
      );
      inserted++;
    }
    console.log(`  Inserted ${inserted} courses from Plan of Study`);

    // 7. Verify
    const [counts] = await connection.execute(
      "SELECT phase, COUNT(*) as cnt FROM subjects GROUP BY phase ORDER BY phase"
    );
    console.log('\n=== Final Subject Distribution ===');
    counts.forEach(r => console.log(`  ${r.phase}: ${r.cnt} courses`));

    const [yearCounts] = await connection.execute(
      "SELECT yearNumber, COUNT(*) as cnt FROM subjects GROUP BY yearNumber ORDER BY yearNumber"
    );
    console.log('\n=== By Year ===');
    yearCounts.forEach(r => console.log(`  Year ${r.yearNumber}: ${r.cnt} courses`));

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate();
