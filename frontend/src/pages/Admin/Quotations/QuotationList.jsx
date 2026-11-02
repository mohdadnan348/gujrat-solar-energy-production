import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import quotationService from '../../../services/quotationService';
import './QuotationList.css';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await quotationService.getAll();
      setQuotations(data);
      setError('');
    } catch (err) {
      setError('Failed to load quotations.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Sent': return 'status-sent';
      case 'Accepted': return 'status-accepted';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const columns = [
    { header: 'Estimate #', accessor: 'estimateNo', render: (row) => <strong>{row.estimateNo}</strong> },
    { header: 'Customer', accessor: 'customer', render: (row) => row.customer?.name || 'Unknown' },
    { header: 'Date', accessor: 'date', render: (row) => new Date(row.date).toLocaleDateString('en-GB') },
    { header: 'Total Amount', accessor: 'grandTotal', render: (row) => `₹ ${row.grandTotal?.toLocaleString('en-IN') || 0}` },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`status-badge ${getStatusColor(row.status)}`}>{row.status}</span>
    )},
    { header: 'Actions', width: '120px', render: (row) => (
      <div className="action-buttons">
        <button className="icon-btn view" onClick={() => navigate(`/admin/quotations/${row._id}`)}><FiEye /></button>
        <button className="icon-btn edit" onClick={() => navigate(`/admin/quotations/edit/${row._id}`)}><FiEdit2 /></button>
      </div>
    )}
  ];

  if (isLoading) return <Loader text="Loading quotations..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredQuotations = quotations.filter(q => 
    q.estimateNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="quotation-page">
      <div className="page-header">
        <div>
          <h1>Quotations</h1>
          <p>Manage your solar proposals and estimates</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => navigate('/admin/quotations/create')}>
          Create Quotation
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Estimate No. or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' }, 
            { label: 'Draft', value: 'Draft' }, 
            { label: 'Sent', value: 'Sent' },
            { label: 'Accepted', value: 'Accepted' },
            { label: 'Rejected', value: 'Rejected' }
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredQuotations} emptyMessage="No quotations found." />
    </div>
  );
};

export default QuotationList;