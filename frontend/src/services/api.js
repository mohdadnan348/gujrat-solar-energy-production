import axios from 'axios';

// Set VITE_API_URL in frontend .env, e.g.:
// VITE_API_URL=http://localhost:4000/api
// In production, set it to your deployed backend API URL.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not clear the login session or force a redirect for every 401.
    // A quotation update or another protected API can return 401 for a
    // resource/permission issue; the page should display that API error
    // instead of unexpectedly logging the user out.
    //
    // Keep the current token and let the calling page handle the error.
    // This prevents an unrelated request from destroying a valid session.
    return Promise.reject(error);
  },
);

export default API;
