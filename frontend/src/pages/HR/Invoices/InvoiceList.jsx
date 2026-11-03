import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiSearch, FiPlus } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import Button from '../../../components/Common/Button';
import invoiceService from '../../../services/invoiceService';
import './InvoiceList.css';

const currency = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(Number(n) || 0);

const date = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '—';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const navigate = useNavigate();

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getAll();
      setInvoices(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to fetch your team invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  const handleStatusChange = async (invoice, nextStatus) => {
    if (nextStatus !== 'Sent' || nextStatus === invoice.status) return;
    try {
      setUpdatingId(invoice._id);
      const updated = await invoiceService.updateStatus(invoice._id, nextStatus);
      setInvoices((current) => current.map((item) =>
        item._id === invoice._id
          ? {
              ...item,
              ...updated,
              // Preserve populated references; status response contains IDs only.
              customer: item.customer,
              quotation: item.quotation,
            }
          : item
      ));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update invoice status');
    } finally {
      setUpdatingId('');
    }
  };

  const filtered = useMemo(() => invoices.filter((inv) => {
    const customerName = inv.customer?.name || '';
    return (!status || inv.status === status) &&
      `${inv.invoiceNo || ''} ${customerName}`.toLowerCase().includes(search.toLowerCase());
  }).map((inv) => ({
    ...inv,
    customerName: inv.customer?.name || '—',
    dateLabel: date(inv.invoiceDate),
  })), [invoices, search, status]);

  const statusClass = (value) => ({
    Draft: 'status-draft',
    Sent: 'status-sent',
    'Partially Paid': 'status-partial',
    Paid: 'status-paid',
    Overdue: 'status-overdue',
    Cancelled: 'status-cancelled',
  }[value] || '');

  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNo', render: (row) => <strong>{row.invoiceNo}</strong> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'dateLabel' },
    { header: 'Amount', accessor: 'grandTotal', render: (row) => currency(row.grandTotal) },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`status-badge ${statusClass(row.status)}`}>{row.status}</span>
      ),
    },
    {
      header: 'Change Status',
      width: '150px',
      render: (row) => row.status === 'Draft' ? (
        <select
          className="invoice-status-select"
          value=""
          disabled={updatingId === row._id}
          onChange={(event) => handleStatusChange(row, event.target.value)}
          aria-label={`Change status for ${row.invoiceNo}`}
        >
          <option value="">Select status</option>
          <option value="Sent">Sent</option>
        </select>
      ) : <span className="status-locked">{row.status === 'Cancelled' ? 'Final' : '—'}</span>,
    },
    {
      header: 'Actions',
      width: '90px',
      render: (row) => (
        <div className="action-buttons">
          <button
            className="icon-btn view"
            title="View invoice"
            onClick={() => navigate(`/hr/invoices/${row._id}`)}
          >
            <FiEye />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader text="Loading team invoices..." />;

  return (
    <div className="invoice-page">
      <div className="page-header">
        <div><h1>Invoices</h1><p>View your team's invoices and manage their status</p></div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => navigate('/hr/invoices/create')}>Create Invoice</Button>
      </div>

      {error && <p role="alert" className="text-danger">{error}</p>}

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Invoice # or Customer..."
          />
        </div>
        <div className="filter-actions">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              ...['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']
                .map((value) => ({ label: value, value })),
            ]}
          />
        </div>
      </div>

      <Table columns={columns} data={filtered} emptyMessage="No team invoices found." />
    </div>
  );
};

export default InvoiceList;
