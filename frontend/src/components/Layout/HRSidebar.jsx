import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiTarget, FiFileText, FiDollarSign,
  FiCheckSquare, FiClock, FiBriefcase, FiCalendar,
  FiBell, FiSettings, FiLogOut, FiBarChart2
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

// HR gets the same working modules as Admin, but data visibility is
// restricted by the backend to the records owned by this HR account.
const links = [
  ['/hr/dashboard', 'Dashboard', FiGrid],
  ['/hr/attendance', 'Attendance', FiClock],
  ['/hr/customers', 'Customers', FiUsers],
  ['/hr/employees', 'Employees', FiUsers],
  ['/hr/invoices', 'Invoices', FiDollarSign],
  ['/hr/leads', 'Leads', FiTarget],
  ['/hr/leaves', 'Leaves', FiCalendar],
  ['/hr/notifications', 'Notifications', FiBell],
  ['/hr/payroll', 'Payroll', FiBriefcase],
  ['/hr/quotations', 'Quotations', FiFileText],

  ['/hr/settings', 'Settings', FiSettings],
  ['/hr/tasks', 'Tasks', FiCheckSquare],
];

export default function HRSidebar({ isOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h2>GUJRAT SOLAR</h2>
        <p>HR Portal</p>
      </div>

      <nav className="sidebar-nav">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
