import { createContext, useContext, useState, useEffect } from 'react';
import api, { endpoints } from '../utils/api';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  const auth = localStorage.getItem('auth');
  return auth ? JSON.parse(auth) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredAuth()?.user || null);
  const [loading, setLoading] = useState(!getStoredAuth());

  useEffect(() => {
    // Check if user is logged in on mount
    const auth = getStoredAuth();
    console.log('Auth state on mount:', { auth, hasToken: !!auth?.token });
    
    if (auth?.token) {
      console.log('Found token, fetching user profile...');
      // Add a small delay to ensure the API is ready
      setTimeout(() => {
        fetchUserProfile();
      }, 100);
    } else {
      console.log('No token found in localStorage');
      setLoading(false);
    }

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'auth') {
        console.log('Auth storage changed:', e.newValue);
        if (e.newValue) {
          const newAuth = JSON.parse(e.newValue);
          setUser(newAuth.user);
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Starting profile fetch...');
      const response = await api.get(endpoints.user.profile);
      const userData = response.data.data;
      console.log('Profile fetch successful:', userData);
      setUser(userData);
      // Update stored user data
      const auth = getStoredAuth();
      if (auth) {
        localStorage.setItem('auth', JSON.stringify({
          ...auth,
          user: userData
        }));
        console.log('Updated auth in localStorage with new user data');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Only clear auth for specific error cases
      if (error.response?.status === 401 && 
          (error.response?.data?.message === 'Invalid token.' || 
           error.response?.data?.message === 'Token expired')) {
        console.log('Token invalid or expired - clearing auth state');
        localStorage.removeItem('auth');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Login attempt with:', credentials);
      
      const response = await api.post(endpoints.auth.login, credentials);
      console.log('Login response:', response.data);
      
      const { token, data: userData } = response.data;
      
      if (!token) {
        console.error('No token received in login response');
        throw new Error('Authentication failed: No token received');
      }
      
      // Store both token and user data in session
      const authData = {
        token,
        user: userData,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      setUser(userData);
      
      // Return the response data for role-based redirection
      return { user: userData, token };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
  };

  // Get current auth state
  const getAuthState = async () => {
    try {
      console.log('Fetching current user profile...');
      const response = await api.get(endpoints.user.profile);
      const userData = response.data.data;
      
      console.log('Received user data:', userData);
      
      // Update local storage and state
      const auth = getStoredAuth();
      if (auth) {
        const updatedAuth = {
          ...auth,
          user: userData
        };
        localStorage.setItem('auth', JSON.stringify(updatedAuth));
        setUser(userData);
        console.log('Updated user state with new data');
      }
      
      return {
        isAuthenticated: !!auth?.token,
        user: userData,
        token: auth?.token || null,
        loginTime: auth?.loginTime || null
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loginTime: null
      };
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    const auth = getStoredAuth();
    return auth?.user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      getAuthState,
      isAdmin,
      isAuthenticated: !!getStoredAuth()?.token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 