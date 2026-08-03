import * as Academic from '../models/Academic.js';
import pool from '../config/database.js';

// ─── Years ───────────────────────────────────────────────────────────────────

export const getYears = async (req, res) => {
  try {
    const years = await Academic.getAcademicYears();
    res.json({ message: 'Years retrieved', years });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createYear = async (req, res) => {
  try {
    const { yearNumber, label, description } = req.body;
    if (!yearNumber || !label)
      return res.status(400).json({ message: 'yearNumber and label are required' });
    await Academic.createAcademicYear({ yearNumber, label, description });
    res.status(201).json({ message: 'Year created successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Year number already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description } = req.body;
    const result = await Academic.updateAcademicYear(id, { label, description });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Year not found' });
    res.json({ message: 'Year updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const { id } = req.params;
    await Academic.deleteAcademicYear(id);
    res.json({ message: 'Year deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Subjects ────────────────────────────────────────────────────────────────

export const getSubjects = async (req, res) => {
  try {
    const { yearNumber, semester, phase, subject } = req.query;
    const yearNum = req.yearFilter || yearNumber || null;
    const sem = req.semesterFilter || semester || null;
    const ph = phase || null;
    let subjectFilter = req.subjectFilter || subject || null;
    let subjectNames = null;

    if (subjectFilter) {
      if (Array.isArray(subjectFilter)) {
        subjectNames = subjectFilter;
      } else {
        subjectNames = [subjectFilter];
      }
    }

    const singleSubject = subjectNames && subjectNames.length === 1 ? subjectNames[0] : null;
    const multipleSubjects = subjectNames && subjectNames.length > 1 ? subjectNames : null;

    const subjects = await Academic.getSubjects(yearNum, sem, ph, singleSubject, multipleSubjects);
    res.json({ message: 'Subjects retrieved', subjects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, courseCode, yearNumber, semester, phase, description } = req.body;
    if (!name || !yearNumber || !semester)
      return res.status(400).json({ message: 'name, yearNumber and semester are required' });
    await Academic.createSubject({ name, courseCode, yearNumber, semester, phase, description });
    res.status(201).json({ message: 'Subject created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, courseCode, yearNumber, semester, phase, description } = req.body;
    const result = await Academic.updateSubject(id, { name, courseCode, yearNumber, semester, phase, description });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await Academic.deleteSubject(id);
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Topics ──────────────────────────────────────────────────────────────────

export const getTopics = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const subjectFilter = req.subjectFilter || null;
    let topics;

    if (subjectFilter) {
      if (Array.isArray(subjectFilter)) {
        const placeholders = subjectFilter.map(() => '?').join(',');
        const [rows] = await pool.execute(
          `SELECT s.id FROM subjects s WHERE s.name IN (${placeholders})`,
          subjectFilter
        );
        const subjectIds = rows.map(r => r.id);
        topics = await Academic.getTopics(null, subjectIds);
      } else {
        const [rows] = await pool.execute(
          'SELECT s.id FROM subjects s WHERE s.name = ?',
          [subjectFilter]
        );
        const resolvedId = rows[0]?.id || subjectId;
        console.log('getTopics subjectFilter resolved to id', resolvedId, 'for name', subjectFilter);
        topics = await Academic.getTopics(resolvedId);
      }
    } else {
      console.log('getTopics no subjectFilter, using subjectId', subjectId);
      topics = await Academic.getTopics(subjectId);
    }
    res.json({ message: 'Topics retrieved', topics });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createTopic = async (req, res) => {
  try {
    const { subjectId, name, description } = req.body;
    if (!subjectId || !name)
      return res.status(400).json({ message: 'subjectId and name are required' });
    await Academic.createTopic({ subjectId, name, description });
    res.status(201).json({ message: 'Topic created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await Academic.updateTopic(id, { name, description });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Topic not found' });
    res.json({ message: 'Topic updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await Academic.deleteTopic(id);
    res.json({ message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── CLOs (Course Learning Outcomes) ─────────────────────────────────────────

export const getCLOs = async (req, res) => {
  try {
    const subjectNames = Array.isArray(req.subjectFilter) ? req.subjectFilter : (req.subjectFilter ? [req.subjectFilter] : null);
    let subjectIds = null;
    
    if (subjectNames && subjectNames.length > 0) {
      const [rows] = await pool.execute(
        `SELECT s.id FROM subjects s WHERE s.name IN (${subjectNames.map(() => '?').join(',')})`,
        subjectNames
      );
      subjectIds = rows.map(r => r.id);
    }
    
    const clos = await Academic.getCLOs(null, subjectIds);
    res.json({ message: 'CLOs retrieved', clos });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createCLO = async (req, res) => {
  try {
    const { subjectId, code, description } = req.body;
    if (!subjectId || !code || !description)
      return res.status(400).json({ message: 'subjectId, code and description are required' });
    await Academic.createCLO({ subjectId, code, description });
    res.status(201).json({ message: 'CLO created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateCLO = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;
    const result = await Academic.updateCLO(id, { code, description });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'CLO not found' });
    res.json({ message: 'CLO updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteCLO = async (req, res) => {
  try {
    const { id } = req.params;
    await Academic.deleteCLO(id);
    res.json({ message: 'CLO deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── SLOs (Student Learning Outcomes) ─────────────────────────────────────────

export const getSLOs = async (req, res) => {
  try {
    const { cloId, topicId } = req.query;
    const subjectNames = Array.isArray(req.subjectFilter) ? req.subjectFilter : (req.subjectFilter ? [req.subjectFilter] : null);

    if (topicId) {
      const slos = await Academic.getSLOs(cloId, topicId);
      return res.json({ message: 'SLOs retrieved', slos });
    }

    let slos;

    if (subjectNames && subjectNames.length > 0) {
      const [topicRows] = await pool.execute(
        `SELECT t.id as topicId FROM topics t JOIN subjects s ON s.id = t.subjectId WHERE s.name IN (${subjectNames.map(() => '?').join(',')})`,
        subjectNames
      );
      const topicIds = topicRows.map(r => r.topicId);
      if (topicIds.length > 0) {
        slos = await Academic.getSLOsForTopics(topicIds);
        if (cloId) {
          slos = slos.filter(s => s.cloId == cloId);
        }
      } else {
        slos = [];
      }
    } else {
      slos = await Academic.getSLOs(cloId, topicId);
    }
    res.json({ message: 'SLOs retrieved', slos });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createSLO = async (req, res) => {
  try {
    const { cloId, topicId, code, description } = req.body;
    if (!cloId || !topicId || !code || !description)
      return res.status(400).json({ message: 'cloId, topicId, code and description are required' });
    await Academic.createSLO({ cloId, topicId, code, description });
    res.status(201).json({ message: 'SLO created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSLO = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;
    const result = await Academic.updateSLO(id, { code, description });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'SLO not found' });
    res.json({ message: 'SLO updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteSLO = async (req, res) => {
  try {
    const { id } = req.params;
    await Academic.deleteSLO(id);
    res.json({ message: 'SLO deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
