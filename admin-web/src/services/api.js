import axios from 'axios';

// Create a configured axios instance
const api = axios.create({
  baseURL: 'http://localhost:8081/api', // Points to our Express backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend returns 401 Unauthorized (e.g., token expired)
      // Clear storage and force the user to login again
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Prevent infinite loops or instant redirects if already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
