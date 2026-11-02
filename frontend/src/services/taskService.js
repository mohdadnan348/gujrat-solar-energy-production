import API from './api';

const taskService = {
  getAll: async (filters = '') => {
    const response = await API.get(`/tasks?${filters}`);
    return response.data.data;
  },
  getById: async (id) => {
    const response = await API.get(`/tasks/${id}`);
    return response.data.data;
  },
  create: async (data) => {
    const response = await API.post('/tasks', data);
    return response.data.data;
  },
  updateStatus: async (id, status, comment) => {
    const response = await API.put(`/tasks/${id}/status`, { status, comment });
    return response.data.data;
  },
  reassign: async (id, newEmployeeId) => {
    const response = await API.put(`/tasks/${id}/reassign`, { newEmployeeId });
    return response.data.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/tasks/${id}`);
    return response.data.data;
  },
};

export default taskService;