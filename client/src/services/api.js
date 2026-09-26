import axios from 'axios';

// Dynamically resolve base API URL
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // If env URL points to localhost, but the user is accessing via cloud deployment (*.run.app)
    // NEVER point to localhost because the remote browser cannot access port 5000 on the local machine!
    if (!isLocalhost && envUrl && envUrl.includes('localhost')) {
      return '/api';
    }

    // In full-stack mode (Express + Vite) or standard relative API, use /api on same host
    if (!envUrl || envUrl.trim() === '' || envUrl === '/api') {
      return '/api';
    }

    return envUrl;
  }

  return envUrl || '/api';
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// In-memory token holder to avoid circular dependencies
let currentToken = null;

export const setAuthToken = (token) => {
  currentToken = token;
};

// Request interceptor: Attach Firebase Bearer ID Token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = currentToken || sessionStorage.getItem('utsanova_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract response data and normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const status = error.response?.status;

    // Handle 401 Unauthorized redirect to login if on admin route
    if (status === 401 && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      sessionStorage.removeItem('utsanova_auth_token');
      sessionStorage.removeItem('utsanova_admin_user');
      window.location.href = '/admin/login';
    }

    return Promise.reject({
      status,
      message,
      originalError: error,
    });
  }
);

export default api;
