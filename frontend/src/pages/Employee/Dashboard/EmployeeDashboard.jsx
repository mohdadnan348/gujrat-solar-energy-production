import { useState, useEffect } from 'react';
import { FiCheckSquare, FiTarget, FiClock, FiDollarSign, FiArrowRight, FiCalendar, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import dashboardService from '../../../services/dashboardService';
import Loader from '../../../components/Common/Loader';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Logged in user

  const [data, setData] = useState({
    tasks: [],
    leads: [],
    attendance: [],
    payroll: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await dashboardService.getEmployeeDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <Loader fullScreen text="Loading Dashboard..." />;
  if (error) return <div className="error-message" style={{ margin: '20px' }}>{error}</div>;

  // Stats nikalne ke liye calculation
  const pendingTasks = data.tasks.filter(t => t.status !== 'Completed').length;
  const todayAttendance = data.attendance.find(a => new Date(a.date).toDateString() === new Date().toDateString());
  const latestSalary = data.payroll.length > 0 ? data.payroll[0] : null;
  const assignedLeads = data.leads.length;

  const stats = [
    { title: 'My Tasks', value: pendingTasks.toString(), subtitle: 'Pending Tasks', icon: <FiCheckSquare />, color: 'blue', link: '/employee/tasks' },
    { title: 'My Leads', value: assignedLeads.toString(), subtitle: 'Assigned to me', icon: <FiTarget />, color: 'purple', link: '/employee/leads' },
    { 
      title: 'Attendance', 
      value: todayAttendance ? 'Present' : 'Not Marked', 
      subtitle: todayAttendance ? `Checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Mark attendance now', 
      icon: <FiClock />, 
      color: todayAttendance ? 'green' : 'orange', 
      link: '/employee/attendance' 
    },
    { 
      title: 'Current Salary', 
      value: latestSalary ? `₹ ${latestSalary.netPayable.toLocaleString('en-IN')}` : 'N/A', 
      subtitle: latestSalary ? `For ${latestSalary.month}/${latestSalary.year}` : 'No salary generated', 
      icon: <FiDollarSign />, 
      color: 'orange', 
      link: '/employee/salary' 
    },
  ];

  // Aaj ke tasks (Due Today)
  const todayTasks = data.tasks.filter(t => t.status !== 'Completed').slice(0, 3);

  return (
    <div className="employee-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1>Welcome back, {user?.name || 'Employee'}! 👋</h1>
          <p>Here is your daily overview for {todayDate}</p>
        </div>
        <div className="welcome-date">
          <FiCalendar /> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="emp-stats-grid">
        {stats.map((stat, index) => (
          <div className="emp-stat-card" key={index} onClick={() => navigate(stat.link)}>
            <div className={`emp-stat-icon ${stat.color}`}>{stat.icon}</div>
            <div className="emp-stat-info">
              <p className="emp-stat-title">{stat.title}</p>
              <h3 className="emp-stat-value">{stat.value}</h3>
              <p className="emp-stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="emp-dashboard-grid">
        {/* Today's Tasks */}
        <div className="emp-card">
          <div className="emp-card-header">
            <h3>Pending Tasks</h3>
            <button className="view-link" onClick={() => navigate('/employee/tasks')}>
              View All <FiArrowRight />
            </button>
          </div>
          <div className="task-list">
            {todayTasks.length === 0 ? (
              <p className="empty-text">No pending tasks. Great job! 🎉</p>
            ) : (
              todayTasks.map((task) => (
                <div className="task-item" key={task._id}>
                  <div className="task-time">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                  </div>
                  <div className="task-details">
                    <h4>{task.title}</h4>
                    <div className="task-meta">
                      <span className={`priority-tag ${task.priority?.toLowerCase() || 'normal'}`}>{task.priority || 'Normal'}</span>
                      <span className="task-status">{task.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Info / Notifications */}
        <div className="emp-card">
          <div className="emp-card-header">
            <h3>Quick Info</h3>
            <button className="view-link" onClick={() => navigate('/employee/notifications')}>
              View All <FiArrowRight />
            </button>
          </div>
          <div className="quick-info-list">
            <div className="quick-info-item">
              <FiBell className="qi-icon" />
              <p>Check your notifications for latest updates.</p>
            </div>
            <div className="quick-info-item">
              <FiClock className="qi-icon" />
              <p>Don't forget to mark your attendance daily.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;