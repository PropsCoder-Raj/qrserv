import api from './api';

const buildParams = (
  { page = 1, limit = 10, search, sortBy, sortOrder, status, organizationId, datePreset } = {},
) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (status) params.append('status', status);
  if (organizationId) params.append('organizationId', organizationId);
  if (datePreset) params.append('datePreset', datePreset);
  return params.toString();
};

const withdrawRequestService = {
  getAll: (query) => api.get(`/withdraw-requests?${buildParams(query)}`),
  getSummary: (organizationId) =>
    api.get(
      `/withdraw-requests/summary${
        organizationId ? `?organizationId=${organizationId}` : ''
      }`,
    ),
  getBankDetails: () => api.get('/withdraw-requests/bank-details'),
  createBankDetail: (data) => api.post('/withdraw-requests/bank-details', data),
  updateBankDetail: (id, data) => api.patch(`/withdraw-requests/bank-details/${id}`, data),
  deleteBankDetail: (id) => api.delete(`/withdraw-requests/bank-details/${id}`),
  create: (data) => api.post('/withdraw-requests', data),
  approve: (id, data) => api.patch(`/withdraw-requests/${id}/approve`, data),
  markPaid: (id, data, file) => {
    const formData = new FormData();
    formData.append('paymentReference', data.paymentReference || '');
    formData.append('paymentNote', data.paymentNote || '');
    if (file) {
      formData.append('file', file);
    }
    return api.patch(`/withdraw-requests/${id}/pay`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default withdrawRequestService;
