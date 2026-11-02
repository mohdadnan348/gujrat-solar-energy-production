import { useState, useEffect } from 'react';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import employeeService from '../../../services/employeeService';
import './TaskForm.css';

const TaskForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    assignedTo: initialData.assignedTo?._id || initialData.assignedTo || '',
    priority: initialData.priority || 'Normal',
    status: initialData.status || 'To Do',
    dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
  });

  // Employees fetch karo dropdown ke liye
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getAll();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isLoading) {
    return <div className="form-loading">Loading employees...</div>;
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <Input 
        label="Task Title" 
        name="title" 
        value={formData.title} 
        onChange={handleChange} 
        placeholder="e.g. Site Visit for Solar Installation" 
        required 
      />
      
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange}
          placeholder="Enter task details and instructions..."
          className="form-textarea"
          rows="3"
        ></textarea>
      </div>

      <div className="form-row">
        <Select 
          label="Assign To" 
          name="assignedTo" 
          value={formData.assignedTo} 
          onChange={handleChange}
          options={[
            { label: 'Select Employee', value: '' },
            ...employees.map(emp => ({ label: emp.name, value: emp._id }))
          ]}
          required
        />
        <Input 
          label="Due Date" 
          name="dueDate" 
          type="date" 
          value={formData.dueDate} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div className="form-row">
        <Select 
          label="Priority" 
          name="priority" 
          value={formData.priority} 
          onChange={handleChange}
          options={[
            { label: 'Low', value: 'Low' },
            { label: 'Normal', value: 'Normal' },
            { label: 'High', value: 'High' },
            { label: 'Urgent', value: 'Urgent' },
          ]}
        />
        <Select 
          label="Status" 
          name="status" 
          value={formData.status} 
          onChange={handleChange}
          options={[
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Blocked', value: 'Blocked' },
            { label: 'Completed', value: 'Completed' },
          ]}
        />
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit">
          {initialData._id ? 'Update Task' : 'Save Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;