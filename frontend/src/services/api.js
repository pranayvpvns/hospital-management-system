import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Auth interceptor
api.interceptors.request.use((req) => {
  const token = localStorage.getItem('mnh_token');
  if (token && token !== 'null' && token !== 'undefined') {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const originalRequestUrl = error.config?.url || '';
      if (!originalRequestUrl.includes('/auth/login') && !originalRequestUrl.includes('/auth/register')) {
        localStorage.removeItem('mnh_token');
        localStorage.removeItem('mnh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/me'),
  switchRole: (role) => api.post('/auth/switch-role', { role }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Patients
export const patientAPI = {
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  getAll: () => api.get('/patients/all'),
  register: (data) => api.post('/patients/register', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
};

// Appointments
export const appointmentAPI = {
  getAll: () => api.get('/appointments/all'),
  getMine: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
  getSlots: (doctorId, date) => api.get(`/appointments/slots?doctor_id=${doctorId}&date=${date}`),
};

// Hospital
export const hospitalAPI = {
  getStaff: () => api.get('/hospital/staff'),
  getDepartments: () => api.get('/hospital/departments'),
  getDoctors: (department) => api.get(`/hospital/doctors?department=${department}`),
  addStaff: (data) => api.post('/hospital/staff', data),
  updateStaff: (id, data) => api.put(`/hospital/staff/${id}`, data),
  getBeds: () => api.get('/hospital/beds'),
  updateBed: (id, data) => api.put(`/hospital/beds/${id}`, data),
  getEquipment: () => api.get('/hospital/equipment'),
  updateEquipment: (id, data) => api.put(`/hospital/equipment/${id}`, data),
  getMedicines: () => api.get('/hospital/medicines'),
  addMedicine: (data) => api.post('/hospital/medicines', data),
  bulkAddMedicines: (formData) => api.post('/hospital/medicines/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateMedicine: (id, data) => api.put(`/hospital/medicines/${id}`, data),
  getExpiringMedicines: () => api.get('/hospital/medicines/expiring'),
};

// Billing
export const billingAPI = {
  generate: (data) => api.post('/billing/generate', data),
  getAll: () => api.get('/billing/all'),
  getMine: () => api.get('/billing'),
  getById: (id) => api.get(`/billing/${id}`),
};

// Payments
export const paymentAPI = {
  process: (data) => api.post('/payments/process', data),
  getById: (id) => api.get(`/payments/${id}`),
  getForBill: (billingId) => api.get(`/payments/billing/${billingId}`),
};

// Finance
export const financeAPI = {
  getSummary: () => api.get('/finance/summary'),
  getDepartmentAnalytics: () => api.get('/finance/department-analytics'),
  getRecords: () => api.get('/finance/records'),
  addRecord: (data) => api.post('/finance/records', data),
};

// Predictions
export const predictionAPI = {
  getPatientInflow: () => api.get('/predictions/patient-inflow'),
  getRevenue: () => api.get('/predictions/revenue'),
  getDiseaseTrends: () => api.get('/predictions/disease-trends'),
  getResourceDemand: () => api.get('/predictions/resource-demand'),
  predictDisease: (symptoms) => api.post('/predictions/predict-disease', { symptoms }),
  predictInflow: (date) => api.post('/predictions/predict-inflow', { date }),
};

// Agents
export const agentAPI = {
  trigger: (scenario) => api.post('/agents/trigger', { scenario }),
  getActivity: (limit = 20) => api.get(`/agents/activity?limit=${limit}`),
  getProfiles: () => api.get('/agents/profiles'),
  chat: (query, frontendState = null) => api.post('/agents/chat', { query, frontend_state: frontendState }),
};

// Reports
export const reportAPI = {
  getAll: () => api.get('/reports'),
  create: (data) => api.post('/reports', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications/'),
  markAllRead: () => api.put('/notifications/mark-read'),
  markOneRead: (id) => api.put(`/notifications/${id}/mark-read`),
};

export function extractData(response, key) {
  // Safely extract deeply nested data object if present, else fallback
  return response?.data?.data?.[key] || response?.data?.[key] || [];
}

export default api;
