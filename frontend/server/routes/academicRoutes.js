import express from 'express';
import {
  getYears, createYear, updateYear, deleteYear,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getTopics, createTopic, updateTopic, deleteTopic,
  getCLOs, createCLO, updateCLO, deleteCLO,
  getSLOs, createSLO, updateSLO, deleteSLO
} from '../controllers/academicController.js';
import { authenticate, authorize, filterByUserSubject } from '../middleware/auth.js';

const router = express.Router();
const adminOnly = [authenticate, authorize(['administrator', 'faculty'])];
const allAuth   = [authenticate, filterByUserSubject];

// Academic Years
router.get('/years',         allAuth,   getYears);
router.post('/years',        adminOnly, createYear);
router.put('/years/:id',     adminOnly, updateYear);
router.delete('/years/:id',  adminOnly, deleteYear);

// Subjects
router.get('/subjects',        allAuth,   getSubjects);
router.post('/subjects',       adminOnly, createSubject);
router.put('/subjects/:id',    adminOnly, updateSubject);
router.delete('/subjects/:id', adminOnly, deleteSubject);

// Topics
router.get('/topics',        allAuth,   getTopics);
router.post('/topics',       adminOnly, createTopic);
router.put('/topics/:id',    adminOnly, updateTopic);
router.delete('/topics/:id', adminOnly, deleteTopic);

// CLOs (Course Learning Outcomes)
router.get('/clos',        allAuth,   getCLOs);
router.post('/clos',       adminOnly, createCLO);
router.put('/clos/:id',    adminOnly, updateCLO);
router.delete('/clos/:id', adminOnly, deleteCLO);

// SLOs (Student Learning Outcomes)
router.get('/slos',        allAuth,   getSLOs);
router.post('/slos',       adminOnly, createSLO);
router.put('/slos/:id',    adminOnly, updateSLO);
router.delete('/slos/:id', adminOnly, deleteSLO);

export default router;
