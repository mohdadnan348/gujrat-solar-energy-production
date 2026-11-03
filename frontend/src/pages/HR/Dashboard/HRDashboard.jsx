import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiTarget, FiUser, FiFileText, FiDollarSign, FiCheckSquare, FiRefreshCw } from 'react-icons/fi';
import API from '../../../services/api';
import Loader from '../../../components/Common/Loader';
import './HRDashboard.css';

const cards = [
  ['totalEmployees', 'My Employees', FiUsers, '/hr/employees'],
  ['totalLeads', 'My Leads', FiTarget, '/hr/leads'],
  ['totalCustomers', 'My Customers', FiUser, '/hr/customers'],
  ['totalQuotations', 'My Quotations', FiFileText, '/hr/quotations'],
  ['totalInvoices', 'My Invoices', FiDollarSign, '/hr/invoices'],
  ['totalTasks', 'My Tasks', FiCheckSquare, '/hr/tasks'],
];

export default function HRDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await API.get('/dashboard/hr-stats');
      setStats(response?.data?.data ?? response?.data ?? {});
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load HR dashboard. Please check HR dashboard API.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <Loader fullScreen text="Loading HR dashboard..." />;

  return (
    <div className="hr-dashboard">
      <header className="hr-dashboard-header">
        <div><h1>HR Dashboard</h1><p>Your team and business activity overview</p></div>
        <button type="button" onClick={load} className="hr-refresh"><FiRefreshCw /> Refresh</button>
      </header>
      {error && <div className="hr-dashboard-error" role="alert">{error}</div>}
      <section className="hr-stats-grid">
        {cards.map(([key, label, Icon, path]) => (
          <button type="button" className="hr-stat-card" key={key} onClick={() => navigate(path)}>
            <span className="hr-stat-icon"><Icon /></span>
            <span className="hr-stat-label">{label}</span>
            <strong>{Number(stats?.[key] || 0).toLocaleString('en-IN')}</strong>
            <small>View records →</small>
          </button>
        ))}
      </section>
      <section className="hr-dashboard-note">
        <h3>My Team</h3>
        <p>Dashboard figures are intended to show records owned by your HR account and employees reporting to you. Access is ultimately enforced by backend APIs.</p>
        <button type="button" onClick={() => navigate('/hr/employees')}>Manage My Employees</button>
      </section>
    </div>
  );
}
