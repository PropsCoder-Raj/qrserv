import api from './api';

const analyticsService = {
  getOrderAnalytics: ({
    restaurantId,
    datePreset,
    startDate,
    endDate,
    paymentStatus,
    fulfillmentMethod,
  } = {}) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurant_id', restaurantId);
    if (datePreset) params.append('datePreset', datePreset);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (paymentStatus && paymentStatus !== 'all') {
      params.append('payment_status', paymentStatus);
    }
    if (fulfillmentMethod && fulfillmentMethod !== 'all') {
      params.append('fulfillment_method', fulfillmentMethod);
    }
    return api.get(`/v1/analytics/orders?${params.toString()}`);
  },
};

export default analyticsService;
