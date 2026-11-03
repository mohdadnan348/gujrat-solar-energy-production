import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import LeadForm from './LeadForm';
import leadService from '../../../services/leadService';
import './LeadList.css';

const statuses = ['New', 'Contacted', 'Interested', 'Site Visit', 'Converted', 'Lost'];

const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const navigate = useNavigate();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const result = await leadService.getAll(params.toString());
      setLeads(Array.isArray(result) ? result : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your team leads.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingLead?._id) await leadService.update(editingLead._id, payload);
      else await leadService.create(payload);
      setModalOpen(false);
      setEditingLead(null);
      await fetchLeads();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Unable to save lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadService.delete(id);
      await fetchLeads();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Unable to delete lead.');
    }
  };

  const getStatusClass = (status) => `hr-lead-status hr-lead-status-${(status || 'new').toLowerCase().replaceAll(' ', '-')}`;
  const filtered = useMemo(() => leads.filter((lead) => {
    const term = search.toLowerCase();
    return lead.customer?.name?.toLowerCase().includes(term) ||
      lead.customer?.mobile?.includes(term) ||
      lead.source?.toLowerCase().includes(term) ||
      lead.interestedSystem?.toLowerCase().includes(term);
  }), [leads, search]);

  const columns = [
    { header: 'Customer', accessor: 'customer', render: (row) => (
      <div className="hr-lead-customer"><span className="hr-lead-avatar">{row.customer?.name?.charAt(0) || '?'}</span>
        <div><strong>{row.customer?.name || 'Unknown Customer'}</strong><small>{row.customer?.mobile || 'No mobile'}</small></div>
      </div>
    )},
    { header: 'Source', accessor: 'source' },
    { header: 'Interested System', accessor: 'interestedSystem', render: (row) => row.interestedSystem || '—' },
    { header: 'Assigned To', accessor: 'assignedTo', render: (row) => row.assignedTo?.name || 'Unassigned' },
    { header: 'Status', accessor: 'status', render: (row) => <span className={getStatusClass(row.status)}>{row.status}</span> },
    { header: 'Follow-up', accessor: 'followUpDate', render: (row) => row.followUpDate ? new Date(row.followUpDate).toLocaleDateString('en-IN') : '—' },
    { header: 'Actions', render: (row) => (
      <div className="hr-lead-actions">
        <button type="button" title="View" className="view" onClick={() => navigate(`/hr/leads/${row._id}`)}><FiEye /></button>
        <button type="button" title="Edit" className="edit" onClick={() => { setEditingLead(row); setModalOpen(true); }}><FiEdit2 /></button>
        <button type="button" title="Delete" className="delete" onClick={() => handleDelete(row._id)}><FiTrash2 /></button>
      </div>
    )}
  ];

  if (loading) return <Loader text="Loading HR team leads..." />;

  return (
    <section className="hr-lead-page">
      <header className="hr-lead-header">
        <div><h1>Team Lead Management</h1><p>Manage leads and follow-ups for your assigned employees.</p></div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => { setEditingLead(null); setModalOpen(true); }}>Add New Lead</Button>
      </header>
      {error && <div className="hr-lead-error">{error}</div>}
      <div className="hr-lead-toolbar">
        <div className="hr-lead-search"><FiSearch /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, mobile, source or system..." /></div>
        <div className="hr-lead-filter"><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ label: 'All Statuses', value: '' }, ...statuses.map((value) => ({ label: value, value }))]} /></div>
      </div>
      <div className="hr-lead-stats">
        <div><span>Total Leads</span><strong>{leads.length}</strong></div>
        <div><span>New</span><strong>{leads.filter((lead) => lead.status === 'New').length}</strong></div>
        <div><span>Follow-up Due</span><strong>{leads.filter((lead) => lead.followUpDate && new Date(lead.followUpDate) < new Date() && !['Converted', 'Lost'].includes(lead.status)).length}</strong></div>
        <div><span>Converted</span><strong>{leads.filter((lead) => lead.status === 'Converted').length}</strong></div>
      </div>
      <Table columns={columns} data={filtered} emptyMessage="No leads found for your team." />
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingLead(null); }}
        title={editingLead ? 'Update Lead' : 'Create New Lead'} size="md">
        <LeadForm initialData={editingLead || {}} onSubmit={handleSave} onCancel={() => { setModalOpen(false); setEditingLead(null); }} isSubmitting={saving} />
      </Modal>
    </section>
  );
};

export default LeadList;
