import axios from 'axios';
import { getStoredToken } from './authService';

// Change this to your backend IP when testing on a physical device
<<<<<<< Updated upstream
const BASE_URL = 'http://10.189.171.56:8081/api';
=======
const BASE_URL = 'http://192.168.1.4:8081/api';
>>>>>>> Stashed changes

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
