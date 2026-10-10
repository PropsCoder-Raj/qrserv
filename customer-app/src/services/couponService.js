import api from './api';

const couponService = {
  validate: (data) => api.post('/coupons/validate', data),
};

export default couponService;
