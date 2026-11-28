import api from './api';

const designService = {
  getByRestaurant: (restaurantId) => api.get(`/design/${restaurantId}`),
  save: (restaurantId, payload) => api.put(`/design/${restaurantId}`, payload),
  reset: (restaurantId) => api.post(`/design/${restaurantId}/reset`),
};

export default designService;
