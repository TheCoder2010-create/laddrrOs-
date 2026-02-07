import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});

export const api = {
  // Health
  health: () => API.get('/api/health'),
  
  // Users
  getUsers: () => API.get('/api/users'),
  getUser: (id) => API.get(`/api/users/${id}`),
  
  // Dashboard
  getDashboard: (role) => API.get(`/api/dashboard/${role}`),
  
  // 1-on-1 Sessions
  getSessions: () => API.get('/api/one-on-one/sessions'),
  getSession: (id) => API.get(`/api/one-on-one/sessions/${id}`),
  createSession: (data) => API.post('/api/one-on-one/sessions', data),
  submitFeedback: (data) => API.post('/api/one-on-one/feedback', data),
  getBriefingPacket: (data) => API.post('/api/one-on-one/briefing-packet', data),
  
  // Critical Cases
  getCriticalCases: () => API.get('/api/critical-cases'),
  getCriticalCase: (id) => API.get(`/api/critical-cases/${id}`),
  criticalCaseAction: (id, data) => API.post(`/api/critical-cases/${id}/action`, data),
  
  // Nets
  startNets: (data) => API.post('/api/nets/start', data),
  netsChat: (data) => API.post('/api/nets/chat', data),
  getNetsNudge: (data) => API.post('/api/nets/nudge', data),
  endNets: (data) => API.post('/api/nets/end', data),
  suggestScenario: (data) => API.post('/api/nets/suggest-scenario', data),
  getNetsSessions: () => API.get('/api/nets/sessions'),
  
  // Coaching
  getGoals: (userId) => API.get(`/api/coaching/goals${userId ? `?user_id=${userId}` : ''}`),
  createGoal: (data) => API.post('/api/coaching/goals', data),
  acceptGoal: (id, data) => API.put(`/api/coaching/goals/${id}/accept`, data),
  declineGoal: (id, data) => API.put(`/api/coaching/goals/${id}/decline`, data),
  updateGoalProgress: (id, data) => API.put(`/api/coaching/goals/${id}/update`, data),
  getCoachingFeedback: (data) => API.post('/api/coaching/feedback', data),
  amReviewGoal: (id, data) => API.put(`/api/coaching/goals/${id}/am-review`, data),
  
  // KPI
  getFrameworks: () => API.get('/api/kpi/frameworks'),
  createFramework: (data) => API.post('/api/kpi/frameworks', data),
  
  // Nominations
  getNominations: () => API.get('/api/nominations'),
  createNomination: (data) => API.post('/api/nominations', data),
  
  // Surveys
  getSurveys: () => API.get('/api/surveys'),
  createSurvey: (data) => API.post('/api/surveys', data),
  deploySurvey: (id, data) => API.put(`/api/surveys/${id}/deploy`, data),
  respondToSurvey: (id, data) => API.post(`/api/surveys/${id}/respond`, data),
  analyzeSurvey: (id) => API.post(`/api/surveys/${id}/analyze`),
  generatePulse: (id) => API.post(`/api/surveys/${id}/leadership-pulse`),
  sendPulse: (id, data) => API.post(`/api/surveys/${id}/send-pulse`, data),
  finalAnalysis: (id) => API.post(`/api/surveys/${id}/final-analysis`),
  
  // Messages
  getMessages: (role) => API.get(`/api/messages${role ? `?role=${role}` : ''}`),
  respondToMessage: (id, data) => API.put(`/api/messages/${id}/respond`, data),
  
  // Insights
  getInsights: (userId) => API.get(`/api/insights${userId ? `?user_id=${userId}` : ''}`),
  
  // Performance Chat
  performanceChat: (data) => API.post('/api/performance-chat', data),
  
  // Coaching Assignment
  assignCoaching: (data) => API.post('/api/coaching/assign', data),
};

export default api;
