import { useState, useEffect } from 'react';
import EmployeeSidebar from './EmployeeSidebar';
import Navbar from './Navbar';
import './EmployeeLayout.css';

const EmployeeLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const closeSidebar = () => {
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  return (
    <div className="employee-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <EmployeeSidebar
        isOpen={sidebarOpen}
        toggleSidebar={closeSidebar}
      />

      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar toggleSidebar={toggleSidebar} userRole="Employee" />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;