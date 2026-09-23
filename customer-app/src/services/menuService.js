import api from './api';

const menuService = {
  getFullMenu: (restaurantId) => api.get(`/menu/${restaurantId}`),
};

export default menuService;
