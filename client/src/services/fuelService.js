import api from './api';

export const fuelService = {
  getLogs: (params = {}) => api.get('/fuel-logs', { params }).then(r => r.data),
  createLog: (data) => api.post('/fuel-logs', data).then(r => r.data),
  getExpenses: (params = {}) => api.get('/expenses', { params }).then(r => r.data),
  createExpense: (data) => api.post('/expenses', data).then(r => r.data),
  getTotals: (params = {}) => api.get('/expenses/totals', { params }).then(r => r.data),
};
