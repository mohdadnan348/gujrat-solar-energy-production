import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiSearch } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import invoiceService from '../../../services/invoiceService';
import './InvoiceList.css';

const currency = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);
const date = value => value ? new Date(value).toLocaleDateString('en-IN') : '—';
const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  useEffect(() => { invoiceService.getAll().then(data => setInvoices(Array.isArray(data) ? data : [])).catch(err => setError(err.response?.data?.message || 'Unable to fetch invoices')).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => invoices.filter(inv => {
    const name = inv.customer?.name || '';
    return (!status || inv.status === status) && `${inv.invoiceNo || ''} ${name}`.toLowerCase().includes(search.toLowerCase());
  }).map(inv => ({ ...inv, customerName: inv.customer?.name || '—', dateLabel: date(inv.invoiceDate), balance: (Number(inv.grandTotal) || 0) - (Number(inv.paidAmount) || 0) })), [invoices, search, status]);
  const statusClass = s => ({ Draft: 'status-draft', Sent: 'status-sent', 'Partially Paid': 'status-partial', Paid: 'status-paid', Overdue: 'status-overdue', Cancelled: 'status-cancelled' }[s] || '');
  const columns = [
    { header: 'Invoice #', accessor: 'invoiceNo', render: row => <strong>{row.invoiceNo}</strong> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', accessor: 'dateLabel' },
    { header: 'Amount', accessor: 'grandTotal', render: row => currency(row.grandTotal) },
    { header: 'Balance', accessor: 'balance', render: row => <span className={row.balance > 0 ? 'text-danger' : 'text-success'}>{currency(row.balance)}</span> },
    { header: 'Status', accessor: 'status', render: row => <span className={`status-badge ${statusClass(row.status)}`}>{row.status}</span> },
    { header: 'Actions', width: '100px', render: row => <div className="action-buttons"><button className="icon-btn view" title="View" onClick={() => navigate(`/admin/invoices/${row._id}`)}><FiEye /></button></div> },
  ];
  if (loading) return <Loader text="Loading invoices..." />;
  return <div className="invoice-page">
    <div className="page-header"><div><h1>Invoices</h1><p>Manage your billing and payments</p></div><Button variant="primary" icon={<FiPlus />} onClick={() => navigate('/admin/invoices/create')}>Create Invoice</Button></div>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <div className="toolbar"><div className="search-box"><FiSearch className="search-icon" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Invoice # or Customer..." /></div><div className="filter-actions"><Select value={status} onChange={e => setStatus(e.target.value)} options={[{ label: 'All Statuses', value: '' }, ...['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map(s => ({ label: s, value: s }))]} /></div></div>
    <Table columns={columns} data={filtered} emptyMessage="No invoices found." />
  </div>;
};
export default InvoiceList;
