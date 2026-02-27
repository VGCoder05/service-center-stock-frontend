import api from './api';

const dashboardService = {
  // Get dashboard summary
  getSummary: async (params = {}) => {
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },

  // Get alerts
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },

  // Get recent activity
  getActivity: async (params = {}) => {
    const response = await api.get('/dashboard/activity', { params });
    return response.data;
  },

  // Get quick stats
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export default dashboardService;