import api from './api';

const designService = {
  getByRestaurant: (restaurantId) => api.get(`/design/${restaurantId}`),
};

export default designService;
