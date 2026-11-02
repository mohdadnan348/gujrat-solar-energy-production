import { useState, useEffect } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import InlineCustomerModal from '../../../components/Common/InlineCustomerModal';
import customerService from '../../../services/customerService';
import employeeService from '../../../services/employeeService';
import './LeadForm.css';

const LeadForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: initialData.customer?._id || initialData.customerId || '',
    source: initialData.source || '',
    interestedSystem: initialData.interestedSystem || '',
    status: initialData.status || 'New',
    assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
    requirementNotes: initialData.requirementNotes || ''
  });

  // Customers aur Employees dono fetch karo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, employeeData] = await Promise.all([
          customerService.getAll(),
          employeeService.getAll(),
        ]);
        setCustomers(customerData);
        setEmployees(employeeData);
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Naya customer bane toh dropdown me add karo aur select karo
  const handleCustomerCreated = (newCustomer) => {
    setCustomers([...customers, newCustomer]);
    setFormData({ ...formData, customerId: newCustomer._id });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      customerId: formData.customerId,
      source: formData.source,
      interestedSystem: formData.interestedSystem,
      status: formData.status,
      assignedTo: formData.assignedTo,
      requirementNotes: formData.requirementNotes
    };
    onSubmit(payload);
  };

  if (isLoading) {
    return <div className="form-loading">Loading dropdown data...</div>;
  }

  return (
    <>
      <form className="lead-form" onSubmit={handleSubmit}>
        
        <h4 className="form-section-title">Customer Information</h4>
        <div className="form-group">
          <label className="form-label">Select Customer <span className="required">*</span></label>
          <div className="customer-select-wrapper">
            <select 
              name="customerId" 
              value={formData.customerId} 
              onChange={handleChange} 
              className="form-select" 
              required
            >
              <option value="">-- Select Existing Customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
            <button 
              type="button" 
              className="create-customer-btn" 
              onClick={() => setIsCustomerModalOpen(true)}
              title="Create New Customer"
            >
              + New
            </button>
          </div>
        </div>

        <h4 className="form-section-title">Lead Details</h4>
        <div className="form-row">
          <Select 
            label="Lead Source" 
            name="source" 
            value={formData.source} 
            onChange={handleChange}
            options={[
              { label: 'Select Source', value: '' },
              { label: 'Facebook / Social Media', value: 'Facebook' },
              { label: 'Reference', value: 'Reference' },
              { label: 'Walk-in', value: 'Walk-in' },
              { label: 'Website', value: 'Website' },
              { label: 'Call', value: 'Call' },
            ]}
            required
          />
          <Input 
            label="Interested System" 
            name="interestedSystem" 
            value={formData.interestedSystem} 
            onChange={handleChange} 
            placeholder="e.g. 3KW Ongrid" 
          />
        </div>
        
        <div className="form-row">
          <Select 
            label="Assign To (Employee)" 
            name="assignedTo" 
            value={formData.assignedTo} 
            onChange={handleChange}
            options={[
              { label: 'Unassigned', value: '' },
              ...employees.map(emp => ({ label: emp.name, value: emp._id }))
            ]}
          />
          <Select 
            label="Initial Status" 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            options={[
              { label: 'New', value: 'New' },
              { label: 'Contacted', value: 'Contacted' },
              { label: 'Interested', value: 'Interested' },
            ]}
          />
        </div>

        <h4 className="form-section-title">Additional Notes</h4>
        <div className="form-group">
          <label className="form-label">Requirement Notes</label>
          <textarea 
            name="requirementNotes" 
            value={formData.requirementNotes} 
            onChange={handleChange} 
            placeholder="Any special requirements..." 
            className="form-textarea" 
            rows="3"
          ></textarea>
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
          <Button variant="primary" type="submit">
            {initialData._id ? 'Update Lead' : 'Save Lead'}
          </Button>
        </div>
      </form>

      {/* Inline Customer Modal */}
      <InlineCustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
};

export default LeadForm;