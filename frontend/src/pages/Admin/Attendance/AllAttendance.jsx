import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiCalendar, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import CorrectAttendance from './CorrectAttendance';
import attendanceService from '../../../services/attendanceService';
import './AllAttendance.css';

const AllAttendance = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Aaj ki date default
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getAllAttendance(selectedDate);
      setAttendanceList(data);
      setError('');
    } catch (err) {
      setError('Failed to load attendance records.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleCorrectSubmit = async (formData) => {
    try {
      await attendanceService.correctAttendance(selectedRecord._id, formData);
      setIsModalOpen(false);
      setSelectedRecord(null);
      fetchAttendance(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to correct attendance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'status-present';
      case 'Absent': return 'status-absent';
      case 'Half-Day': return 'status-halfday';
      case 'Late': return 'status-late';
      case 'Weekly Off': return 'status-off';
      case 'Holiday': return 'status-holiday';
      case 'Paid Leave': return 'status-paid-leave';
      case 'Unpaid Leave': return 'status-unpaid-leave';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present': return <FiCheckCircle />;
      case 'Absent': return <FiXCircle />;
      case 'Half-Day': return <FiClock />;
      default: return null;
    }
  };

  const columns = [
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div className="employee-cell">
        <div className="avatar-sm">{row.employee?.name?.charAt(0) || 'E'}</div>
        <span className="font-bold">{row.employee?.name || 'Unknown'}</span>
      </div>
    )},
    { header: 'Date', accessor: 'date', render: (row) => (
      new Date(row.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    )},
    { header: 'Check In', accessor: 'checkIn', render: (row) => (
      row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'
    )},
    { header: 'Check Out', accessor: 'checkOut', render: (row) => (
      row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'
    )},
    { header: 'Work Hours', accessor: 'workHours', render: (row) => (
      row.workHours > 0 ? `${row.workHours} hrs` : '-'
    )},
    { header: 'Status', accessor: 'status', render: (row) => (
      <div className="status-cell">
        <span className={`status-badge ${getStatusColor(row.status)}`}>
          {getStatusIcon(row.status)} {row.status}
        </span>
        {row.isCorrected && <span className="corrected-tag">Corrected</span>}
      </div>
    )},
    { header: 'Actions', width: '80px', render: (row) => (
      <button className="icon-btn edit" onClick={() => {
        setSelectedRecord(row);
        setIsModalOpen(true);
      }}>
        <FiEdit />
      </button>
    )}
  ];

  if (isLoading) return <Loader text="Loading attendance..." />;
  if (error) return <div className="error-message">{error}</div>;

  const filteredList = attendanceList.filter(item => 
    item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>View and manage employee attendance records</p>
        </div>
        <div className="date-filter">
          <FiCalendar className="date-icon" />
          <input 
            type="date" 
            className="date-input" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by employee name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <Select options={[
            { label: 'All Statuses', value: '' },
            { label: 'Present', value: 'Present' },
            { label: 'Absent', value: 'Absent' },
            { label: 'Half-Day', value: 'Half-Day' },
          ]} />
        </div>
      </div>

      <Table columns={columns} data={filteredList} emptyMessage="No attendance records found for this date." />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedRecord(null); }} 
        title="Correct Attendance" 
        size="sm"
      >
        <CorrectAttendance 
          record={selectedRecord}
          onSubmit={handleCorrectSubmit}
          onCancel={() => { setIsModalOpen(false); setSelectedRecord(null); }}
        />
      </Modal>
    </div>
  );
};

export default AllAttendance;