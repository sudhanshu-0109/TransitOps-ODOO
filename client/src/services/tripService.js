import api from './api';

export const tripService = {
  getAll: (params = {}) => api.get('/trips', { params }).then(r => r.data),
  getById: (id) => api.get(`/trips/${id}`).then(r => r.data),
  create: (data) => api.post('/trips', data).then(r => r.data),
  dispatch: (id, data) => api.patch(`/trips/${id}/dispatch`, data).then(r => r.data),
  complete: (id, data) => api.patch(`/trips/${id}/complete`, data).then(r => r.data),
  cancel: (id, data) => api.patch(`/trips/${id}/cancel`, data).then(r => r.data),
};
