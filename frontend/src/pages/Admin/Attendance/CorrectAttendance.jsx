import { useState } from 'react';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './CorrectAttendance.css';

const CorrectAttendance = ({ record, onSubmit, onCancel }) => {
  const [status, setStatus] = useState(record?.status || 'Present');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Correction reason is required for audit trail.');
      return;
    }
    onSubmit({ status, correctionReason: reason });
  };

  return (
    <form className="correct-attendance-form" onSubmit={handleSubmit}>
      <div className="info-banner">
        <p><strong>Employee:</strong> {record?.employee?.name || 'Unknown'}</p>
        <p><strong>Date:</strong> {record?.date ? new Date(record.date).toLocaleDateString('en-GB') : 'N/A'}</p>
        <p><strong>Current Status:</strong> {record?.status || 'N/A'}</p>
      </div>

      <Select 
        label="New Status" 
        name="status" 
        value={status} 
        onChange={(e) => setStatus(e.target.value)}
        options={[
          { label: 'Present', value: 'Present' },
          { label: 'Absent', value: 'Absent' },
          { label: 'Half-Day', value: 'Half-Day' },
          { label: 'Late', value: 'Late' },
          { label: 'Paid Leave', value: 'Paid Leave' },
          { label: 'Unpaid Leave', value: 'Unpaid Leave' },
        ]}
        required
      />

      <div className="form-group">
        <label className="form-label">Correction Reason <span className="required">*</span></label>
        <textarea 
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          placeholder="Why is this correction being made? (e.g. Employee forgot to checkout)"
          className={`form-textarea ${error ? 'has-error' : ''}`}
          rows="3"
        ></textarea>
        {error && <span className="error-text">{error}</span>}
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">Apply Correction</Button>
      </div>
    </form>
  );
};

export default CorrectAttendance;