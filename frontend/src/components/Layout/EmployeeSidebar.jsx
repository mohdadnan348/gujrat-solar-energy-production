import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiTarget, FiCheckSquare, FiClock,
  FiCalendar, FiDollarSign, FiUser, FiBell, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './EmployeeSidebar.css';

const EmployeeSidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (toggleSidebar) toggleSidebar(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className={`employee-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h2>GUJRAT SOLAR</h2>
        <p>Employee Portal</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/employee/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiGrid className="nav-icon" /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/employee/leads" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiTarget className="nav-icon" /> <span>My Leads</span>
        </NavLink>
        <NavLink to="/employee/tasks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiCheckSquare className="nav-icon" /> <span>My Tasks</span>
        </NavLink>
        <NavLink to="/employee/attendance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiClock className="nav-icon" /> <span>My Attendance</span>
        </NavLink>
        <NavLink to="/employee/leaves" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiCalendar className="nav-icon" /> <span>My Leaves</span>
        </NavLink>
        <NavLink to="/employee/salary" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiDollarSign className="nav-icon" /> <span>My Salary</span>
        </NavLink>
        <NavLink to="/employee/notifications" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiBell className="nav-icon" /> <span>Notifications</span>
        </NavLink>
        <NavLink to="/employee/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiUser className="nav-icon" /> <span>My Profile</span>
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

export default EmployeeSidebar;
