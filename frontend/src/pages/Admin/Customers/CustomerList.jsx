import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import CustomerForm from './CustomerForm';
import customerService from '../../../services/customerService';
import './CustomerList.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
      setError('');
    } catch (err) {
      setError('Failed to load customers.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer._id, formData);
      } else {
        await customerService.create(formData);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleDeleteClick = (id) => {
    // Filhaal backend me delete API nahi hai (plan me nahi tha), 
    // isliye hum confirmation alert dikha rahe hain
    alert('Customer deletion is not allowed to prevent data loss.');
  };

  const columns = [
    { header: 'Name', accessor: 'name', render: (row) => (
      <div className="customer-name-cell">
        <div className="avatar-circle">{row.name?.charAt(0) || 'C'}</div>
        <div>
          <div className="font-bold">{row.name}</div>
          <div className="text-muted text-sm">{row.businessName || 'Individual'}</div>
        </div>
      </div>
    )},
    { header: 'Contact', accessor: 'mobile', render: (row) => (
      <div>
        <div className="font-bold">{row.mobile}</div>
        <div className="text-muted text-sm">{row.email || 'No email'}</div>
      </div>
    )},
    { header: 'City', accessor: 'city', render: (row) => row.city || '-' },
    { header: 'State', accessor: 'state', render: (row) => row.state || '-' },
    { header: 'GSTIN', accessor: 'gstin', render: (row) => row.gstin || '-' },
    { header: 'Actions', width: '100px', render: (row) => (
      <div className="action-buttons">
        <button className="icon-btn edit" onClick={() => {
          setEditingCustomer(row);
          setIsModalOpen(true);
        }} title="Edit"><FiEdit2 /></button>
        <button className="icon-btn delete" onClick={() => handleDeleteClick(row._id)} title="Delete"><FiTrash2 /></button>
      </div>
    )}
  ];

  if (isLoading) return <Loader text="Loading customers..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.mobile?.includes(searchTerm)
  );

  return (
    <div className="customer-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer database</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => {
          setEditingCustomer(null);
          setIsModalOpen(true);
        }}>
          Add Customer
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table columns={columns} data={filteredCustomers} emptyMessage="No customers found. Add one to get started." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }} 
        title={editingCustomer ? "Edit Customer" : "Add New Customer"} 
        size="md"
      >
        <CustomerForm 
          initialData={editingCustomer || {}} 
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        />
      </Modal>
    </div>
  );
};

export default CustomerList;