import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',  // This will use the Vite proxy configuration
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't use withCredentials with proxy setup
  withCredentials: false
});

// Get auth token from session storage
const getAuthToken = () => {
  const auth = sessionStorage.getItem('auth');
  return auth ? JSON.parse(auth).token : null;
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      sessionStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  // User endpoints
  user: {
    profile: '/users/profile',
    update: '/users/update',
  },
  // Vehicle endpoints
  vehicles: {
    list: '/vehicles',
    details: (id) => `/vehicles/${id}`,
    create: '/vehicles',
    update: (id) => `/vehicles/${id}`,
    delete: (id) => `/vehicles/${id}`,
  },
  // Rental endpoints
  rentals: {
    create: '/rentals',
    list: '/rentals',
    details: (id) => `/rentals/${id}`,
    update: (id) => `/rentals/${id}`,
  },
  // Payment endpoints
  payments: {
    create: '/payments',
    list: '/payments',
    details: (id) => `/payments/${id}`,
  },
};

export default api; 