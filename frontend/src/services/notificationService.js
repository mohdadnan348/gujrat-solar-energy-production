import API from './api';

const unwrap = (response) => {
  const payload = response?.data;
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
};

const notificationService = {
  send: async (data) => unwrap(await API.post('/notifications', data)),
  getMyNotifications: async () => unwrap(await API.get('/notifications/my')),
  markAsRead: async (id) => unwrap(await API.put(`/notifications/${id}/read`)),
  getSentHistory: async () => unwrap(await API.get('/notifications/sent')) || [],
  delete: async (id) => unwrap(await API.delete(`/notifications/${id}`)),
};

export default notificationService;
