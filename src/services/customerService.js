import api from './api';

const customerService = {
  // Get all customers (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/master/customers', { params });
    return response.data;
  },

  // Get all customers for dropdown
  getAllList: async () => {
    const response = await api.get('/master/customers/list/all');
    return response.data;
  },

  // Get single customer
  getById: async (id) => {
    const response = await api.get(`/master/customers/${id}`);
    return response.data;
  },

  // Create customer
  create: async (data) => {
    const response = await api.post('/master/customers', data);
    return response.data;
  },

  // Update customer
  update: async (id, data) => {
    const response = await api.put(`/master/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  delete: async (id) => {
    const response = await api.delete(`/master/customers/${id}`);
    return response.data;
  }
};

export default customerService;