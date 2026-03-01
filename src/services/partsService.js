import api from './api';

const partsService = {
  // Get all parts (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/master/parts', { params });
    return response.data;
  },

  // Get all parts for dropdown
  getAllList: async () => {
    const response = await api.get('/master/parts/list/all');
    return response.data;
  },

  // Get unique categories
  getCategories: async () => {
    const response = await api.get('/master/parts/categories');
    return response.data;
  },

  // Get single part
  getById: async (id) => {
    const response = await api.get(`/master/parts/${id}`);
    return response.data;
  },

  // Create part
  create: async (data) => {
    const response = await api.post('/master/parts', data);
    return response.data;
  },

  // Update part
  update: async (id, data) => {
    const response = await api.put(`/master/parts/${id}`, data);
    return response.data;
  },

  // Delete part
  delete: async (id) => {
    const response = await api.delete(`/master/parts/${id}`);
    return response.data;
  },

   // ───────── NEW ENDPOINTS ───────────────────────

 getPartsWithStock: (params) => api.get(`/master/parts/with-stock`, { params }),

  // Get stock breakdown for a single part
  getPartStock: (id) => api.get(`/master/parts/${id}/stock`),

  // Get all serials for a specific part
  getPartSerials: (id, params) => api.get(`/master/parts/${id}/serials`, { params }),

  // Search parts for autocomplete (lightweight)
  searchParts: async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const response = await api.get(`/master/parts/list/all`);
    // Filter on client side since it's a small list
    const parts = response.data.data || [];
    return parts.filter(part =>
      part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
};

export default partsService;