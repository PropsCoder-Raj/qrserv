import api from './api';

const authService = {
  login: (data) => api.post('/auth/login', data),
  loginManager: (data) => api.post('/auth/login-manager', data),
  loginStaff: (data) => api.post('/auth/login-staff', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export default authService;
