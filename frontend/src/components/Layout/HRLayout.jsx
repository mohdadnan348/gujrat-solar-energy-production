import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HRSidebar from './HRSidebar';
import Navbar from './Navbar';
import './HRLayout.css';

export default function HRLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role !== 'HR') return <Navigate to="/employee/dashboard" replace />;
  return (
    <div className="admin-layout hr-layout">
      <HRSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(v => !v)} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={() => setSidebarOpen(v => !v)} userRole="HR" />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
