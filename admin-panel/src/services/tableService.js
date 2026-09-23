import api from './api';

const tableService = {
  getAll: (
    restaurantId,
    { page = 1, limit = 10, search, sortBy, sortOrder, datePreset } = {},
  ) => {
    const params = new URLSearchParams();
    params.append('restaurantId', restaurantId);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (datePreset) params.append('datePreset', datePreset);
    return api.get(`/tables?${params.toString()}`);
  },
  getOne: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.patch(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
};

export default tableService;
