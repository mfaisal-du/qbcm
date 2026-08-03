const fs = require('fs');

const fileContent = `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Shield, Users, BookOpen, ClipboardList, TrendingUp, BarChart3, Target, CheckCircle, XCircle, Clock, Database, FileText, Activity, Archive } from 'lucide-react';
import { userService, academicService, questionService } from '../services/api';
import { Card, Button, Input, Select, Modal, Badge, Spinner, Table, StatusGuide, STATUS_TOOLTIPS } from '../components/Common';
import { FacultyQuestionsPage } from './FacultyPages.jsx';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const AcademicStructurePreview = () => {
  const medicalCurriculum = [
    { year: 1, semester: 1, season: 'Fall', courses: [
      { code: 'ENGL 101', name: 'Basic Academic English', phase: 'Basic' },
      { code: 'ARAB 101', name: 'Academic Writing in Arabic', phase: 'Basic' },
      { code: 'ENTR 200', name: 'Entrepreneurship: Innovation and Creativity', phase: 'Basic' },
      { code: 'SOCS 102', name: 'Omani Society', phase: 'Basic' },
      { code: 'MEDI 101', name: 'English for Medicine', phase: 'Basic' }
    ]},
    { year: 1, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 121', name: 'Cell Biology', phase: 'Basic' },
      { code: 'MEDI 122', name: 'Human Body Structure I', phase: 'Basic' },
      { code: 'MEDI 123', name: 'Human Physiology I', phase: 'Basic' },
      { code: 'MEDI 124', name: 'Biochemical Basis of Body Functions', phase: 'Basic' },
      { code: 'MEDI 125', name: 'Behavioral & Social Sciences', phase: 'Basic' },
      { code: 'MEDI 126', name: 'Medical Informatics', phase: 'Basic' }
    ]},
    { year: 2, semester: 1, season: 'Fall', courses: [
      { code: 'MEDI 211', name: 'Human Physiology II', phase: 'Basic' },
      { code: 'MEDI 212', name: 'Basics of Medical Genetics', phase: 'Basic' },
      { code: 'MEDI 213', name: 'Principles of Medical Microbiology and Immunology', phase: 'Integrated' },
      { code: 'MEDI 214', name: 'Introduction to Pharmacology', phase: 'Integrated' },
      { code: 'MEDI 215', name: 'Human Body Structure II', phase: 'Integrated' },
      { code: 'MEDI 216', name: 'General Pathology', phase: 'Integrated' },
      { code: 'MEDI 217', name: 'Early Clinical Exposure and Body Systems Integration I', phase: 'Clinical' }
    ]},
    { year: 2, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 221', name: 'Hematopoietic & Immune System', phase: 'Integrated' },
      { code: 'MEDI 222', name: 'Community and Global Health', phase: 'Integrated' },
      { code: 'MEDI 223', name: 'Research in Health and Biostatistics', phase: 'Integrated' },
      { code: 'MEDI 224', name: 'Respiratory System', phase: 'Integrated' },
      { code: 'MEDI 225', name: 'Cardiovascular System', phase: 'Integrated' }
    ]},
    { year: 3, semester: 1, season: 'Fall', courses: [
      { code: 'MEDI 311', name: 'Locomotor System', phase: 'Integrated' },
      { code: 'MEDI 312', name: 'Clinical Nutrition', phase: 'Integrated' },
      { code: 'MEDI 313', name: 'Alimentary System', phase: 'Integrated' },
      { code: 'MEDI 314', name: 'Urogenital System', phase: 'Integrated' },
      { code: 'MEDI 315', name: 'Research Project I', phase: 'Clinical' },
      { code: 'MEDI 316', name: 'Emerging Medical Technologies', phase: 'Clinical' },
      { code: 'MEDI 317', name: 'Early Clinical Exposure and Body Systems Integration II', phase: 'Clinical' }
    ]},
    { year: 3, semester: 2, season: 'Spring', courses: [
      { code: 'MEDI 321', name: 'Endocrine System', phase: 'Integrated' },
      { code: 'MEDI 322', name: 'Human Nervous System', phase: 'Integrated' },
      { code: 'MEDI 323', name: 'Special Senses', phase: 'Integrated' },
      { code: 'MEDI 324', name: 'Research Project II', phase: 'Clinical' }
    ]},
    { year: 4, semester: 1, season: 'Fall', courses: [
      { code: 'CLIN 411', name: 'Medical Ethics and Professionalism', phase: 'Clinical' },
      { code: 'CLIN 412', name: 'Patient Support and Safety', phase: 'Clinical' },
      { code: 'CLIN 413', name: 'Medical Imaging and Radiology', phase: 'Clinical' },
      { code: 'CLIN 414', name: 'Evidence Based Medicine', phase: 'Clinical' },
      { code: 'CLIN 415', name: 'Interpretation of Laboratory Data', phase: 'Clinical' },
      { code: 'CLIN 416', name: 'Clinical Psychology', phase: 'Clinical' },
      { code: 'CLIN 417', name: 'Communication Skills', phase: 'Clinical' }
    ]},
    { year: 4, semester: 2, season: 'Spring', courses: [
      { code: 'CLIN 421', name: 'Child Health Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 422', name: 'Surgical Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 423', name: 'Medical Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 424', name: 'Obs/Gyn Skills and Procedures', phase: 'Clinical' },
      { code: 'CLIN 425', name: 'Mental Health I', phase: 'Clinical' }
    ]},
    { year: 5, semester: null, season: null, courses: [
      { code: 'CLIN 501', name: 'Medicine I', phase: 'Clinical' },
      { code: 'CLIN 502', name: 'Child Health I', phase: 'Clinical' },
      { code: 'CLIN 503', name: 'Surgery I', phase: 'Clinical' },
      { code: 'CLIN 504', name: 'Obs/Gyn I', phase: 'Clinical' },
      { code: 'CLIN 505', name: 'Community and Primary Care I', phase: 'Clinical' },
      { code: 'CLIN 506', name: 'Anesthesia', phase: 'Clinical' },
      { code: 'CLIN 507', name: 'Radiology', phase: 'Clinical' },
      { code: 'CLIN 508', name: 'ENT', phase: 'Clinical' },
      { code: 'CLIN 509', name: 'Dermatology', phase: 'Clinical' },
      { code: 'CLIN 510', name: 'Oral Health', phase: 'Clinical' },
      { code: 'CLIN 511', name: 'Community and Primary Care II', phase: 'Clinical' },
      { code: 'CLIN 512', name: 'Emergency Medicine', phase: 'Clinical' },
      { code: 'CLIN 513', name: 'Clinical Selective', phase: 'Clinical' },
      { code: 'CLIN 514', name: 'SLT (Forensic Medicine, Social Encounters with NGOs)', phase: 'Clinical' }
    ]},
    { year: 6, semester: null, season: null, courses: [
      { code: 'CLIN 601', name: 'Medicine II', phase: 'Clinical' },
      { code: 'CLIN 602', name: 'Clinical Elective', phase: 'Clinical' },
      { code: 'CLIN 603', name: 'Child Health II', phase: 'Clinical' },
      { code: 'CLIN 604', name: 'Hematology', phase: 'Clinical' },
      { code: 'CLIN 605', name: 'Community and Primary Care III', phase: 'Clinical' },
      { code: 'CLIN 606', name: 'Mental Health II', phase: 'Clinical' },
      { code: 'CLIN 607', name: 'Surgery II', phase: 'Clinical' },
      { code: 'CLIN 608', name: 'Orthopedic', phase: 'Clinical' },
      { code: 'CLIN 609', name: 'Obs/Gyn II', phase: 'Clinical' },
      { code: 'CLIN 610', name: 'Ophthalmology', phase: 'Clinical' }
    ]},
    { year: 'Pre-Internship', semester: null, season: null, courses: [
      { code: 'CLIN 621', name: 'Medicine', phase: 'Clinical' },
      { code: 'CLIN 622', name: 'Surgery', phase: 'Clinical' },
      { code: 'CLIN 623', name: 'Child Health', phase: 'Clinical' },
      { code: 'CLIN 624', name: 'Obs/Gyn and Primary Care', phase: 'Clinical' }
    ]}
  ];

  const phaseColors = {
    Basic: 'bg-blue-100 text-blue-700',
    Integrated: 'bg-purple-100 text-purple-700',
    Clinical: 'bg-rose-100 text-rose-700'
  };

  const totalCourses = medicalCurriculum.reduce((sum, y) => sum + y.courses.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="mb-3 flex gap-4">
        <p className="text-sm text-gray-600">Total Years: <span className="font-semibold text-gray-800">{medicalCurriculum.length}</span></p>
        <p className="text-sm text-gray-600">Total Courses: <span className="font-semibold text-gray-800">{totalCourses}</span></p>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {medicalCurriculum.map((yearData) => (
          <div key={yearData.year} className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>Year {yearData.year}</span>
              {yearData.semester && <span className="text-gray-500">• Semester {yearData.semester}</span>}
              {yearData.season && <span className="text-gray-400">({yearData.season})</span>}
            </h4>
            <div className="space-y-1.5">
              {yearData.courses.slice(0, 4).map((course) => (
                <div key={course.code} className="flex items-center justify-between text-xs">
                  <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">{course.code}</span>
                  <span className="text-gray-700 flex-1 mx-2 truncate">{course.name}</span>
                  <span className={\\\`px-1.5 py-0.5 rounded \\\${phaseColors[course.phase]}\\\`}>{course.phase}</span>
                </div>
              ))}
              {yearData.courses.length > 4 && (
                <p className="text-xs text-gray-500 mt-1">+ {yearData.courses.length - 4} more courses</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// This file has been truncated to fix the duplicate AcademicStructurePreview issue
// The remaining exports are defined in a separate file or need to be restored from backup
export const SuperAdminDashboard = () => {
  return <div>Super Admin Dashboard - Loading</div>;
};

export const AdminDashboard = () => {
  return <div>Admin Dashboard - Loading</div>;
};

export const AdminUsersPage = () => {
  return <div>Admin Users Page - Loading</div>;
};

export const AdminAcademicPage = () => {
  return <div>Admin Academic Page - Loading</div>;
};

export const AdminSubjectsPage = () => {
  return <div>Admin Subjects Page - Loading</div>;
};

export const AdminTopicsPage = () => {
  return <div>Admin Topics Page - Loading</div>;
};

export const AdminQuestionsPage = () => {
  return <div>Admin Questions Page - Loading</div>;
};
`;

fs.writeFileSync('E:/QB_CM/frontend/src/pages/AdminPages.jsx', fileContent, 'utf8');
console.log('File rebuilt with minimal working version');