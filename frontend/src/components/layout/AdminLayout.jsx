import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 