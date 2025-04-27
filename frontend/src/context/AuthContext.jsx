import { createContext, useContext, useState, useEffect } from 'react';
import api, { endpoints } from '../utils/api';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  const auth = sessionStorage.getItem('auth');
  return auth ? JSON.parse(auth) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredAuth()?.user || null);
  const [loading, setLoading] = useState(!getStoredAuth());

  useEffect(() => {
    // Check if user is logged in on mount
    const auth = getStoredAuth();
    if (auth?.token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(endpoints.user.profile);
      const userData = response.data.data;
      setUser(userData);
      // Update stored user data
      const auth = getStoredAuth();
      if (auth) {
        sessionStorage.setItem('auth', JSON.stringify({
          ...auth,
          user: userData
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      sessionStorage.removeItem('auth');
      setUser(null);
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
      sessionStorage.setItem('auth', JSON.stringify(authData));
      setUser(userData);
      return userData;
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
    sessionStorage.removeItem('auth');
    setUser(null);
  };

  // Get current auth state
  const getAuthState = () => {
    const auth = getStoredAuth();
    return {
      isAuthenticated: !!auth?.token,
      user: auth?.user || null,
      token: auth?.token || null,
      loginTime: auth?.loginTime || null
    };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      getAuthState,
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