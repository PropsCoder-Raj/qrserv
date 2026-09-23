import api from './api';

const buildParams = (
  { page = 1, limit = 10, search, sortBy, sortOrder, datePreset } = {},
) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (datePreset) params.append('datePreset', datePreset);
  return params.toString();
};

const restaurantService = {
  getAll: (query) => api.get(`/restaurants?${buildParams(query)}`),
  getMy: (query) => api.get(`/restaurants/my?${buildParams(query)}`),
  getOne: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.patch(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  uploadMenuPdf: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/restaurants/${id}/menu-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default restaurantService;
