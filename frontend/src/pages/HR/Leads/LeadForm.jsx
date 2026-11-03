import { useEffect, useState } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import InlineCustomerModal from '../../../components/Common/InlineCustomerModal';
import customerService from '../../../services/customerService';
import employeeService from '../../../services/employeeService';
import './LeadForm.css';

const LeadForm = ({ initialData = {}, onSubmit, onCancel, isSubmitting = false }) => {
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formData, setFormData] = useState({
    customerId: initialData.customer?._id || initialData.customerId || '',
    source: initialData.source || '',
    interestedSystem: initialData.interestedSystem || '',
    location: initialData.location || '',
    status: initialData.status || 'New',
    assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
    followUpDate: initialData.followUpDate ? new Date(initialData.followUpDate).toISOString().slice(0, 10) : '',
    requirementNotes: initialData.requirementNotes || ''
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [customerData, employeeData] = await Promise.all([
          customerService.getAll(), employeeService.getAll()
        ]);
        if (!active) return;
        setCustomers(Array.isArray(customerData) ? customerData : []);
        setEmployees(Array.isArray(employeeData) ? employeeData.filter((emp) => emp.role === 'Employee') : []);
      } catch (error) {
        if (active) setLoadError(error.response?.data?.message || 'Unable to load customers or employees.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCustomerCreated = (customer) => {
    setCustomers((current) => [...current, customer]);
    setFormData((current) => ({ ...current, customerId: customer._id }));
    setCustomerModalOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      customerId: formData.customerId,
      source: formData.source,
      interestedSystem: formData.interestedSystem,
      location: formData.location,
      status: formData.status,
      assignedTo: formData.assignedTo || undefined,
      followUpDate: formData.followUpDate || undefined,
      requirementNotes: formData.requirementNotes
    });
  };

  if (loading) return <div className="hr-lead-loading">Loading your lead data...</div>;

  return (
    <>
      <form className="hr-lead-form" onSubmit={handleSubmit}>
        {loadError && <div className="hr-lead-error">{loadError}</div>}
        <h4 className="hr-lead-section-title">Customer Information</h4>
        <div className="hr-lead-form-group">
          <label htmlFor="lead-customer">Select Customer <span>*</span></label>
          <div className="hr-lead-customer-select">
            <select id="lead-customer" name="customerId" value={formData.customerId} onChange={handleChange} required>
              <option value="">-- Select Existing Customer --</option>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} ({customer.mobile})</option>)}
            </select>
            <button type="button" onClick={() => setCustomerModalOpen(true)}>+ New</button>
          </div>
        </div>

        <h4 className="hr-lead-section-title">Lead Details</h4>
        <div className="hr-lead-row">
          <Select label="Lead Source" name="source" value={formData.source} onChange={handleChange}
            options={[
              { label: 'Select Source', value: '' },
              ...['Facebook', 'Reference', 'Walk-in', 'Website', 'Call', 'WhatsApp', 'Google Ads', 'Other'].map((value) => ({ label: value, value }))
            ]} required />
          <Input label="Interested System" name="interestedSystem" value={formData.interestedSystem}
            onChange={handleChange} placeholder="e.g. 3KW On-grid" />
        </div>
        <div className="hr-lead-row">
          <Select label="Assign To Employee" name="assignedTo" value={formData.assignedTo} onChange={handleChange}
            options={[{ label: 'Select Employee', value: '' }, ...employees.map((emp) => ({ label: emp.name, value: emp._id }))]} required />
          <Input label="Follow-up Date" name="followUpDate" type="date" value={formData.followUpDate} onChange={handleChange} />
        </div>
        <div className="hr-lead-row">
          <Input label="Location / Site Address" name="location" value={formData.location} onChange={handleChange} placeholder="Enter customer site location" />
          <Select label="Lead Status" name="status" value={formData.status} onChange={handleChange}
            options={['New', 'Contacted', 'Interested', 'Site Visit', 'Converted', 'Lost'].map((value) => ({ label: value, value }))} />
        </div>
        <h4 className="hr-lead-section-title">Requirement Notes</h4>
        <div className="hr-lead-form-group">
          <textarea name="requirementNotes" value={formData.requirementNotes} onChange={handleChange}
            placeholder="Customer requirement, roof details, budget, site visit notes..." rows="4" />
        </div>
        <div className="hr-lead-form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting || employees.length === 0}>
            {isSubmitting ? 'Saving...' : initialData._id ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
      <InlineCustomerModal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onCustomerCreated={handleCustomerCreated} />
    </>
  );
};

export default LeadForm;
