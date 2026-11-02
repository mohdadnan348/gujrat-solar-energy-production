import API from './api';

const leadService = {
  getAll: async (filters = '') => {
    const response = await API.get(`/leads?${filters}`);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await API.get(`/leads/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await API.post('/leads', data);
    return response.data.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/leads/${id}`, data);
    return response.data.data;
  },
  assign: async (id, employeeId) => {
    const response = await API.put(`/leads/${id}/assign`, { employeeId });
    return response.data.data;
  },
};

export default leadService;