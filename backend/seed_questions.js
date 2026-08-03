import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const questionTemplates = {
  recall: [
    "What is the definition of {keyword}?",
    "Which of the following is the {keyword}?",
    "The {keyword} is characterized by:",
    "What is the main function of {keyword}?",
    "Identify the {keyword} from the following options:"
  ],
  comprehension: [
    "Explain the relationship between {keyword1} and {keyword2}",
    "Which statement best describes {keyword}?",
    "Compare and contrast {keyword1} and {keyword2}",
    "What is the significance of {keyword} in {context}?",
    "Describe the process of {keyword}"
  ],
  application: [
    "A patient presents with {symptom1} and {symptom2}. What is the most likely diagnosis?",
    "In the treatment of {condition}, which approach would be most appropriate?",
    "How would you apply {principle} to manage {condition}?",
    "Given the clinical scenario of {scenario}, what is your next step?",
    "Which treatment would be most suitable for a patient with {presentation}?"
  ],
  analysis: [
    "What is the most important factor contributing to {condition}?",
    "Analyze the relationship between {factor1} and {outcome}",
    "Which complication is most likely in {patient_type} with {condition}?",
    "What mechanism explains {phenomenon} in {condition}?",
    "Why would {intervention} be effective in {condition}?"
  ],
  synthesis: [
    "Develop a comprehensive management plan for {condition} with {complication}",
    "Propose a diagnostic algorithm for a patient with {presentation}",
    "Integrate knowledge of {system1} and {system2} to explain {phenomenon}",
    "Design an evidence-based approach to {clinical_problem}",
    "How would you modify treatment for {condition} in the presence of {factor}?"
  ],
  evaluation: [
    "Critically evaluate the evidence for {intervention} in {condition}",
    "Compare the effectiveness of {treatment1} versus {treatment2} for {condition}",
    "Justify your choice of {intervention} over alternatives for {patient_type}",
    "What are the limitations of {diagnostic_test} in {condition}?",
    "Assess the risk-benefit ratio of {treatment} in {clinical_scenario}"
  ],
  clinical_reasoning: [
    "A 45-year-old {gender} presents with {symptom1}, {symptom2}, and {symptom3}. Labs show {finding1}, {finding2}. What is your differential diagnosis?",
    "Following treatment with {medication}, the patient develops {complication}. What is the mechanism?",
    "How would you manage a {condition} patient who is {contraindication} to standard therapy?",
    "Explain the clinical significance of {lab_finding} in {condition}",
    "A {patient_type} with {comorbidity} develops {complication} during treatment. How would you proceed?"
  ]
};

const subjects = [
  { name: 'Anatomy', topics: ['Upper Limb', 'Lower Limb', 'Head & Neck', 'Thorax', 'Abdomen', 'Pelvis', 'CNS', 'Vascular'] },
  { name: 'Physiology', topics: ['Cardiovascular', 'Respiratory', 'GIT', 'Renal', 'Endocrine', 'Nervous', 'Reproductive', 'Muscles'] },
  { name: 'Biochemistry', topics: ['Carbohydrate Metabolism', 'Lipid Metabolism', 'Protein Metabolism', 'Enzyme', 'Vitamins', 'Minerals'] },
  { name: 'Pathology', topics: ['Cell Injury', 'Inflammation', 'Infection', 'Immunopathology', 'Neoplasia', 'Hemodynamics', 'Genetic'] },
  { name: 'Pharmacology', topics: ['Antibiotics', 'Antivirals', 'Immunosuppressants', 'Cardiovascular', 'CNS', 'GIT', 'Endocrine', 'Chemotherapy'] },
  { name: 'Medicine', topics: ['Cardiology', 'Respirology', 'Gastroenterology', 'Nephrology', 'Endocrinology', 'Rheumatology', 'Hematology', 'Infectious Diseases'] },
  { name: 'Surgery', topics: ['General Surgery', 'Pediatric Surgery', 'Vascular Surgery', 'Thoracic Surgery', 'Neurosurgery', 'Orthopedic', 'Trauma', 'Oncologic'] },
  { name: 'Microbiology', topics: ['Bacteriology', 'Virology', 'Mycology', 'Parasitology', 'Immunology', 'Serology', 'Culture', 'Epidemiology'] }
];

const competencies = [
  'Deep knowledge of pathophysiology',
  'Clinical diagnostic skills',
  'Therapeutic decision-making',
  'Evidence-based practice',
  'Patient communication',
  'Team collaboration',
  'Technical proficiency',
  'Critical thinking',
  'Research methodology',
  'Ethical reasoning'
];

const learningOutcomes = [
  'Understand the pathophysiology of common diseases',
  'Recognize clinical presentations and diagnoses',
  'Apply evidence-based treatments',
  'Evaluate diagnostic and therapeutic options',
  'Manage acute and chronic conditions',
  'Communicate effectively with patients',
  'Work collaboratively in healthcare teams',
  'Identify and manage complications',
  'Practice safe and ethical medicine',
  'Stay current with medical evidence'
];

const optionsPool = {
  anatomical: ['Medial', 'Lateral', 'Anterior', 'Posterior', 'Proximal', 'Distal', 'Superficial', 'Deep'],
  causes: ['Bacterial', 'Viral', 'Fungal', 'Parasitic', 'Autoimmune', 'Genetic', 'Traumatic', 'Metabolic'],
  treatments: ['Antibiotics', 'NSAIDs', 'Steroids', 'Antivirals', 'Immunosuppressants', 'Surgery', 'Supportive care', 'Chemotherapy'],
  lab_values: ['Elevated', 'Decreased', 'Normal', 'Markedly elevated', 'Borderline', 'Fluctuating', 'Variable', 'Range-dependent']
};

const symptoms = [
  'fever and chills',
  'chest pain and dyspnea',
  'abdominal pain and nausea',
  'headache and neck stiffness',
  'joint pain and swelling',
  'rash and pruritus',
  'fatigue and weight loss',
  'palpitations and syncope'
];

const findings = [
  'elevated WBC',
  'elevated CRP',
  'anemia',
  'thrombocytopenia',
  'elevated liver enzymes',
  'elevated serum creatinine',
  'hypokalemia',
  'metabolic acidosis'
];

function getRandomArrayElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuestion(year, semester, subject, topic, cognitiveLevel) {
  const template = getRandomArrayElement(questionTemplates[cognitiveLevel]);
  let questionText = template;

  // Replace placeholders with realistic medical terms
  questionText = questionText.replace(/{keyword1}/g, getRandomArrayElement(['pathogen', 'host', 'immune response']));
  questionText = questionText.replace(/{keyword2}/g, getRandomArrayElement(['infection', 'inflammation', 'tissue damage']));
  questionText = questionText.replace(/{keyword}/g, getRandomArrayElement(['condition', 'disease', 'syndrome', 'pathology', 'mechanism']));
  questionText = questionText.replace(/{context}/g, getRandomArrayElement(['clinical practice', 'diagnosis', 'treatment', 'prognosis']));
  questionText = questionText.replace(/{symptom1}/g, getRandomArrayElement(symptoms));
  questionText = questionText.replace(/{symptom2}/g, getRandomArrayElement(symptoms));
  questionText = questionText.replace(/{symptom3}/g, getRandomArrayElement(symptoms));
  questionText = questionText.replace(/{condition}/g, getRandomArrayElement(['the disease', 'this condition', 'this pathology', 'the syndrome']));
  questionText = questionText.replace(/{patient_type}/g, getRandomArrayElement(['elderly', 'pediatric', 'immunocompromised', 'diabetic', 'hypertensive']));
  questionText = questionText.replace(/{treatment1}/g, getRandomArrayElement(['medical therapy', 'surgical intervention', 'conservative management', 'immunotherapy']));
  questionText = questionText.replace(/{treatment2}/g, getRandomArrayElement(['medical therapy', 'surgical intervention', 'conservative management', 'immunotherapy']));
  questionText = questionText.replace(/{intervention}/g, getRandomArrayElement(['drug X', 'procedure A', 'therapy B', 'management C']));
  questionText = questionText.replace(/{finding1}/g, getRandomArrayElement(findings));
  questionText = questionText.replace(/{finding2}/g, getRandomArrayElement(findings));
  questionText = questionText.replace(/{fact|or1}/g, getRandomArrayElement(['age', 'gender', 'comorbidities', 'genetics']));
  questionText = questionText.replace(/{outcome}/g, getRandomArrayElement(['morbidity', 'mortality', 'recovery', 'complications']));

  const difficulty = Math.random() < 0.3 ? 'easy' : Math.random() < 0.6 ? 'medium' : 'hard';
  const assessmentType = Math.random() < 0.6 ? 'formative' : 'summative';

  return {
    questionText,
    questionType: 'multiple_choice',
    subject,
    topic,
    year,
    semester,
    difficulty,
    cognitiveLevel,
    assessmentType,
    learningOutcome: getRandomArrayElement(learningOutcomes),
    competencies: getRandomArrayElement(competencies),
    weighting: Math.round(Math.random() * 10 * 100) / 100,
    coverage: getRandomArrayElement(['course', 'module', 'full_program']),
    courseCode: `${subject.substring(0, 3).toUpperCase()}${year}${semester}0${Math.floor(Math.random() * 9)}`,
    options: JSON.stringify([
      getRandomArrayElement(optionsPool.causes),
      getRandomArrayElement(optionsPool.causes),
      getRandomArrayElement(optionsPool.causes),
      getRandomArrayElement(optionsPool.causes)
    ]),
    correctAnswer: getRandomArrayElement(optionsPool.causes),
    explanation: `This is the correct answer because it best explains ${topic} in the context of ${subject}. The mechanism involves...`,
    status: 'approved'
  };
}

async function seedQuestions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME
  });

  try {
    console.log('Starting question seeding...');
    console.log(`Target: 500+ questions across 6 years, 8 subjects`);

    const cognitiveStems = Object.keys(questionTemplates);
    let count = 0;
    const batchSize = 50;
    let batch = [];

    for (let year = 1; year <= 6; year++) {
      for (let semester = 1; semester <= 2; semester++) {
        for (const subjectData of subjects) {
          // 35-45 questions per subject per year-semester
          const questionsPerSubject = 35 + Math.floor(Math.random() * 10);

          for (let i = 0; i < questionsPerSubject; i++) {
            const topic = getRandomArrayElement(subjectData.topics);
            const cognitiveLevel = getRandomArrayElement(cognitiveStems) ;
            const question = generateQuestion(year, semester, subjectData.name, topic, cognitiveLevel);
            question.createdBy = 2; // faculty user

            batch.push(question);
            count++;

            if (batch.length >= batchSize) {
              await insertBatch(pool, batch);
              console.log(`✓ Inserted ${count} questions`);
              batch = [];
            }
          }
        }
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await insertBatch(pool, batch);
    }

    console.log(`\n✓✓✓ Successfully seeded ${count} questions!`);
    console.log('Distribution:');
    console.log(`  - Years: 1-6`);
    console.log(`  - Subjects: ${subjects.length}`);
    console.log(`  - Cognitive Levels: ${cognitiveStems.length}`);
    console.log(`  - Assessment Types: Formative & Summative`);

    await pool.end();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

async function insertBatch(pool, questions) {
  const query = `
    INSERT INTO questions (
      questionText, questionType, subject, topic, year, semester, difficulty,
      cognitiveLevel, assessmentType, learningOutcome, competencies, weighting,
      coverage, courseCode, options, correctAnswer, explanation, createdBy, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const q of questions) {
    await pool.execute(query, [
      q.questionText, q.questionType, q.subject, q.topic, q.year, q.semester, q.difficulty,
      q.cognitiveLevel, q.assessmentType, q.learningOutcome, q.competencies, q.weighting,
      q.coverage, q.courseCode, q.options, q.correctAnswer, q.explanation, q.createdBy, q.status
    ]);
  }
}

seedQuestions();
