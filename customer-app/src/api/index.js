import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach customer JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: clear token (but don't redirect — menu is public)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_info');
    }
    return Promise.reject(err);
  }
);

// ── Public ────────────────────────────────────────────────────
export const getPublicMenu = (restaurantSlug, tableId = null) =>
  api.get(`/api/public/menu/${restaurantSlug}${tableId ? `?tableId=${tableId}` : ''}`);

// ── Customer Auth ─────────────────────────────────────────────
export const sendOtp = (phoneNumber) =>
  api.post('/api/customer/auth/send-otp', { phoneNumber });

export const verifyOtp = (phoneNumber, otp, name) =>
  api.post('/api/customer/auth/verify-otp', { phoneNumber, otp, name });

// ── Orders ────────────────────────────────────────────────────
export const placeOrder = (data) =>
  api.post('/api/orders', data);

export const getOrder = (orderId) =>
  api.get(`/api/orders/${orderId}`);

export const getSessionOrders = (tableId) =>
  api.get(`/api/orders/session/${tableId}`);

export const requestBill = (tableId) =>
  api.post(`/api/orders/request-bill`, { tableId });

export default api;

