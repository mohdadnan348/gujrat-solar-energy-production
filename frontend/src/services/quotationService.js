import API from './api';

const quotationService = {
  getAll: async () => {
    const response = await API.get('/quotations');
    return response.data.data;
  },
  getById: async (id) => {
    const response = await API.get(`/quotations/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await API.post('/quotations', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/quotations/${id}`, data);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await API.put(`/quotations/${id}/status`, { status });
    return response.data.data;
  },
  downloadPDF: async (id) => {
    const response = await API.get(`/quotations/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default quotationService;