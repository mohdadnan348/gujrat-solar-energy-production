import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Select from '../../../components/Common/Select';
import LeadForm from './LeadForm';
import leadService from '../../../services/leadService';
import Loader from '../../../components/Common/Loader';
import './LeadList.css';

const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getAll();
      setLeads(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load leads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingLead) {
        await leadService.update(editingLead._id, formData);
      } else {
        await leadService.create(formData);
      }
      setIsModalOpen(false);
      setEditingLead(null);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save lead');
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadService.delete(id);
        fetchLeads();
      } catch (err) {
        alert('Failed to delete lead');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'status-new';
      case 'Contacted': return 'status-contacted';
      case 'Interested': return 'status-interested';
      case 'Converted': return 'status-converted';
      case 'Lost': return 'status-lost';
      default: return '';
    }
  };

  const columns = [
    { header: 'Customer Name', accessor: 'customer', render: (row) => (
      <div className="lead-name-cell">
        <div className="avatar-circle">{row.customer?.name?.charAt(0) || 'N'}</div>
        <div>
          <div className="font-bold">{row.customer?.name || 'Unknown'}</div>
          <div className="text-muted text-sm">{row.customer?.mobile || ''}</div>
        </div>
      </div>
    )},
    { header: 'Source', accessor: 'source' },
    { header: 'System', accessor: 'interestedSystem' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`status-badge ${getStatusColor(row.status)}`}>{row.status}</span>
    )},
    { header: 'Assigned To', accessor: 'assignedTo', render: (row) => row.assignedTo?.name || 'Unassigned' },
    { header: 'Date', accessor: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString('en-GB') },
    { header: 'Actions', width: '120px', render: (row) => (
      <div className="action-buttons">
        {/* YAHAN ROW._ID USE HO RAHI HAI JO MONGOOSE KI ASLI ID HAI */}
        <button className="icon-btn view" onClick={() => navigate(`/admin/leads/${row._id}`)}><FiEye /></button>
        <button className="icon-btn edit" onClick={() => {
          setEditingLead(row);
          setIsModalOpen(true);
        }}><FiEdit2 /></button>
        <button className="icon-btn delete" onClick={() => handleDeleteClick(row._id)}><FiTrash2 /></button>
      </div>
    )}
  ];

  if (isLoading) return <Loader text="Loading leads..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="lead-page">
      <div className="page-header">
        <div>
          <h1>Lead Management</h1>
          <p>Track and manage your potential customers</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => {
          setEditingLead(null);
          setIsModalOpen(true);
        }}>
          Add New Lead
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search leads by name or mobile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'New', value: 'New' },
            { label: 'Interested', value: 'Interested' },
            { label: 'Converted', value: 'Converted' }
          ]} />
        </div>
      </div>

      <Table columns={columns} data={leads.filter(l => l.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.customer?.mobile?.includes(searchTerm))} emptyMessage="No leads found." />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingLead(null); }} title={editingLead ? "Edit Lead" : "Create New Lead"} size="md">
        <LeadForm initialData={editingLead || {}} onSubmit={handleFormSubmit} onCancel={() => { setIsModalOpen(false); setEditingLead(null); }} />
      </Modal>
    </div>
  );
};

export default LeadList;