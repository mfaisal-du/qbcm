-- COM Question Bank Database Schema

CREATE DATABASE IF NOT EXISTS com_question_bank;
USE com_question_bank;

-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'administrator', 'faculty', 'student', 'reviewer') NOT NULL,
  isApproved TINYINT(1) NOT NULL DEFAULT 1,
  approvedBy INT NULL,
  approvedAt TIMESTAMP NULL,
  mustChangePassword TINYINT(1) NOT NULL DEFAULT 0,
  department VARCHAR(100),
  assignedYear INT,
  assignedSemester INT,
  assignedSubject VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_isApproved (isApproved),
  INDEX idx_department (department),
  INDEX idx_assignedYear (assignedYear)
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_approvedBy FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Questions Table
CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionText LONGTEXT NOT NULL,
  questionType ENUM('multiple_choice', 'short_answer', 'essay') NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  clo VARCHAR(30) NULL,
  slo VARCHAR(30) NULL,
  year INT NOT NULL,
  semester INT,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  cognitiveLevel ENUM('recall', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation', 'clinical_reasoning') DEFAULT 'recall',
  assessmentType ENUM('formative', 'summative') DEFAULT 'formative',
  learningOutcome TEXT,
  competencies TEXT,
  weighting DECIMAL(5,2) DEFAULT 0,
  coverage ENUM('course', 'module', 'full_program') DEFAULT 'course',
  courseCode VARCHAR(50),
  phase ENUM('Basic', 'Integrated', 'Clinical'),
  options JSON,
  correctAnswer VARCHAR(255),
  explanation LONGTEXT,
  audio VARCHAR(500) NULL,
  createdBy INT NOT NULL,
  usageCount INT DEFAULT 0,
  status ENUM('draft', 'vetted', 'active', 'used', 'rejected', 'archived') DEFAULT 'draft',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subject (subject),
  INDEX idx_topic (topic),
  INDEX idx_year (year),
  INDEX idx_difficulty (difficulty),
  INDEX idx_status (status),
  INDEX idx_cognitive (cognitiveLevel),
  INDEX idx_assessment (assessmentType),
  INDEX idx_coverage (coverage),
  FULLTEXT ft_question (questionText)
);

-- Reviews Table
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionId INT NOT NULL,
  reviewerId INT NOT NULL,
  status ENUM('approved', 'rejected') DEFAULT 'approved',
  comments LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_questionId (questionId),
  INDEX idx_reviewerId (reviewerId),
  INDEX idx_status (status)
);

-- Student Answers Table
CREATE TABLE student_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  questionId INT NOT NULL,
  selectedAnswer VARCHAR(255),
  timeSpent INT DEFAULT 0,
  answeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_questionId (questionId),
  UNIQUE KEY unique_student_question (studentId, questionId)
);

-- Question Usage History Table (tracks when a question is used in assessments)
CREATE TABLE question_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  questionId INT NOT NULL,
  assessmentType ENUM('quiz', 'midterm', 'endcourse') NOT NULL,
  academicYear INT NOT NULL,
  semester INT NOT NULL,
  notes TEXT,
  addedBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (addedBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_qu_questionId (questionId),
  INDEX idx_qu_assessmentType (assessmentType),
  INDEX idx_qu_academicYear (academicYear),
  INDEX idx_qu_semester (semester)
);

-- Create Sample Users (passwords: admin123, faculty123, student123, reviewer123)
INSERT INTO users (firstName, lastName, email, password, role, isApproved) VALUES
('Admin', 'User', 'admin@comqb.local', '$2a$10$nCmB/FR8eQS9bha0zepfUebS0URH3s1aHiUndfEJ0OniaFvrpMtnu', 'super_admin', 1),
('Faculty', 'User', 'faculty@comqb.local', '$2a$10$QAAGjkKIzzmeoI.yiPAAleatxlVI//flPdpOriGi5DIXsaoEAQqFG', 'faculty', 1),
('Student', 'User', 'student@comqb.local', '$2a$10$co0klfTBZIhziB2Q18NmvetoBJ3Kz6Y5rXrgqsqds/WtgLm7ObRYu', 'student', 1),
('Reviewer', 'User', 'reviewer@comqb.local', '$2a$10$ywLdRqpoG4Itxek5CtqB8ef3IJ8yn2jkO83Oi0Jjbgl2T95MOqfWy', 'reviewer', 1);

-- Create indexes for better query performance
CREATE INDEX idx_createdBy ON questions(createdBy);
CREATE INDEX idx_answeredAt ON student_answers(answeredAt);

-- Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
  id INT PRIMARY KEY AUTO_INCREMENT,
  yearNumber INT NOT NULL UNIQUE,
  label VARCHAR(100),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects Table (Plan of Study courses)
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  courseCode VARCHAR(20),
  yearNumber INT NOT NULL,
  semester INT NOT NULL,
  phase ENUM('Basic', 'Integrated', 'Clinical') DEFAULT 'Basic',
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subject_year (yearNumber),
  INDEX idx_subject_phase (phase)
);

-- Topics Table
CREATE TABLE IF NOT EXISTS topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  subjectId INT NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Course Learning Outcomes (CLOs) Table
CREATE TABLE IF NOT EXISTS clos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subjectId INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_subject (subjectId)
);

-- Student Learning Outcomes (SLOs) Table
CREATE TABLE IF NOT EXISTS slos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cloId INT NOT NULL,
  topicId INT NOT NULL,
  code VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cloId) REFERENCES clos(id) ON DELETE CASCADE,
  FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE CASCADE,
  INDEX idx_clo (cloId),
  INDEX idx_topic (topicId)
);
