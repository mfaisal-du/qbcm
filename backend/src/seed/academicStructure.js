import pool from '../config/database.js';

const academicData = [
  // Year 1 – Semester 1 (Fall)
  { yearNumber: 1, semester: 1, phase: 'Basic', subject: 'Basic Academic English', courseCode: 'ENGL 101' },
  { yearNumber: 1, semester: 1, phase: 'Basic', subject: 'Academic Writing in Arabic', courseCode: 'ARAB 101' },
  { yearNumber: 1, semester: 1, phase: 'Basic', subject: 'Entrepreneurship: Innovation and Creativity', courseCode: 'ENTR 200' },
  { yearNumber: 1, semester: 1, phase: 'Basic', subject: 'Omani Society', courseCode: 'SOCS 102' },
  { yearNumber: 1, semester: 1, phase: 'Basic', subject: 'English for Medicine', courseCode: 'MEDI 101' },

  // Year 1 – Semester 2 (Spring)
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Cell Biology', courseCode: 'MEDI 121' },
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Human Body Structure I', courseCode: 'MEDI 122' },
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Human Physiology I', courseCode: 'MEDI 123' },
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Biochemical Basis of Body Functions', courseCode: 'MEDI 124' },
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Behavioral & Social Sciences', courseCode: 'MEDI 125' },
  { yearNumber: 1, semester: 2, phase: 'Basic', subject: 'Medical Informatics', courseCode: 'MEDI 126' },

  // Year 2 – Semester 1 (Fall)
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Human Physiology II', courseCode: 'MEDI 211' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Basics of Medical Genetics', courseCode: 'MEDI 212' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Principles of Medical Microbiology and Immunology', courseCode: 'MEDI 213' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Introduction to Pharmacology', courseCode: 'MEDI 214' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Human Body Structure II', courseCode: 'MEDI 215' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'General Pathology', courseCode: 'MEDI 216' },
  { yearNumber: 2, semester: 1, phase: 'Basic', subject: 'Early Clinical Exposure and Body Systems Integration I', courseCode: 'MEDI 217' },

  // Year 2 – Semester 2 (Spring)
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Hematopoietic & Immune System', courseCode: 'MEDI 221' },
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Community and Global Health', courseCode: 'MEDI 222' },
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Research in Health and Biostatistics', courseCode: 'MEDI 223' },
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Respiratory System', courseCode: 'MEDI 224' },
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Cardiovascular System', courseCode: 'MEDI 225' },
  { yearNumber: 2, semester: 2, phase: 'Basic', subject: 'Early Clinical Exposure and Body Systems Integration I', courseCode: 'MEDI 217' },

  // Year 3 – Semester 1 (Fall)
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Locomotor System', courseCode: 'MEDI 311' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Clinical Nutrition', courseCode: 'MEDI 312' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Alimentary System', courseCode: 'MEDI 313' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Urogenital System', courseCode: 'MEDI 314' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Research Project I', courseCode: 'MEDI 315' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Emerging Medical Technologies', courseCode: 'MEDI 316' },
  { yearNumber: 3, semester: 1, phase: 'Integrated', subject: 'Early Clinical Exposure and Body Systems Integration II', courseCode: 'MEDI 317' },

  // Year 3 – Semester 2 (Spring)
  { yearNumber: 3, semester: 2, phase: 'Integrated', subject: 'Endocrine System', courseCode: 'MEDI 321' },
  { yearNumber: 3, semester: 2, phase: 'Integrated', subject: 'Human Nervous System', courseCode: 'MEDI 322' },
  { yearNumber: 3, semester: 2, phase: 'Integrated', subject: 'Special Senses', courseCode: 'MEDI 323' },
  { yearNumber: 3, semester: 2, phase: 'Integrated', subject: 'Research Project II', courseCode: 'MEDI 324' },
  { yearNumber: 3, semester: 2, phase: 'Integrated', subject: 'Early Clinical Exposure and Body Systems Integration II', courseCode: 'MEDI 317' },

  // Year 4 – Semester 1 (Fall)
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Medical Ethics and Professionalism', courseCode: 'CLIN 411' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Patient Support and Safety', courseCode: 'CLIN 412' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Medical Imaging and Radiology', courseCode: 'CLIN 413' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Evidence Based Medicine', courseCode: 'CLIN 414' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Interpretation of Laboratory Data', courseCode: 'CLIN 415' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Clinical Psychology', courseCode: 'CLIN 416' },
  { yearNumber: 4, semester: 1, phase: 'Integrated', subject: 'Communication Skills', courseCode: 'CLIN 417' },

  // Year 4 – Semester 2 (Spring)
  { yearNumber: 4, semester: 2, phase: 'Integrated', subject: 'Child Health Skills and Procedures', courseCode: 'CLIN 421' },
  { yearNumber: 4, semester: 2, phase: 'Integrated', subject: 'Surgical Skills and Procedures', courseCode: 'CLIN 422' },
  { yearNumber: 4, semester: 2, phase: 'Integrated', subject: 'Medical Skills and Procedures', courseCode: 'CLIN 423' },
  { yearNumber: 4, semester: 2, phase: 'Integrated', subject: 'Obs/Gyn Skills and Procedures', courseCode: 'CLIN 424' },
  { yearNumber: 4, semester: 2, phase: 'Integrated', subject: 'Mental Health I', courseCode: 'CLIN 425' },

  // Year 5
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Medicine I', courseCode: 'CLIN 501' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Child Health I', courseCode: 'CLIN 502' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Surgery I', courseCode: 'CLIN 503' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Obs/Gyn I', courseCode: 'CLIN 504' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Community and Primary Care I', courseCode: 'CLIN 505' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Anesthesia', courseCode: 'CLIN 506' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Radiology', courseCode: 'CLIN 507' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'ENT', courseCode: 'CLIN 508' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Dermatology', courseCode: 'CLIN 509' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Oral Health', courseCode: 'CLIN 510' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Community and Primary Care II', courseCode: 'CLIN 511' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Emergency Medicine', courseCode: 'CLIN 512' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'Clinical Selective', courseCode: 'CLIN 513' },
  { yearNumber: 5, semester: 1, phase: 'Clinical', subject: 'SLT (Forensic Medicine, Social Encounters with NGOs)', courseCode: 'CLIN 514' },

  // Year 6
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Medicine II', courseCode: 'CLIN 601' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Clinical Elective', courseCode: 'CLIN 602' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Child Health II', courseCode: 'CLIN 603' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Hematology', courseCode: 'CLIN 604' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Community and Primary Care III', courseCode: 'CLIN 605' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Mental Health II', courseCode: 'CLIN 606' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Surgery II', courseCode: 'CLIN 607' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Orthopedic', courseCode: 'CLIN 608' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Obs/Gyn II', courseCode: 'CLIN 609' },
  { yearNumber: 6, semester: 1, phase: 'Clinical', subject: 'Ophthalmology', courseCode: 'CLIN 610' },

  // Pre-Internship
  { yearNumber: 7, semester: 1, phase: 'Clinical', subject: 'Medicine', courseCode: 'CLIN 621', phaseLabel: 'Pre-Internship' },
  { yearNumber: 7, semester: 1, phase: 'Clinical', subject: 'Surgery', courseCode: 'CLIN 622', phaseLabel: 'Pre-Internship' },
  { yearNumber: 7, semester: 1, phase: 'Clinical', subject: 'Child Health', courseCode: 'CLIN 623', phaseLabel: 'Pre-Internship' },
  { yearNumber: 7, semester: 1, phase: 'Clinical', subject: 'Obs/Gyn and Primary Care', courseCode: 'CLIN 624', phaseLabel: 'Pre-Internship' },
];

async function seedAcademicData() {
  console.log('Seeding academic structure...');

  // First, ensure academic years exist
  const years = [...new Set(academicData.map(s => s.yearNumber))];
  for (const year of years) {
    const existing = await pool.execute('SELECT id FROM academic_years WHERE yearNumber = ?', [year]);
    if (existing[0].length === 0) {
      await pool.execute(
        'INSERT INTO academic_years (yearNumber, label) VALUES (?, ?)',
        [year, `Year ${year}`]
      );
      console.log(`Created academic year ${year}`);
    }
  }

  // Insert subjects
  for (const item of academicData) {
    const existing = await pool.execute(
      'SELECT id FROM subjects WHERE courseCode = ? OR name = ?',
      [item.courseCode, item.subject]
    );

    if (existing[0].length === 0) {
      await pool.execute(
        'INSERT INTO subjects (name, courseCode, yearNumber, semester, phase) VALUES (?, ?, ?, ?, ?)',
        [item.subject, item.courseCode, item.yearNumber, item.semester, item.phase || 'Basic']
      );
      console.log(`Created subject: ${item.courseCode} - ${item.subject}`);
    }
  }

  console.log('Academic structure seeding complete!');
  process.exit(0);
}

seedAcademicData().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});