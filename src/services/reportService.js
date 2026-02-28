import api from './api';

const reportService = {
  // Get stock valuation
  getStockValuation: async (params = {}) => {
    const response = await api.get('/reports/valuation', { params });
    return response.data;
  },

  // Export stock valuation (Removed blob, returns JSON)
  exportStockValuation: async (params = {}) => {
    const response = await api.get('/reports/valuation/export', { params });
    return response.data; 
  },

  // Get IN_STOCK by bill
  getInStockByBill: async (params = {}) => {
    const response = await api.get('/reports/in-stock', { params });
    return response.data;
  },

  // Export IN_STOCK by bill (Removed blob, returns JSON)
  exportInStockByBill: async (params = {}) => {
    const response = await api.get('/reports/in-stock/export', { params });
    return response.data;
  },

  // Get SPU report
  getSPUReport: async (params = {}) => {
    const response = await api.get('/reports/spu', { params });
    return response.data;
  },

  // Export SPU report (Removed blob, returns JSON)
  exportSPUReport: async (params = {}) => {
    const response = await api.get('/reports/spu/export', { params });
    return response.data;
  },

  // Get category report
  getCategoryReport: async (category, params = {}) => {
    const response = await api.get(`/reports/category/${category}`, { params });
    return response.data;
  }
};

// Helper function to trigger file download
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default reportService;