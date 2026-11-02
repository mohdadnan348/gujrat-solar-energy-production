import { useState } from 'react';
import Input from '../../../components/Common/Input';
import Button from '../../../components/Common/Button';
import './CustomerForm.css';

const CustomerForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    mobile: initialData.mobile || '',
    email: initialData.email || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    pincode: initialData.pincode || '',
    gstin: initialData.gstin || '',
    businessName: initialData.businessName || '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      setError('Name and Mobile are required.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <h4 className="form-section-title">Basic Information</h4>
      <div className="form-row">
        <Input 
          label="Customer Name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Enter full name" 
          required 
        />
        <Input 
          label="Mobile Number" 
          name="mobile" 
          value={formData.mobile} 
          onChange={handleChange} 
          placeholder="10-digit mobile" 
          required 
        />
      </div>
      <div className="form-row">
        <Input 
          label="Email (Optional)" 
          name="email" 
          type="email"
          value={formData.email} 
          onChange={handleChange} 
          placeholder="Email address" 
        />
        <Input 
          label="Business Name (Optional)" 
          name="businessName" 
          value={formData.businessName} 
          onChange={handleChange} 
          placeholder="Company name" 
        />
      </div>

      <h4 className="form-section-title">Address Details</h4>
      <div className="form-group">
        <label className="form-label">Full Address</label>
        <textarea 
          name="address" 
          value={formData.address} 
          onChange={handleChange}
          placeholder="House no, street, area..."
          className="form-textarea"
          rows="2"
        ></textarea>
      </div>
      <div className="form-row">
        <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
        <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
        <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" />
      </div>

      <h4 className="form-section-title">Business Details (Optional)</h4>
      <div className="form-row">
        <Input 
          label="GSTIN" 
          name="gstin" 
          value={formData.gstin} 
          onChange={handleChange} 
          placeholder="GST Number" 
        />
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">
          {initialData._id ? 'Update Customer' : 'Save Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;