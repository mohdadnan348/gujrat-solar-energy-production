import { useState } from 'react';
import Input from './Input';
import Button from './Button';
import customerService from '../../services/customerService';
import './Modal.css'; // Purani modal CSS use kar rahe hain

const InlineCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const newCustomer = await customerService.create(formData);
      onCustomerCreated(newCustomer); // Parent ko batao ki customer ban gaya
      onClose(); // Modal band karo
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create New Customer</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <Input label="Name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter name" required />
              <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile number" required />
            </div>
            <div className="form-row">
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email (Optional)" />
              <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
            </div>
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
            
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
              <Button variant="primary" type="submit" isLoading={isLoading}>Save Customer</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InlineCustomerModal;