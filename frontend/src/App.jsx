import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import Profile from './pages/Profile';
import Rentals from './pages/Rentals';
import ManageCars from './pages/ManageCars';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
          <Navbar />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="cars" element={<Cars />} />
              <Route path="cars/:id" element={<CarDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              
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
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 