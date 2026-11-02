import api from './api';

const alertService = {
  callWaiter: ({ restaurantId, tableId }) =>
    api.post('/waiter-calls', { restaurantId, tableId }),
};

export default alertService;
