import api from './api';

const subscriptionService = {
  getAll: ({ page = 1, limit = 10, search, sortBy, sortOrder } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    return api.get(`/subscriptions?${params.toString()}`);
  },
  getOne: (id) => api.get(`/subscriptions/${id}`),
  create: (data) => api.post('/subscriptions', data),
  update: (id, data) => api.patch(`/subscriptions/${id}`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
  assign: (data) => api.post('/subscriptions/assign', data),
  getPlans: () => api.get('/subscriptions/plans'),
  purchase: (subscriptionId, months = 1, autoPay = false) =>
    api.post('/subscriptions/purchase', { subscriptionId, months, autoPay }),
  getMyHistory: () => api.get('/subscriptions/my-history'),
  getMyActivePlan: () => api.get('/subscriptions/my-active-plan'),
  createOrder: (subscriptionId, months = 1, autoPay = false) =>
    api.post('/subscriptions/create-order', { subscriptionId, months, autoPay }),
  createAutopaySubscription: (subscriptionId, months = 1) =>
    api.post('/subscriptions/create-autopay-subscription', { subscriptionId, months }),
  verifyPayment: (data) => api.post('/subscriptions/verify-payment', data),
  setMyAutoPay: (enabled) => api.patch('/subscriptions/my-auto-pay', { enabled }),
  getAllHistory: (
    { page = 1, limit = 20, search, status, paymentStatus, datePreset } = {},
  ) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (paymentStatus) params.append('paymentStatus', paymentStatus);
    if (datePreset) params.append('datePreset', datePreset);
    return api.get(`/subscriptions/all-history?${params.toString()}`);
  },
  getPlanAnalytics: () => api.get('/subscriptions/analytics/plans'),
};

export default subscriptionService;
