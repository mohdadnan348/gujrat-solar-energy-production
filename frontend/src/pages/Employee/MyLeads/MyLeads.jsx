import { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiEye, FiTarget } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import Button from '../../../components/Common/Button';
import LeadUpdate from './LeadUpdate';
import leadService from '../../../services/leadService';
import './MyLeads.css';

const MyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      // Employee ko automatically sirf apne leads milenge (backend me filter hai)
      const data = await leadService.getAll();
      setLeads(data);
      setError('');
    } catch (err) {
      setError('Failed to load your leads.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateSubmit = async (formData) => {
    try {
      await leadService.update(selectedLead._id, formData);
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'status-new';
      case 'Contacted': return 'status-contacted';
      case 'Interested': return 'status-interested';
      case 'Site Visit': return 'status-sitevisit';
      case 'Converted': return 'status-converted';
      case 'Lost': return 'status-lost';
      default: return '';
    }
  };

  const columns = [
    { header: 'Customer', accessor: 'customer', render: (row) => (
      <div className="customer-cell">
        <div className="avatar-sm">{row.customer?.name?.charAt(0) || 'N'}</div>
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
    { header: 'Follow-up Date', accessor: 'followUpDate', render: (row) => (
      row.followUpDate ? new Date(row.followUpDate).toLocaleDateString('en-GB') : 'Not set'
    )},
    { header: 'Actions', width: '100px', render: (row) => (
      <div className="action-buttons">
        <button className="icon-btn edit" onClick={() => {
          setSelectedLead(row);
          setIsModalOpen(true);
        }} title="Update Lead">
          <FiEdit2 />
        </button>
      </div>
    )}
  ];

  if (isLoading) return <Loader text="Loading your leads..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredLeads = leads.filter(l => 
    l.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.customer?.mobile?.includes(searchTerm)
  );

  return (
    <div className="myleads-page">
      <div className="page-header">
        <div>
          <h1>My Leads</h1>
          <p>Update status and follow-ups for your assigned leads</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by customer name or mobile..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'New', value: 'New' },
            { label: 'Contacted', value: 'Contacted' },
            { label: 'Interested', value: 'Interested' },
            { label: 'Converted', value: 'Converted' }
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredLeads} emptyMessage="No leads assigned to you yet." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedLead(null); }} 
        title="Update Lead Status" 
        size="sm"
      >
        <LeadUpdate 
          initialData={selectedLead || {}} 
          onSubmit={handleUpdateSubmit}
          onCancel={() => { setIsModalOpen(false); setSelectedLead(null); }}
        />
      </Modal>
    </div>
  );
};

export default MyLeads;