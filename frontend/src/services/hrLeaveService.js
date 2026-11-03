import API from './api';

const unwrap = (response) => {
  const payload = response?.data;
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
};

// HR-specific service. It uses the shared protected API; backend scopes HR to ownerHR.
const hrLeaveService = {
  getTeamLeaves: async () => unwrap(await API.get('/leaves')) || [],
  updateLeaveStatus: async (id, data) =>
    unwrap(await API.put(`/leaves/${id}/status`, data)),
};

export default hrLeaveService;
