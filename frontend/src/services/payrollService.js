import API from './api';

const payrollService = {
  generate: async (data) => {
    const response = await API.post('/payroll/generate', data);
    return response.data.data;
  },
  getAll: async (filters = '') => {
    const response = await API.get(`/payroll?${filters}`);
    return response.data.data;
  },
  getMySalary: async () => {
    const response = await API.get('/payroll/my');
    return response.data.data;
  },
  finalize: async (id) => {
    const response = await API.put(`/payroll/${id}/finalize`);
    return response.data.data;
  },
};

export default payrollService;