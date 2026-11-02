import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiCheckCircle, FiClock } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Button from '../../../components/Common/Button';
import Modal from '../../../components/Common/Modal';
import Select from '../../../components/Common/Select';
import Loader from '../../../components/Common/Loader';
import TaskForm from './TaskForm';
import taskService from '../../../services/taskService';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getAll();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to load tasks.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTask) {
        // Backend me task edit karne ka endpoint nahi hai (sirf status update hota hai)
        // Isliye hum alert dikha rahe hain
        alert('Task editing is not supported. Please create a new task or update status from Employee panel.');
      } else {
        await taskService.create(formData);
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.delete(id);
        fetchTasks();
      } catch (err) {
        alert('Failed to delete task');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'To Do': return <FiClock className="status-icon todo" />;
      case 'In Progress': return <FiClock className="status-icon progress" />;
      case 'Completed': return <FiCheckCircle className="status-icon completed" />;
      default: return null;
    }
  };

  const columns = [
    { header: 'Task Details', accessor: 'title', render: (row) => (
      <div className="task-cell">
        <div className="font-bold">{row.title}</div>
        <div className="text-muted text-sm">{row.description || ''}</div>
      </div>
    )},
    { header: 'Assigned To', accessor: 'assignedTo', render: (row) => row.assignedTo?.name || 'Unassigned' },
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <span className={`priority-badge ${getPriorityColor(row.priority)}`}>{row.priority}</span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <div className="status-cell">
        {getStatusIcon(row.status)}
        <span>{row.status}</span>
      </div>
    )},
    { header: 'Due Date', accessor: 'dueDate', render: (row) => (
      row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-GB') : '-'
    )},
    { header: 'Actions', width: '80px', render: (row) => (
      <div className="action-buttons">
        <button className="icon-btn delete" onClick={() => handleDelete(row._id)}><FiTrash2 /></button>
      </div>
    )}
  ];

  if (isLoading) return <Loader text="Loading tasks..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="task-page">
      <div className="page-header">
        <div>
          <h1>Task Management</h1>
          <p>Assign and monitor employee tasks</p>
        </div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}>
          Create Task
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by task or employee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Completed', value: 'Completed' }
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredTasks} emptyMessage="No tasks found." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }} 
        title="Create New Task" 
        size="md"
      >
        <TaskForm 
          initialData={editingTask || {}} 
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsModalOpen(false); setEditingTask(null); }}
        />
      </Modal>
    </div>
  );
};

export default TaskList;