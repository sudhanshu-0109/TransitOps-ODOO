import api from './api';

export const maintenanceService = {
  getAll: (params = {}) => api.get('/maintenance', { params }).then(r => r.data),
  create: (data) => api.post('/maintenance', data).then(r => r.data),
  close: (id) => api.patch(`/maintenance/${id}/close`).then(r => r.data),
};
