import { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import TaskUpdate from './TaskUpdate';
import taskService from '../../../services/taskService';
import './MyTasks.css';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Backend me Employee ko automatically sirf apne tasks milte hain
      const data = await taskService.getAll();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to load your tasks.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateSubmit = async (formData) => {
    try {
      await taskService.updateStatus(selectedTask._id, formData.status, formData.comment);
      setIsModalOpen(false);
      setSelectedTask(null);
      fetchTasks(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
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
      case 'Blocked': return <FiAlertCircle className="status-icon blocked" />;
      default: return null;
    }
  };

  const columns = [
    { header: 'Task Title', accessor: 'title', render: (row) => (
      <div className="task-cell">
        <div className="font-bold">{row.title}</div>
        <div className="text-muted text-sm">{row.description || ''}</div>
      </div>
    )},
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <span className={`priority-badge ${getPriorityColor(row.priority)}`}>{row.priority}</span>
    )},
    { header: 'Due Date', accessor: 'dueDate', render: (row) => (
      row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-GB') : 'N/A'
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <div className="status-cell">
        {getStatusIcon(row.status)}
        <span>{row.status}</span>
      </div>
    )},
    { header: 'Actions', width: '80px', render: (row) => (
      <button className="icon-btn edit" onClick={() => {
        setSelectedTask(row);
        setIsModalOpen(true);
      }} title="Update Task">
        <FiEdit2 />
      </button>
    )}
  ];

  if (isLoading) return <Loader text="Loading your tasks..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredTasks = tasks.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p>View and update your assigned tasks</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'To Do', value: 'To Do' },
            { label: 'In Progress', value: 'In Progress' },
            { label: 'Completed', value: 'Completed' },
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredTasks} emptyMessage="No tasks assigned to you yet." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }} 
        title="Update Task Status" 
        size="sm"
      >
        <TaskUpdate 
          initialData={selectedTask || {}} 
          onSubmit={handleUpdateSubmit}
          onCancel={() => { setIsModalOpen(false); setSelectedTask(null); }}
        />
      </Modal>
    </div>
  );
};

export default MyTasks;