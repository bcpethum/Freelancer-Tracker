import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token from localStorage
API.interceptors.request.use(config => {
  const token = localStorage.getItem('ft_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ft_token');
      localStorage.removeItem('ft_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
