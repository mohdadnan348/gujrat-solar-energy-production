<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
import { useState } from 'react';
>>>>>>> b1916d9 (create hr role)
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import Navbar from './Navbar';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
=======
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role !== 'Admin') return <Navigate to="/employee/dashboard" replace />;
>>>>>>> b1916d9 (create hr role)

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role !== 'Admin') return <Navigate to="/employee/dashboard" replace />;

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => {
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        toggleSidebar={closeSidebar}
      />

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} userRole="Admin" />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;