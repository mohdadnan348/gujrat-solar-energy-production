import API from './api';

const unwrap = (response) => {
  const payload = response?.data;
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
};

const leaveService = {
  // Employee
  applyLeave: async (data) => unwrap(await API.post('/leaves', data)),
  getMyLeaves: async () => unwrap(await API.get('/leaves/my')) || [],

  // Admin
  getAllLeaves: async () => unwrap(await API.get('/leaves')) || [],
  updateLeaveStatus: async (id, data) =>
    unwrap(await API.put(`/leaves/${id}/status`, data)),
};

export default leaveService;
