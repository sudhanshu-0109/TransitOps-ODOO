import api from './api';

export const driverService = {
  getAll: (params = {}) => api.get('/drivers', { params }).then(r => r.data),
  getById: (id) => api.get(`/drivers/${id}`).then(r => r.data),
  create: (data) => api.post('/drivers', data).then(r => r.data),
  update: (id, data) => api.put(`/drivers/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }).then(r => r.data),
};
