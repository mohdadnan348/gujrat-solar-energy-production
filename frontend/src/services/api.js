
import axios from 'axios';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://gujrat-solar-energy-production.onrender.com/api'
    : 'http://localhost:4000/api')
).replace(/\/+$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default API;
