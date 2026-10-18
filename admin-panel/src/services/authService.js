import api from './api';

const authService = {
  login: (data) => api.post('/auth/login', data),
  loginCaptain: (data) => api.post('/auth/login-captain', data),
  loginKitchen: (data) => api.post('/auth/login-kitchen', data),
  loginManager: (data) => api.post('/auth/login-manager', data),
  loginStaff: (data) => api.post('/auth/login-staff', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export default authService;
