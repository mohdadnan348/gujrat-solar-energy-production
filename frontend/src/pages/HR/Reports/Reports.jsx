import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiRefreshCw, FiCheckCircle, FiClock, FiUsers, FiList } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import API from '../../../services/api';
import './Reports.css';

const unwrap = (response) => {
  let payload = response?.data;
  // Support both { data: [...] } and nested { data: { data: [...] } } API response formats.
  while (payload && !Array.isArray(payload) && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    payload = payload.data;
  }
  return payload;
};

const getArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const fetchEndpoint = async (url, label) => {
  try {
    const response = await API.get(url);
    return { label, data: getArray(unwrap(response)), error: null };
  } catch (error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message || 'Request failed';
    return {
      label,
      data: [],
      error: status ? `${label}: ${message} (HTTP ${status})` : `${label}: ${message}`,
    };
  }
};

const Reports = () => {
  const [reportData, setReportData] = useState({ tasks: [], leads: [], leaves: [] });
  const [endpointErrors, setEndpointErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [range, setRange] = useState('all');

  const fetchReports = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      // Each request is isolated: a permission/route issue in one module won't blank all reports.
      const results = await Promise.all([
        fetchEndpoint('/tasks', 'Tasks'),
        fetchEndpoint('/leads', 'Leads'),
        fetchEndpoint('/leaves', 'Leaves'),
      ]);

      setReportData({
        tasks: results[0].data,
        leads: results[1].data,
        leaves: results[2].data,
      });
      setEndpointErrors(results.filter((item) => item.error).map((item) => item.error));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load HR reports.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = useMemo(() => {
    if (range === 'all') return reportData;
    const now = new Date();
    const start = new Date(now);
    if (range === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (range === 'quarter') {
      start.setMonth(start.getMonth() - 3);
    } else if (range === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }
    const inRange = (item) => {
      const rawDate = item.createdAt || item.startDate || item.created_at || item.createdOn;
      if (!rawDate) return false;
      const date = new Date(rawDate);
      return !Number.isNaN(date.getTime()) && date >= start && date <= now;
    };
    return {
      tasks: reportData.tasks.filter(inRange),
      leads: reportData.leads.filter(inRange),
      leaves: reportData.leaves.filter(inRange),
    };
  }, [reportData, range]);

  const tasks = filtered.tasks;
  const leads = filtered.leads;
  const leaves = filtered.leaves;
  const completedTasks = tasks.filter((item) => item.status === 'Completed').length;
  const pendingTasks = tasks.filter((item) => item.status !== 'Completed').length;
  const pendingLeaves = leaves.filter((item) => item.status === 'Pending').length;
  const approvedLeaves = leaves.filter((item) => item.status === 'Approved').length;
  const rejectedLeaves = leaves.filter((item) => item.status === 'Rejected').length;
  const convertedLeads = leads.filter((item) =>
    ['Converted', 'Won', 'Customer'].includes(String(item.status || '').trim())
  ).length;
  const conversionRate = leads.length ? ((convertedLeads / leads.length) * 100).toFixed(1) : '0.0';

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Tasks', tasks.length],
      ['Completed Tasks', completedTasks],
      ['Open Tasks', pendingTasks],
      ['Leads', leads.length],
      ['Converted Leads', convertedLeads],
      ['Lead Conversion Rate', `${conversionRate}%`],
      ['Leave Requests', leaves.length],
      ['Pending Leaves', pendingLeaves],
      ['Approved Leaves', approvedLeaves],
      ['Rejected Leaves', rejectedLeaves],
    ];
    const csv = rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hr-team-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loader text="Loading HR team reports..." />;

  const cards = [
    { title: 'Team Tasks', value: tasks.length, icon: <FiList />, color: 'blue' },
    { title: 'Completed Tasks', value: completedTasks, icon: <FiCheckCircle />, color: 'green' },
    { title: 'Open Tasks', value: pendingTasks, icon: <FiClock />, color: 'yellow' },
    { title: 'Team Leads', value: leads.length, icon: <FiUsers />, color: 'purple' },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>HR Team Reports</h1>
          <p>Performance overview for your assigned team</p>
        </div>
        <div className="header-actions">
          <select className="date-range-select" value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="secondary" icon={<FiRefreshCw />} onClick={() => fetchReports(true)} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="primary" icon={<FiDownload />} onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {error && <div className="leave-alert error" role="alert">{error}</div>}
      {endpointErrors.length > 0 && (
        <div className="reports-warning" role="status">
          <strong>Some report sections could not be loaded:</strong>
          <ul>{endpointErrors.map((item) => <li key={item}>{item}</li>)}</ul>
          <span>Other available report sections are still displayed. Check the failed API route and HR permissions.</span>
        </div>
      )}

      <div className="reports-grid">
        {cards.map((card) => (
          <div className="report-card" key={card.title}>
            <div className={`report-icon ${card.color}`}>{card.icon}</div>
            <div className="report-info"><p>{card.title}</p><h3>{card.value}</h3></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Task Status Overview</h3>
          <div className="hr-report-bars">
            {[
              ['To Do', tasks.filter((item) => item.status === 'To Do').length],
              ['In Progress', tasks.filter((item) => item.status === 'In Progress').length],
              ['Blocked', tasks.filter((item) => item.status === 'Blocked').length],
              ['Completed', completedTasks],
            ].map(([label, value]) => (
              <div className="hr-report-bar-row" key={label}>
                <span>{label}</span>
                <div className="hr-report-track">
                  <div className="hr-report-fill" style={{ width: `${tasks.length ? (value / tasks.length) * 100 : 0}%` }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-card">
          <h3>Leave & Lead Insights</h3>
          <div className="quick-insights">
            <div className="insight-item"><span>Pending Leave Requests</span><strong>{pendingLeaves}</strong></div>
            <div className="insight-item"><span>Approved Leave Requests</span><strong>{approvedLeaves}</strong></div>
            <div className="insight-item"><span>Rejected Leave Requests</span><strong>{rejectedLeaves}</strong></div>
            <div className="insight-item"><span>Converted Leads</span><strong>{convertedLeads}</strong></div>
            <div className="insight-item"><span>Lead Conversion Rate</span><strong>{conversionRate}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
