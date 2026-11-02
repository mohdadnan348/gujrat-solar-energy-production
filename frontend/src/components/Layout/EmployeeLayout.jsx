import { useState } from 'react';
import EmployeeSidebar from './EmployeeSidebar';
import Navbar from './Navbar';
import './EmployeeLayout.css';

const EmployeeLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="employee-layout">
      <EmployeeSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
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