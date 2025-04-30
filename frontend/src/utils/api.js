import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || 'http://api-gateway:3000',  // Use API gateway URL
  baseURL: 'http://localhost:3000', //for testing
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't use withCredentials with proxy setup
  withCredentials: false
});

// Get auth token from session storage
const getAuthToken = () => {
  try {
    const auth = localStorage.getItem('auth');
    if (!auth) return null;
    
    const parsedAuth = JSON.parse(auth);
    console.log('Current auth token:', parsedAuth.token ? 'exists' : 'missing');
    return parsedAuth.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request URL:', config.url);
      console.log('Request headers:', config.headers);
    } else {
      console.log('No auth token available for request');
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
  (response) => {
    console.log('Successful response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Only clear auth and redirect for specific 401 errors
    if (error.response?.status === 401 && 
        (error.response?.data?.message === 'Invalid token.' || 
         error.response?.data?.message === 'Token expired')) {
      console.log('Token invalid or expired, clearing auth state');
      localStorage.removeItem('auth');
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