import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://car-rental-api-gateway.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// Get auth token from session storage
const getAuthToken = () => {
  try {
    const auth = localStorage.getItem('auth');
    if (!auth) return null;
    const parsedAuth = JSON.parse(auth);
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
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && 
        (error.response?.data?.message === 'Invalid token.' || 
         error.response?.data?.message === 'Token expired')) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  user: {
    profile: '/users/profile',
    details: (id) => `/users/${id}`,
    update: (id) => `/users/${id}`,
  },
  vehicles: {
    list: '/vehicles',
    details: (id) => `/vehicles/${id}`,
    create: '/vehicles',
    update: (id) => `/vehicles/${id}`,
    delete: (id) => `/vehicles/${id}`,
  },
  rentals: {
    create: '/rentals',
    list: '/rentals',
    details: (id) => `/rentals/${id}`,
    update: (id) => `/rentals/${id}`,
  },
  payments: {
    create: '/payments',
    list: '/payments',
    details: (id) => `/payments/${id}`,
  },
  ratings: {
    list: '/ratings',
    byUser: (userId) => `/ratings/user/${userId}`,
    byVehicle: (vehicleId) => `/ratings/${vehicleId}`,
    byProvider: (providerId) => `/ratings/by-provider/${providerId}`,
    byRental: (rentalId) => `/ratings/by-rental/${rentalId}`,
    average: (vehicleId) => `/ratings/${vehicleId}/average`,
    delete: (id) => `/ratings/${id}`,
  },
};

export default api; 