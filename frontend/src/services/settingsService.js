import API from './api';

const unwrapSettings = (response) => {
  // ApiResponse shape: { statusCode, data, message, success }
  const payload = response?.data;
  if (payload?.data !== undefined) return payload.data;
  if (payload?.data?.data !== undefined) return payload.data.data;
  return payload;
};

const settingsService = {
  getSettings: async () => {
    const response = await API.get('/settings');
    return unwrapSettings(response);
  },

  updateSettings: async (data) => {
    const response = await API.put('/settings', data);
    return unwrapSettings(response);
  },
};

export default settingsService;
