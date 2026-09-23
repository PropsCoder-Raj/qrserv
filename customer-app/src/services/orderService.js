import api from './api';

const orderService = {
  create: (data) => api.post('/orders', data),
  createForCustomer: (data) => api.post('/orders/customer/create', data),
  rollbackFailedPaymentOrder: (orderId, razorpayOrderId) =>
    api.post('/orders/customer/rollback-failed', { orderId, razorpayOrderId }),
  updateCustomerItems: (id, items) =>
    api.patch(`/orders/customer/${id}/items`, { items }),
  getStatus: (id) => api.get(`/orders/${id}/status`),
  getHistory: (phone) => api.get(`/orders/history/${phone}`),
};

export default orderService;
