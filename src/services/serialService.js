import api from './api';

const serialService = {
  // Get all serials (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/serials', { params });
    return response.data;
  },

  // Get serials by bill ID
  getByBillId: async (billId) => {
    const response = await api.get(`/serials/bill/${billId}`);
    return response.data;
  },

  // Get single serial by ID
  getById: async (id) => {
    const response = await api.get(`/serials/${id}`);
    return response.data;
  },

  // Get serial by serial number string
  getBySerialNumber: async (serialNumber) => {
    const response = await api.get(`/serials/sn/${serialNumber}`);
    return response.data;
  },

  // Check if serial exists
  checkExists: async (serialNumber) => {
    const response = await api.get(`/serials/check/${serialNumber}`);
    return response.data;
  },

  // Create single serial
  create: async (data) => {
    const response = await api.post('/serials', data);
    return response.data;
  },

  // Create bulk serials
  createBulk: async (data) => {
    const response = await api.post('/serials/bulk', data);
    return response.data;
  },

  // Update serial
  update: async (id, data) => {
    const response = await api.put(`/serials/${id}`, data);
    return response.data;
  },

  // Delete serial
  delete: async (id) => {
    const response = await api.delete(`/serials/${id}`);
    return response.data;
  }
};

export default serialService;