import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './ApplyLeave.css';

const ApplyLeave = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="apply-leave-form" onSubmit={handleSubmit}>
      <Select 
        label="Leave Type" 
        name="leaveType" 
        value={formData.leaveType} 
        onChange={handleChange}
        options={[
          { label: 'Sick Leave', value: 'Sick Leave' },
          { label: 'Casual Leave', value: 'Casual Leave' },
          { label: 'Unpaid Leave', value: 'Unpaid Leave' },
        ]}
        required
      />
      
      <div className="form-row">
        <Input 
          label="Start Date" 
          name="startDate" 
          type="date" 
          value={formData.startDate} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="End Date" 
          name="endDate" 
          type="date" 
          value={formData.endDate} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Reason for Leave <span className="required">*</span></label>
        <textarea 
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Please provide a brief reason for your leave..."
          className="form-textarea"
          rows="3"
          required
        ></textarea>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" icon={<FiSend />} type="submit">Submit Application</Button>
      </div>
    </form>
  );
};

export default ApplyLeave;