import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

/**
 * A wrapper component for protected routes.
 * If the user is not authenticated, they will be redirected to the login page.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sessionAuth, setSessionAuth] = useState(false);
  
  // Directly check session storage as a fallback
  useEffect(() => {
    const auth = sessionStorage.getItem('auth');
    if (auth) {
      const parsedAuth = JSON.parse(auth);
      setSessionAuth(!!parsedAuth.token);
    }
  }, []);

  // If still loading, show nothing or a loader
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated via context or session storage, redirect to login
  if (!isAuthenticated && !sessionAuth) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 