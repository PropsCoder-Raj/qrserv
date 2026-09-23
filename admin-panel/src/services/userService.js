import api from './api';

const userService = {
  getAll: (
    restaurantId,
    { page = 1, limit = 10, search, sortBy, sortOrder, datePreset } = {},
  ) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (datePreset) params.append('datePreset', datePreset);
    return api.get(`/users?${params.toString()}`);
  },
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default userService;
