import api from './api';

const orderStatisticsService = {
  reset: () => api.post('/order-statistics/reset'),
};

export default orderStatisticsService;
