import api from './api';

const orderService = {
  create: (data) => api.post('/orders', data),
  updateItems: (id, data) => api.patch(`/orders/${id}/items`, data),
  getAll: (
    restaurantId,
    status,
    { page = 1, limit = 10, search, sortBy, sortOrder, datePreset, fromDate, toDate, tableId } = {},
  ) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    if (status) params.append('status', status);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (datePreset) params.append('datePreset', datePreset);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (tableId) params.append('tableId', tableId);
    return api.get(`/orders?${params.toString()}`);
  },
  getOne: (id) => api.get(`/orders/${id}`),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
  getStats: (restaurantId, { datePreset, fromDate, toDate } = {}) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    if (datePreset) params.append('datePreset', datePreset);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    return api.get(`/orders/stats?${params.toString()}`);
  },
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.patch(`/orders/${id}/payment-status`, { paymentStatus }),
  updatePaymentMethod: (id, paymentMethod) => api.patch(`/orders/${id}/payment-method`, { paymentMethod }),
  cancelOrderItem: (id, { itemIndex, cancelQuantity, reason }) =>
    api.patch(`/orders/${id}/items/cancel`, {
      itemIndex,
      cancelQuantity,
      reason,
    }),
  remove: (id) => api.delete(`/orders/${id}`),
};

export default orderService;
