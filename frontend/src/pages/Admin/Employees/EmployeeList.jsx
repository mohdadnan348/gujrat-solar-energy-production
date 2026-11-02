import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiBriefcase, FiRefreshCw } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import EmployeeForm from './EmployeeForm';
import employeeService from '../../../services/employeeService';
import './EmployeeList.css';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await employeeService.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load employees. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleFormSubmit = async (formData) => {
    setIsSaving(true);
    setNotice('');
    try {
      if (editingEmployee?._id) {
        await employeeService.update(editingEmployee._id, formData);
        setNotice('Employee updated successfully.');
      } else {
        await employeeService.create(formData);
        setNotice('Employee created successfully.');
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to save employee.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (employee) => {
    if (!window.confirm(`Deactivate ${employee.name || 'this employee'}?`)) return;
    setNotice('');
    try {
      await employeeService.deactivate(employee._id);
      setNotice('Employee deactivated successfully.');
      await fetchEmployees();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to deactivate employee.'));
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query ||
        employee.name?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        String(employee.mobile || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === '' ||
        (statusFilter === 'Active' ? employee.isActive !== false : employee.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  const columns = [
    { header: 'Employee Details', accessor: 'name', render: (row) => (
      <div className="employee-profile-cell">
        <div className="avatar-circle">{row.name?.charAt(0) || 'E'}</div>
        <div><div className="font-bold">{row.name || '—'}</div><div className="text-muted text-sm">{row.role || 'Employee'}</div></div>
      </div>
    )},
    { header: 'Contact Info', accessor: 'mobile', render: (row) => (
      <div className="contact-info-cell">
        <div className="contact-item"><FiPhone className="icon" /> {row.mobile || '—'}</div>
        <div className="contact-item"><FiMail className="icon" /> {row.email || '—'}</div>
      </div>
    )},
    { header: 'Monthly Salary', accessor: 'monthlySalary', render: (row) => (
      <div className="salary-cell"><FiBriefcase className="icon" /> {formatCurrency(row.monthlySalary)}</div>
    )},
    { header: 'Status', accessor: 'isActive', render: (row) => (
      <span className={`status-badge ${row.isActive === false ? 'status-inactive' : 'status-active'}`}>
        {row.isActive === false ? 'Inactive' : 'Active'}
      </span>
    )},
    { header: 'Actions', width: '100px', render: (row) => (
      <div className="action-buttons">
        <button type="button" className="icon-btn edit" title="Edit employee"
          onClick={() => { setEditingEmployee(row); setIsModalOpen(true); }}><FiEdit2 /></button>
        {row.isActive !== false && <button type="button" className="icon-btn delete" title="Deactivate employee"
          onClick={() => handleDeactivate(row)}><FiTrash2 /></button>}
      </div>
    )},
  ];

  if (isLoading && employees.length === 0) return <Loader text="Loading employees..." />;

  return (
    <div className="employee-page">
      <div className="page-header">
        <div><h1>Employee Management</h1><p>Manage your team members and their salaries</p></div>
        <div className="employee-header-actions">
          <Button variant="secondary" icon={<FiRefreshCw />} onClick={fetchEmployees}>Refresh</Button>
          <Button variant="primary" icon={<FiPlus />} onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}>Add Employee</Button>
        </div>
      </div>

      {error && <div className="employee-alert error" role="alert">{error}<button type="button" onClick={fetchEmployees}>Retry</button></div>}
      {notice && <div className="employee-alert success" role="status">{notice}</div>}

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="search" placeholder="Search name, mobile or email..."
            value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        <div className="filter-actions">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: 'All Employees', value: '' },
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
            ]} />
        </div>
      </div>

      {isLoading && <div className="employee-refreshing">Refreshing employee data...</div>}
      <Table columns={columns} data={filteredEmployees} emptyMessage="No employees found." />

      <Modal isOpen={isModalOpen} onClose={closeModal}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'} size="md">
        <EmployeeForm key={editingEmployee?._id || 'new-employee'}
          initialData={editingEmployee || {}} onSubmit={handleFormSubmit}
          onCancel={closeModal} isSubmitting={isSaving} />
      </Modal>
    </div>
  );
};

export default EmployeeList;
