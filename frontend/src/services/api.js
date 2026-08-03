import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile')
};

// Questions Service
export const questionService = {
  create: (data) => api.post('/questions', data),
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  getByYear: (year, params) => api.get(`/questions/year/${year}`, { params }),
  getBySubject: (subject, params) => api.get(`/questions/subject/${subject}`, { params }),
  getByCreator: (params) => api.get('/questions/my-questions/list', { params }),
  getPending: () => api.get('/questions/pending/all'),
  getVetted: () => api.get('/questions/vetted/all'),
  getStats: () => api.get('/questions/stats/summary'),
  getPractice: (params) => api.get('/questions/practice/list', { params }),
  getUsage: (id) => api.get(`/questions/${id}/usage`),
  getUsageHistory: (id) => api.get(`/questions/${id}/usage-history`),
  addUsageHistory: (id, data) => api.post(`/questions/${id}/usage-history`, data),
  deleteUsageHistory: (usageId) => api.delete(`/questions/usage-history/${usageId}`),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  submitForReview: (id) => api.put(`/questions/${id}/submit-for-review`),
  archive: (id) => api.put(`/questions/${id}/archive`),
  batchImport: (data) => api.post('/questions/batch/import', data, { timeout: 120000 })
};

// Reviews Service
export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getByQuestion: (questionId) => api.get(`/reviews/question/${questionId}`),
  getForReviewer: () => api.get('/reviews'),
  getPending: () => api.get('/reviews/pending'),
  update: (id, data) => api.put(`/reviews/${id}`, data)
};

// Student Answers Service
export const studentAnswerService = {
  submit: (data) => api.post('/student-answers/submit', data),
  getMyAnswers: (params) => api.get('/student-answers/my-answers', { params }),
  getMyResults: () => api.get('/student-answers/my-results'),
  getMyStats: () => api.get('/student-answers/my-stats')
};

// Users Service
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  approve: (id) => api.put(`/users/${id}/approve`),
  delete: (id) => api.delete(`/users/${id}`)
};

// Academic Structure Service
export const academicService = {
  // Years
  getYears: () => api.get('/academic/years'),
  createYear: (data) => api.post('/academic/years', data),
  updateYear: (id, data) => api.put(`/academic/years/${id}`, data),
  deleteYear: (id) => api.delete(`/academic/years/${id}`),
  
  // Subjects
  getSubjects: (params) => api.get('/academic/subjects', { params }),
  createSubject: (data) => api.post('/academic/subjects', data),
  updateSubject: (id, data) => api.put(`/academic/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/academic/subjects/${id}`),
  
  // Topics
  getTopics: (params) => api.get('/academic/topics', { params }),
  createTopic: (data) => api.post('/academic/topics', data),
  updateTopic: (id, data) => api.put(`/academic/topics/${id}`, data),
  deleteTopic: (id) => api.delete(`/academic/topics/${id}`),
  
  // CLOs (Course Learning Outcomes)
  getCLOs: (params) => api.get('/academic/clos', { params }),
  createCLO: (data) => api.post('/academic/clos', data),
  updateCLO: (id, data) => api.put(`/academic/clos/${id}`, data),
  deleteCLO: (id) => api.delete(`/academic/clos/${id}`),
  
  // SLOs (Student Learning Outcomes)
  getSLOs: (params) => api.get('/academic/slos', { params }),
  createSLO: (data) => api.post('/academic/slos', data),
  updateSLO: (id, data) => api.put(`/academic/slos/${id}`, data),
  deleteSLO: (id) => api.delete(`/academic/slos/${id}`)
};

// Assessments Service
export const assessmentService = {
  list: (params) => api.get('/assessments', { params }),
  getById: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data),
  update: (id, data) => api.put(`/assessments/${id}`, data),
  remove: (id) => api.delete(`/assessments/${id}`),
  startAttempt: (id) => api.post(`/assessments/${id}/start`),
  submitAttempt: (id, data) => api.post(`/assessments/${id}/submit`, data),
  getAttempts: (id) => api.get(`/assessments/${id}/attempts`),
  myAttempts: () => api.get('/assessments/my-attempts'),
  getReview: (assessmentId, attemptId) => api.get(`/assessments/${assessmentId}/review/${attemptId}`),
  getDashboardStats: () => api.get('/assessments/stats/dashboard'),
  getGradebook: () => api.get('/assessments/gradebook'),
  listAnnouncements: () => api.get('/assessments/announcements'),
  createAnnouncement: (data) => api.post('/assessments/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/assessments/announcements/${id}`),
  toggleAnnouncementPin: (id) => api.put(`/assessments/announcements/${id}/pin`)
};

export default api;


