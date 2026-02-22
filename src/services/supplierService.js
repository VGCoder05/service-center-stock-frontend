import api from './api';

const supplierService = {
  // Get all suppliers (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/master/suppliers', { params });
    return response.data;
  },

  // Get all suppliers for dropdown
  getAllList: async () => {
    const response = await api.get('/master/suppliers/list/all');
    return response.data;
  },

  // Get single supplier
  getById: async (id) => {
    const response = await api.get(`/master/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  create: async (data) => {
    const response = await api.post('/master/suppliers', data);
    return response.data;
  },

  // Update supplier
  update: async (id, data) => {
    const response = await api.put(`/master/suppliers/${id}`, data);
    return response.data;
  },

  // Delete supplier
  delete: async (id) => {
    const response = await api.delete(`/master/suppliers/${id}`);
    return response.data;
  }
};

export default supplierService;