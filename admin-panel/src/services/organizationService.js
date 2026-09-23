import api from './api';

const buildParams = (
  { page = 1, limit = 10, search, sortBy, sortOrder, datePreset, restaurantId } = {},
) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (datePreset) params.append('datePreset', datePreset);
  if (restaurantId) params.append('restaurantId', restaurantId);
  return params.toString();
};

const organizationService = {
  getAll: (query) => api.get(`/organizations?${buildParams(query)}`),
  getMy: () => api.get('/organizations/my'),
  getOne: (id) => api.get(`/organizations/${id}`),
  getOrderSummary: (id, query) =>
    api.get(`/organizations/${id}/order-summary?${buildParams(query)}`),
  getRazorpayOrders: (id, query) =>
    api.get(`/organizations/${id}/razorpay-orders?${buildParams(query)}`),
  getRazorpayPaymentDetails: (id, paymentId) =>
    api.get(`/organizations/${id}/razorpay-payment/${paymentId}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.patch(`/organizations/${id}`, data),
  delete: (id) => api.delete(`/organizations/${id}`),
  getRestaurants: (id, query) => api.get(`/organizations/${id}/restaurants?${buildParams(query)}`),
};

export default organizationService;
