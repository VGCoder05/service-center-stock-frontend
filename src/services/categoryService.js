import api from './api';

const categoryService = {
  // Categorize single serial
  categorize: async (serialId, data) => {
    const response = await api.put(`/categories/categorize/${serialId}`, data);
    return response.data;
  },

  // Bulk categorize
  bulkCategorize: async (data) => {
    const response = await api.put('/categories/bulk-categorize', data);
    return response.data;
  },

  // Get movement history
  getHistory: async (serialId) => {
    const response = await api.get(`/categories/history/${serialId}`);
    return response.data;
  },

  // Get serials by category
  getByCategory: async (category, params = {}) => {
    const response = await api.get(`/categories/${category}/serials`, { params });
    return response.data;
  },

  // Get category summary
  getSummary: async (params = {}) => {
    const response = await api.get('/categories/summary', { params });
    return response.data;
  },

  // Update payment status
  updatePayment: async (serialId, data) => {
    const response = await api.put(`/categories/payment/${serialId}`, data);
    return response.data;
  }
};

export default categoryService;