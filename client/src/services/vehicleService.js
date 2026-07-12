import api from './api';

export const vehicleService = {
  getAll: (params = {}) => api.get('/vehicles', { params }).then(r => r.data),
  getById: (id) => api.get(`/vehicles/${id}`).then(r => r.data),
  getTimeline: (id) => api.get(`/vehicles/${id}/timeline`).then(r => r.data),
  create: (data) => api.post('/vehicles', data).then(r => r.data),
  update: (id, data) => api.put(`/vehicles/${id}`, data).then(r => r.data),
  retire: (id) => api.patch(`/vehicles/${id}/retire`).then(r => r.data),
  delete: (id) => api.delete(`/vehicles/${id}`).then(r => r.data),
};
