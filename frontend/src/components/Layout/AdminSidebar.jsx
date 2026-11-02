import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiTarget, FiFileText, FiDollarSign,
  FiCheckSquare, FiUserPlus, FiClock, FiBriefcase,
  FiCalendar, FiBell, FiPieChart, FiSettings, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (toggleSidebar) toggleSidebar(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h2>GUJRAT SOLAR</h2>
        <p>Admin Panel</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiGrid className="nav-icon" /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/leads" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiTarget className="nav-icon" /> <span>Lead Management</span>
        </NavLink>
        <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiUsers className="nav-icon" /> <span>Customers</span>
        </NavLink>
        <NavLink to="/admin/quotations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiFileText className="nav-icon" /> <span>Quotations</span>
        </NavLink>
        <NavLink to="/admin/invoices" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiDollarSign className="nav-icon" /> <span>Invoices</span>
        </NavLink>
        <NavLink to="/admin/tasks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiCheckSquare className="nav-icon" /> <span>Tasks</span>
        </NavLink>
        <NavLink to="/admin/employees" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiUserPlus className="nav-icon" /> <span>Employees</span>
        </NavLink>
        <NavLink to="/admin/attendance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiClock className="nav-icon" /> <span>Attendance</span>
        </NavLink>
        <NavLink to="/admin/payroll" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiBriefcase className="nav-icon" /> <span>Salary / Payroll</span>
        </NavLink>
        <NavLink to="/admin/leaves" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiCalendar className="nav-icon" /> <span>Leave Management</span>
        </NavLink>
        <NavLink to="/admin/notifications" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiBell className="nav-icon" /> <span>Notifications</span>
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiPieChart className="nav-icon" /> <span>Reports</span>
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiSettings className="nav-icon" /> <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <FiLogOut /> <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
