import { useState } from 'react';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './LeadUpdate.css';

const LeadUpdate = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    status: initialData.status || 'New',
    statusNote: '',
    followUpDate: initialData.followUpDate ? new Date(initialData.followUpDate).toISOString().split('T')[0] : '',
    requirementNotes: initialData.requirementNotes || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="lead-update-form" onSubmit={handleSubmit}>
      <div className="info-banner">
        <p><strong>Customer:</strong> {initialData.customer?.name || 'N/A'}</p>
        <p><strong>Current Status:</strong> {initialData.status || 'N/A'}</p>
      </div>

      <Select 
        label="Update Status" 
        name="status" 
        value={formData.status} 
        onChange={handleChange}
        options={[
          { label: 'New', value: 'New' },
          { label: 'Contacted', value: 'Contacted' },
          { label: 'Interested', value: 'Interested' },
          { label: 'Site Visit', value: 'Site Visit' },
          { label: 'Converted', value: 'Converted' },
          { label: 'Lost', value: 'Lost' },
        ]}
        required
      />

      <div className="form-group">
        <label className="form-label">Status Note</label>
        <textarea 
          name="statusNote" 
          value={formData.statusNote} 
          onChange={handleChange}
          placeholder="e.g. Customer asked to call next week"
          className="form-textarea"
          rows="2"
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Next Follow-up Date</label>
          <input 
            type="date" 
            name="followUpDate" 
            value={formData.followUpDate} 
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Requirement Notes</label>
        <textarea 
          name="requirementNotes" 
          value={formData.requirementNotes} 
          onChange={handleChange}
          placeholder="Any changes in requirement?"
          className="form-textarea"
          rows="2"
        ></textarea>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">Update Lead</Button>
      </div>
    </form>
  );
};

export default LeadUpdate;