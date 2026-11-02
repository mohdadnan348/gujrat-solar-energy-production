import { useState, useEffect } from 'react';
import { FiMenu, FiBell, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import './Navbar.css';

const Navbar = ({ toggleSidebar, userRole }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName =
    user?.name || user?.fullName || user?.employeeName ||
    user?.username || user?.email || 'User';
  const role = user?.role || userRole || 'Employee';

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getMyNotifications();
        if (mounted) setUnreadCount(Number(data?.unreadCount) || 0);
      } catch (err) {
        console.error('Failed to fetch notifications count', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleNotificationClick = () => {
    navigate(role === 'Admin' ? '/admin/notifications' : '/employee/notifications');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button type="button" className="menu-btn" onClick={toggleSidebar} aria-label="Open menu">
          <FiMenu />
        </button>
        <h2 className="page-title">
          {role === 'Admin' ? 'Admin Dashboard' : 'Employee Dashboard'}
        </h2>
      </div>

      <div className="navbar-right">
        <button type="button" className="nav-icon-btn" onClick={handleNotificationClick} aria-label="Notifications">
          <FiBell size={20} />
          {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>

        <div className="user-profile" onClick={() => setShowDropdown((current) => !current)}>
          <div className="avatar"><FiUser size={18} /></div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{role}</span>
          </div>
          <FiChevronDown className={`dropdown-icon ${showDropdown ? 'open' : ''}`} />

          {showDropdown && (
            <div className="dropdown-menu" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={handleLogout} className="logout-item">
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
