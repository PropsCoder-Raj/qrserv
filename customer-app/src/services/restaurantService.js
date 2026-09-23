import api from './api';

const restaurantService = {
  getBySlug: (slug) => api.get(`/restaurants/slug/${slug}`),
  getPublicInfo: (id) => api.get(`/restaurants/${id}/info`),
};

export default restaurantService;
