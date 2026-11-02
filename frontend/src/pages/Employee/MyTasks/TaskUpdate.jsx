import { useState } from 'react';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import './TaskUpdate.css';

const TaskUpdate = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    status: initialData.status || 'To Do',
    comment: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="task-update-form" onSubmit={handleSubmit}>
      <div className="info-banner">
        <p><strong>Task:</strong> {initialData.title}</p>
        <p><strong>Priority:</strong> {initialData.priority || 'Normal'}</p>
        <p><strong>Due Date:</strong> {initialData.dueDate ? new Date(initialData.dueDate).toLocaleDateString('en-GB') : 'N/A'}</p>
      </div>

      <Select 
        label="Update Status" 
        name="status" 
        value={formData.status} 
        onChange={handleChange}
        options={[
          { label: 'To Do', value: 'To Do' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Blocked', value: 'Blocked' },
          { label: 'Completed', value: 'Completed' },
        ]}
        required
      />

      <div className="form-group">
        <label className="form-label">Progress Notes / Comments</label>
        <textarea 
          name="comment" 
          value={formData.comment} 
          onChange={handleChange}
          placeholder="e.g. Site visit done. Material awaited."
          className="form-textarea"
          rows="3"
        ></textarea>
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">Update Task</Button>
      </div>
    </form>
  );
};

export default TaskUpdate;