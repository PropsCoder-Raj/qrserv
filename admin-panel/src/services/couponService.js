import api from './api';

const couponService = {
  getAll: (restaurantId) => api.get(`/coupons?restaurantId=${restaurantId}`),
  validate: (data) => api.post('/coupons/validate', data),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.patch(`/coupons/${id}`, data),
  remove: (id) => api.delete(`/coupons/${id}`),
};

export default couponService;
