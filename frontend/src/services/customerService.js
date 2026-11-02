import API from './api';

const customerService = {
  getAll: async (search = '') => {
    const response = await API.get(`/customers?search=${search}`);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await API.get(`/customers/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await API.post('/customers', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/customers/${id}`, data);
    return response.data.data;
  },
};

export default customerService;