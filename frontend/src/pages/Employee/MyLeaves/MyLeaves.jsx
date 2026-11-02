import { useState, useEffect } from 'react';
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiCalendar } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import ApplyLeave from './ApplyLeave';
import leaveService from '../../../services/leaveService'; // <-- Real service import
import './MyLeaves.css';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const data = await leaveService.getMyLeaves();
      setLeaves(data);
      setError('');
    } catch (err) {
      setError('Failed to load leaves.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApplySubmit = async (formData) => {
    try {
      await leaveService.applyLeave(formData);
      setIsModalOpen(false);
      fetchLeaves(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply for leave');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock className="icon-pending" />;
      case 'Approved': return <FiCheckCircle className="icon-approved" />;
      case 'Rejected': return <FiXCircle className="icon-rejected" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const columns = [
    { header: 'Leave Type', accessor: 'leaveType', render: (row) => (
      <div className="leave-type-cell">
        <FiCalendar className="leave-icon" />
        <span className="font-bold">{row.leaveType}</span>
      </div>
    )},
    { header: 'Duration', accessor: 'duration', render: (row) => (
      <div className="date-range">
        <span>{new Date(row.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
        <span className="date-separator">to</span>
        <span>{new Date(row.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
        <span className="days-badge">{row.days} days</span>
      </div>
    )},
    { header: 'Reason', accessor: 'reason', render: (row) => (
      <div className="reason-text">{row.reason}</div>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <div className={`status-badge ${getStatusColor(row.status)}`}>
        {getStatusIcon(row.status)}
        <span>{row.status}</span>
      </div>
    )},
  ];

  if (isLoading) return <Loader text="Loading your leaves..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-leaves-page">
      <div className="page-header">
        <div>
          <h1>My Leaves</h1>
          <p>Apply for leave and track your requests</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => setIsModalOpen(true)}>
          Apply for Leave
        </Button>
      </div>

      <Table columns={columns} data={leaves} emptyMessage="No leave requests found." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Apply for Leave" 
        size="md"
      >
        <ApplyLeave 
          onSubmit={handleApplySubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default MyLeaves;