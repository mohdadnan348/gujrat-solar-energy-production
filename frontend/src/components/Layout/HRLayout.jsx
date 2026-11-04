import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HRSidebar from './HRSidebar';
import Navbar from './Navbar';
import './HRLayout.css';

export default function HRLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

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
  if (user.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user.role !== 'HR') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const closeSidebar = () => {
    if (window.innerWidth <= 900) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="admin-layout hr-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <HRSidebar
        isOpen={sidebarOpen}
        toggleSidebar={closeSidebar}
      />

      <div
        className={`main-content ${
          sidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} userRole="HR" />

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}