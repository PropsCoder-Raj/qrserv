import api from './api';

const buildParams = (
  base,
  {
    page = 1,
    limit = 10,
    search,
    sortBy,
    sortOrder,
    datePreset,
    includeInactive,
  } = {},
) => {
  const params = new URLSearchParams(base);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (datePreset) params.append('datePreset', datePreset);
  if (includeInactive !== undefined) params.append('includeInactive', includeInactive);
  return params.toString();
};

const menuService = {
  getFullMenu: (restaurantId) => api.get(`/menu/${restaurantId}`),
  // Categories
  getCategories: (restaurantId, query) =>
    api.get(`/categories?${buildParams({ restaurantId }, query)}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.patch(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  // Menu Items
  getMenuItems: (restaurantId, categoryId, query) => {
    const base = { restaurantId };
    if (categoryId) base.categoryId = categoryId;
    return api.get(`/menu-items?${buildParams(base, query)}`);
  },
  createMenuItem: (data) => api.post('/menu-items', data),
  updateMenuItem: (id, data) => api.patch(`/menu-items/${id}`, data),
  uploadMenuItemImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/menu-items/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteMenuItem: (id) => api.delete(`/menu-items/${id}`),
};

export default menuService;
