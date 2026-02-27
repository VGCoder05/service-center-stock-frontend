import api from './api';

const billService = {
  // Get all bills (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/bills', { params });
    return response.data;
  },

  // Get single bill
  getById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },

  // Get bill by voucher number
  getByVoucher: async (voucherNumber) => {
    const response = await api.get(`/bills/voucher/${voucherNumber}`);
    return response.data;
  },

  // Create bill
  create: async (data) => {
    const response = await api.post('/bills', data);
    return response.data;
  },

  // Update bill
  update: async (id, data) => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },

  // Delete bill
  delete: async (id) => {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },

  // Get bill statistics
  getStats: async (params = {}) => {
    const response = await api.get('/bills/stats/summary', { params });
    return response.data;
  }
};

export default billService;