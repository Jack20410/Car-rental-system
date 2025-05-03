import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Components and Pages
import Navbar from './components/Navbar';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import Rentals from './pages/Rentals';
import ManageCars from './pages/ManageCars';
import OwnerProfile from './pages/OwnerProfile';
import PaymentSuccess from './pages/PaymentSuccess';
import ProtectedRoute from './components/ProtectedRoute';

// Scroll restoration component
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
            <ScrollToTop />
            <Routes>
              {/* Special route for payment success to avoid toast issues */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="cars" element={<Cars />} />
                <Route path="cars/:id" element={<CarDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="owner-profile/:id" element={<OwnerProfile />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="profile" element={<Profile />} />
                  <Route path="rentals" element={<Rentals />} />
                  <Route path="manage-cars" element={<ManageCars />} />
                </Route>
              </Route>
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{ zIndex: 9999 }}
            />
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 