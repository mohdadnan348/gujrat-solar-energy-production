import API from './api';

const unwrap = (response) => {
  const payload = response?.data;
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
};

const employeeService = {
  getAll: async () => unwrap(await API.get('/employees')) || [],

  create: async (data) => unwrap(await API.post('/employees', data)),

  update: async (id, data) => unwrap(await API.put(`/employees/${id}`, data)),

  deactivate: async (id) => unwrap(await API.delete(`/employees/${id}`)),
};

export default employeeService;
