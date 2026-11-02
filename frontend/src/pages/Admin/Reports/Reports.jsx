import { useState, useEffect } from 'react';
import { FiDownload, FiTrendingUp, FiUsers, FiFileText, FiDollarSign } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import dashboardService from '../../../services/dashboardService';
import './Reports.css';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getAdminStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load reports data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <Loader text="Loading reports..." />;
  if (error) return <div className="error-message">{error}</div>;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const summaryStats = [
    { title: 'Total Sales Revenue', value: formatCurrency(stats?.totalRevenue), icon: <FiDollarSign />, color: 'green' },
    { title: 'Total Leads', value: stats?.totalLeads || 0, icon: <FiTrendingUp />, color: 'blue' },
    { title: 'Total Quotations', value: stats?.totalQuotations || 0, icon: <FiFileText />, color: 'yellow' },
    { title: 'Total Employees', value: stats?.totalEmployees || 0, icon: <FiUsers />, color: 'purple' },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Analyze your business performance and growth</p>
        </div>
        <div className="header-actions">
          <select className="date-range-select">
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
          <Button variant="primary" icon={<FiDownload />}>Export Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-grid">
        {summaryStats.map((stat, index) => (
          <div className="report-card" key={index}>
            <div className={`report-icon ${stat.color}`}>{stat.icon}</div>
            <div className="report-info">
              <p>{stat.title}</p>
              <h3>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Charts (Backend se data aane par real charts lagayenge) */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Sales Trend (Last 6 Months)</h3>
          <div className="chart-placeholder">
            <div className="mock-bars">
              <div className="bar" style={{ height: '40%' }}></div>
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '30%' }}></div>
              <div className="bar" style={{ height: '80%' }}></div>
              <div className="bar" style={{ height: '50%' }}></div>
              <div className="bar" style={{ height: '95%' }}></div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Quick Insights</h3>
          <div className="quick-insights">
            <div className="insight-item">
              <span>Conversion Rate</span>
              <strong>{(stats?.totalQuotations && stats?.totalLeads) ? ((stats.totalQuotations / stats.totalLeads) * 100).toFixed(1) + '%' : '0%'}</strong>
            </div>
            <div className="insight-item">
              <span>Avg. Revenue per Invoice</span>
              <strong>{formatCurrency(stats?.totalRevenue / (stats?.totalQuotations || 1))}</strong>
            </div>
            <div className="insight-item">
              <span>Total Employees</span>
              <strong>{stats?.totalEmployees || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;