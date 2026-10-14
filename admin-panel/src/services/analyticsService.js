import api from './api';

const analyticsService = {
  getOrderAnalytics: ({ restaurantId, datePreset, startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurant_id', restaurantId);
    if (datePreset) params.append('datePreset', datePreset);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return api.get(`/v1/analytics/orders?${params.toString()}`);
  },
};

export default analyticsService;
