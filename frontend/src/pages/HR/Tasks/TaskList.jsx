import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const result = await taskService.getAll(params.toString());
      setTasks(Array.isArray(result) ? result : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load HR team tasks.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingTask?._id) await taskService.update(editingTask._id, formData);
      else await taskService.create(formData);
      setModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      await fetchTasks();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Unable to delete task.');
    }
  };

  const getPriorityClass = (priority) => `hr-task-priority hr-task-priority-${(priority || 'normal').toLowerCase()}`;
  const getStatusIcon = (status) => {
    if (status === 'Completed') return <FiCheckCircle />;
    if (status === 'Blocked') return <FiAlertCircle />;
    return <FiClock />;
  };

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const term = search.toLowerCase();
    return task.title?.toLowerCase().includes(term) ||
      task.assignedTo?.name?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term);
  }), [tasks, search]);

  const columns = [
    { header: 'Task Details', accessor: 'title', render: (row) => (
      <div className="hr-task-details"><strong>{row.title}</strong><span>{row.description || 'No description'}</span></div>
    )},
    { header: 'Assigned Employee', accessor: 'assignedTo', render: (row) => (
      <div className="hr-task-employee"><strong>{row.assignedTo?.name || 'Unknown'}</strong><span>{row.assignedTo?.email || ''}</span></div>
    )},
    { header: 'Priority', accessor: 'priority', render: (row) => (
      <span className={getPriorityClass(row.priority)}>{row.priority}</span>
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`hr-task-status hr-task-status-${(row.status || '').toLowerCase().replaceAll(' ', '-')}`}>
        {getStatusIcon(row.status)} {row.status}
      </span>
    )},
    { header: 'Due Date', accessor: 'dueDate', render: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN') : '—' },
    { header: 'Actions', render: (row) => (
      <div className="hr-task-actions">
        <button type="button" className="hr-task-icon-btn edit" title="Edit task"
          onClick={() => { setEditingTask(row); setModalOpen(true); }}><FiEdit2 /></button>
        <button type="button" className="hr-task-icon-btn delete" title="Delete task"
          onClick={() => handleDelete(row._id)}><FiTrash2 /></button>
      </div>
    )}
  ];

  if (loading) return <Loader text="Loading HR team tasks..." />;

  return (
    <section className="hr-task-page">
      <header className="hr-task-header">
        <div><h1>Team Task Management</h1><p>Create, assign and monitor tasks for your employees.</p></div>
        <Button variant="primary" icon={<FiPlus />} onClick={() => { setEditingTask(null); setModalOpen(true); }}>
          Assign New Task
        </Button>
      </header>

      {error && <div className="hr-task-error">{error}</div>}
      <div className="hr-task-toolbar">
        <div className="hr-task-search"><FiSearch /><input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search task, employee or description..." /></div>
        <div className="hr-task-filter"><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ label: 'All Statuses', value: '' }, ...['To Do', 'In Progress', 'Blocked', 'Completed'].map((value) => ({ label: value, value }))]} /></div>
      </div>

      <div className="hr-task-summary">
        <div><span>Total Tasks</span><strong>{tasks.length}</strong></div>
        <div><span>In Progress</span><strong>{tasks.filter((task) => task.status === 'In Progress').length}</strong></div>
        <div><span>Completed</span><strong>{tasks.filter((task) => task.status === 'Completed').length}</strong></div>
        <div><span>Blocked</span><strong>{tasks.filter((task) => task.status === 'Blocked').length}</strong></div>
      </div>

      <Table columns={columns} data={filteredTasks} emptyMessage="No tasks found for your team." />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null); }}
        title={editingTask ? 'Update Task' : 'Assign New Task'} size="md">
        <TaskForm initialData={editingTask || {}} onSubmit={handleSave} isSubmitting={saving}
          onCancel={() => { setModalOpen(false); setEditingTask(null); }} />
      </Modal>
    </section>
  );
};

export default TaskList;
