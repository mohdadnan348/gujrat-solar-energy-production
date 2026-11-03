import { useEffect, useState } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import employeeService from '../../../services/employeeService';
import './TaskForm.css';

const TaskForm = ({ initialData = {}, onSubmit, onCancel, isSubmitting = false }) => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeError, setEmployeeError] = useState('');
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
    priority: initialData.priority || 'Normal',
    status: initialData.status || 'To Do',
    startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : '',
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : ''
  });

  useEffect(() => {
    let active = true;
    const loadEmployees = async () => {
      try {
        const result = await employeeService.getAll();
        if (active) setEmployees(Array.isArray(result) ? result.filter((item) => item.role === 'Employee') : []);
      } catch (error) {
        if (active) setEmployeeError(error.response?.data?.message || 'Unable to load your employees.');
      } finally {
        if (active) setLoadingEmployees(false);
      }
    };
    loadEmployees();
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  if (loadingEmployees) return <div className="hr-task-loading">Loading your team...</div>;

  return (
    <form className="hr-task-form" onSubmit={handleSubmit}>
      {employeeError && <div className="hr-task-error">{employeeError}</div>}
      <Input label="Task Title" name="title" value={formData.title} onChange={handleChange}
        placeholder="e.g. Site Visit for Solar Installation" required />
      <div className="hr-task-form-group">
        <label htmlFor="task-description">Description</label>
        <textarea id="task-description" name="description" value={formData.description}
          onChange={handleChange} placeholder="Enter task details and instructions..." rows="3" />
      </div>
      <div className="hr-task-form-row">
        <Select label="Assign To" name="assignedTo" value={formData.assignedTo} onChange={handleChange}
          options={[{ label: 'Select Employee', value: '' },
            ...employees.map((employee) => ({ label: employee.name, value: employee._id }))]} required />
        <Input label="Due Date" name="dueDate" type="date" value={formData.dueDate}
          onChange={handleChange} required />
      </div>
      <div className="hr-task-form-row">
        <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
        <Select label="Priority" name="priority" value={formData.priority} onChange={handleChange}
          options={['Low', 'Normal', 'High', 'Urgent'].map((value) => ({ label: value, value }))} />
      </div>
      {initialData._id && (
        <Select label="Status" name="status" value={formData.status} onChange={handleChange}
          options={['To Do', 'In Progress', 'Blocked', 'Completed'].map((value) => ({ label: value, value }))} />
      )}
      <div className="hr-task-form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={isSubmitting || employees.length === 0}>
          {isSubmitting ? 'Saving...' : initialData._id ? 'Update Task' : 'Assign Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
