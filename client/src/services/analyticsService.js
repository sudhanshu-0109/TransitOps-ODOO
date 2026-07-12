import api from './api';

export const analyticsService = {
  get: (params = {}) => api.get('/analytics', { params }).then(r => r.data),
  getDashboard: () => api.get('/dashboard').then(r => r.data),
  exportCSV: (params = {}) => api.get('/analytics/export.csv', { params, responseType: 'blob' }).then(r => r.data),
};
