import { useCallback, useEffect, useState } from 'react';
import {
  FiUsers, FiFileText, FiDollarSign, FiTarget,
  FiPlus, FiRefreshCw, FiActivity,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../../services/dashboardService';
import Loader from '../../../components/Common/Loader';
import './AdminDashboard.css';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatChange = (change) => {
  if (change === null || change === undefined) return 'No previous-month data';
  if (change === 0) return 'No change vs last month';
  return `${change > 0 ? '+' : ''}${change}% vs last month`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Admin dashboard fetch failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) return <Loader fullScreen text="Loading dashboard..." />;

  const leadsChange = stats?.monthly?.leads?.changePercent;
  const quotationsChange = stats?.monthly?.quotations?.changePercent;

  const statCards = [
    {
      title: 'Total Leads',
      value: Number(stats?.totalLeads || 0).toLocaleString('en-IN'),
      subtitle: formatChange(leadsChange),
      icon: <FiTarget />,
      color: 'blue',
      link: '/admin/leads',
    },
    {
      title: 'Total Quotations',
      value: Number(stats?.totalQuotations || 0).toLocaleString('en-IN'),
      subtitle: formatChange(quotationsChange),
      icon: <FiFileText />,
      color: 'yellow',
      link: '/admin/quotations',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue),
      subtitle: 'Paid invoices · All time',
      icon: <FiDollarSign />,
      color: 'green',
      link: '/admin/invoices',
    },
    {
      title: 'Total Employees',
      value: Number(stats?.totalEmployees || 0).toLocaleString('en-IN'),
      subtitle: 'Active employees',
      icon: <FiUsers />,
      color: 'red',
      link: '/admin/employees',
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Live business summary from your database.</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="date-badge">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </div>
          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
          >
            <FiRefreshCw className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          {error}
          <button type="button" onClick={() => fetchStats(true)}>Retry</button>
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((stat) => (
          <button
            type="button"
            className="stat-card"
            key={stat.title}
            onClick={() => navigate(stat.link)}
          >
            <div className={`stat-icon-wrapper ${stat.color}`}>{stat.icon}</div>
            <div className="stat-details">
              <p className="stat-title">{stat.title}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <div className="stat-change">
                <span>{stat.subtitle}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="dashboard-bottom">
        <div className="recent-activity-card">
          <div className="card-header">
            <h3><FiActivity /> Recent Activity</h3>
            <button className="view-all-btn" onClick={() => navigate('/admin/leads')}>
              View Leads
            </button>
          </div>

          <div className="activity-list">
            {stats?.recentActivities?.length ? (
              stats.recentActivities.map((activity) => (
                <div className="activity-item" key={`${activity.type}-${activity.id}`}>
                  <div className={`activity-dot ${activity.type}`} />
                  <div className="activity-content">
                    <p>{activity.text}</p>
                    <div className="activity-meta">
                      <span>By {activity.user || 'System'}</span>
                      <span>• {activity.time || ''}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">No recent activity</p>
            )}
          </div>
        </div>

        <div className="quick-actions-card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="actions-list">
            <button className="action-btn primary" onClick={() => navigate('/admin/quotations/create')}>
              <div className="action-icon"><FiPlus /></div>
              <div className="action-text">
                <span>Create New Quotation</span>
                <small>Generate a solar proposal</small>
              </div>
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/admin/customers')}>
              <div className="action-icon"><FiPlus /></div>
              <div className="action-text">
                <span>Add New Customer</span>
                <small>Add a new client to database</small>
              </div>
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/admin/leads')}>
              <div className="action-icon"><FiPlus /></div>
              <div className="action-text">
                <span>Add New Lead</span>
                <small>Track a potential customer</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
