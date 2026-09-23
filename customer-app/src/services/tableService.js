import api from './api';

const tableService = {
  getPublicInfo: (id) => api.get(`/tables/${id}/info`),
};

export default tableService;
