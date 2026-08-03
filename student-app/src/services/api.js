import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Attach student token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 redirect to student login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const questionService = {
  getPractice: (params) => api.get('/questions/practice/list', { params })
};

export const studentAnswerService = {
  submit: (data) => api.post('/student-answers/submit', data),
  getMyResults: () => api.get('/student-answers/my-results')
};

export const academicService = {
  getYears: () => api.get('/academic/years'),
  getSubjects: (params) => api.get('/academic/subjects', { params }),
  getTopics: (params) => api.get('/academic/topics', { params }),
  getCLOs: (params) => api.get('/academic/clos', { params }),
  getSLOs: (params) => api.get('/academic/slos', { params })
};

export const assessmentService = {
  getAssessmentDetails: (id) => api.get(`/assessments/${id}`),
  startAssessment: (id) => api.post(`/assessments/${id}/start`),
  getAvailableAssessments: () => api.get('/assessments/available')
};
