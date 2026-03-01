import api from './api';

const importService = {
  // Validate parsed data (dry run)
  validate: async (bills) => {
    const response = await api.post('/import/validate', { bills });
    return response.data;
  },

  // Execute import
  importExcel: async (bills) => {
    const response = await api.post('/import/excel', { bills });
    return response.data;
  }
};

export default importService;