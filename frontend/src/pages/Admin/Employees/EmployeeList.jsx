import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import EmployeeForm from './EmployeeForm';
import employeeService from '../../../services/employeeService';
import { useAuth } from '../../../context/AuthContext';
import './EmployeeList.css';

const errorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const normRole = (role) => String(role || '').toLowerCase();

export default function EmployeeList() {
  const { user } = useAuth();
  const role = normRole(user?.role || user?.userRole || user?.accountType);
  const canCreateHR = role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const data = await employeeService.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load team members.'));
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false); setEditingEmployee(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSaving(true); setNotice('');
    try {
      if (editingEmployee?._id) {
        const { role: ignoredRole, ...updateData } = formData;
        await employeeService.update(editingEmployee._id, updateData);
        setNotice('Account updated successfully.');
      } else {
        const payload = { ...formData, role: canCreateHR && formData.role === 'HR' ? 'HR' : 'Employee' };
        await employeeService.create(payload);
        setNotice(payload.role === 'HR' ? 'HR account created successfully.' : 'Employee created successfully.');
      }
      setIsModalOpen(false); setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      throw new Error(errorMessage(err, 'Failed to save account.'));
    } finally { setIsSaving(false); }
  };

  const handleDeactivate = async (record) => {
    if (!window.confirm(`Deactivate ${record.name || 'this account'}?`)) return;
    setNotice('');
    try {
      await employeeService.deactivate(record._id);
      setNotice('Account deactivated successfully.');
      await fetchEmployees();
    } catch (err) { setError(errorMessage(err, 'Failed to deactivate account.')); }
  };

  const currency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return employees.filter((item) => {
      const searchMatch = !query || item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) || String(item.mobile || '').includes(query);
      const statusMatch = !statusFilter ||
        (statusFilter === 'Active' ? item.isActive !== false : item.isActive === false);
      const roleMatch = !canCreateHR || !roleFilter || normRole(item.role) === roleFilter;
      return searchMatch && statusMatch && roleMatch;
    });
  }, [employees, searchTerm, statusFilter, roleFilter, canCreateHR]);

  const columns = [
    { header: 'Team Member', accessor: 'name', render: (row) => <div className="employee-profile-cell">
      <div className="avatar-circle">{row.name?.charAt(0) || 'U'}</div>
      <div><div className="font-bold">{row.name || '—'}</div><div className="text-muted text-sm">{row.role || 'Employee'}</div></div>
    </div> },
    { header: 'Contact Info', accessor: 'mobile', render: (row) => <div className="contact-info-cell">
      <div className="contact-item"><FiPhone className="icon" /> {row.mobile || '—'}</div>
      <div className="contact-item"><FiMail className="icon" /> {row.email || '—'}</div>
    </div> },
    { header: 'Monthly Salary', accessor: 'monthlySalary', render: (row) => <div className="salary-cell"><FiBriefcase className="icon" /> {currency(row.monthlySalary)}</div> },
    { header: 'Status', accessor: 'isActive', render: (row) => <span className={`status-badge ${row.isActive === false ? 'status-inactive' : 'status-active'}`}>
      {row.isActive === false ? 'Inactive' : 'Active'}
    </span> },
    { header: 'Actions', width: '100px', render: (row) => <div className="action-buttons">
      <button type="button" className="icon-btn edit" title="Edit account" onClick={() => { setEditingEmployee(row); setIsModalOpen(true); }}><FiEdit2 /></button>
      {row.isActive !== false && <button type="button" className="icon-btn delete" title="Deactivate account" onClick={() => handleDeactivate(row)}><FiTrash2 /></button>}
    </div> },
  ];

  if (isLoading && employees.length === 0) return <Loader text="Loading team members..." />;

  return <div className="employee-page">
    <div className="page-header">
      <div><h1>{canCreateHR ? 'Team Management' : 'Employee Management'}</h1>
        <p>{canCreateHR ? 'Create HR accounts and manage employees' : 'Manage employees reporting to you'}</p></div>
      <div className="employee-header-actions">
        <Button variant="secondary" icon={<FiRefreshCw />} onClick={fetchEmployees}>Refresh</Button>
        <Button variant="primary" icon={<FiPlus />} onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}>
          Add {canCreateHR ? 'Team Member' : 'Employee'}
        </Button>
      </div>
    </div>
    {error && <div className="employee-alert error" role="alert">{error}<button type="button" onClick={fetchEmployees}>Retry</button></div>}
    {notice && <div className="employee-alert success" role="status">{notice}</div>}
    <div className="toolbar">
      <div className="search-box"><FiSearch className="search-icon" />
        <input type="search" placeholder="Search name, mobile or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      <div className="filter-actions">
        {canCreateHR && <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          options={[{ label: 'All Roles', value: '' }, { label: 'HR', value: 'hr' }, { label: 'Employee', value: 'employee' }]} />}
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ label: 'All Statuses', value: '' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
      </div>
    </div>
    {isLoading && <div className="employee-refreshing">Refreshing team data...</div>}
    <Table columns={columns} data={filtered} emptyMessage="No team members found." />
    <Modal isOpen={isModalOpen} onClose={closeModal}
      title={editingEmployee ? 'Edit Account' : canCreateHR ? 'Add HR / Employee' : 'Add New Employee'} size="md">
      <EmployeeForm key={editingEmployee?._id || 'new-team-member'} initialData={editingEmployee || {}}
        onSubmit={handleFormSubmit} onCancel={closeModal} isSubmitting={isSaving}
        canCreateHR={canCreateHR && !editingEmployee} />
    </Modal>
  </div>;
}
