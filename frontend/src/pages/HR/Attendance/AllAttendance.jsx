import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiEdit, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import Table from '../../../components/Common/Table';
import Select from '../../../components/Common/Select';
import Modal from '../../../components/Common/Modal';
import Loader from '../../../components/Common/Loader';
import CorrectAttendance from './CorrectAttendance';
import attendanceService from '../../../services/attendanceService';
import './AllAttendance.css';

const getLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function AllAttendance() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await attendanceService.getAllAttendance(selectedDate, undefined, selectedStatus);
      setAttendanceList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load attendance records.');
      console.error('Attendance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedStatus]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleCorrectSubmit = async (formData) => {
    try {
      await attendanceService.correctAttendance(selectedRecord._id, formData);
      setIsModalOpen(false);
      setSelectedRecord(null);
      await fetchAttendance();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to correct attendance');
    }
  };

  const statusClass = (status) => ({
    Present: 'status-present',
    Absent: 'status-absent',
    'Half-Day': 'status-halfday',
    Late: 'status-late',
    'Weekly Off': 'status-off',
    Holiday: 'status-holiday',
    'Paid Leave': 'status-paid-leave',
    'Unpaid Leave': 'status-unpaid-leave',
  }[status] || '');

  const statusIcon = (status) => {
    if (status === 'Present') return <FiCheckCircle />;
    if (status === 'Absent') return <FiXCircle />;
    if (status === 'Half-Day' || status === 'Late') return <FiClock />;
    return null;
  };

  const columns = [
    { header: 'Employee', accessor: 'employee', render: (row) => (
      <div className="employee-cell">
        <div className="avatar-sm">{row.employee?.name?.charAt(0) || 'E'}</div>
        <span className="font-bold">{row.employee?.name || 'Unknown'}</span>
      </div>
    )},
    { header: 'Date', accessor: 'date', render: (row) =>
      new Date(row.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    },
    { header: 'Check In', accessor: 'checkIn', render: (row) =>
      row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'
    },
    { header: 'Check Out', accessor: 'checkOut', render: (row) =>
      row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'
    },
    { header: 'Work Hours', accessor: 'workHours', render: (row) =>
      Number(row.workHours) > 0 ? `${row.workHours} hrs` : '-'
    },
    { header: 'Status', accessor: 'status', render: (row) => (
      <div className="status-cell">
        <span className={`status-badge ${statusClass(row.status)}`}>{statusIcon(row.status)} {row.status}</span>
        {row.isCorrected && <span className="corrected-tag">Corrected</span>}
      </div>
    )},
    { header: 'Actions', width: '80px', render: (row) => (
      <button type="button" className="icon-btn edit" title="Correct attendance"
        onClick={() => { setSelectedRecord(row); setIsModalOpen(true); }}>
        <FiEdit />
      </button>
    )},
  ];

  const filteredList = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return attendanceList.filter((item) =>
      (item.employee?.name || '').toLowerCase().includes(query)
    );
  }, [attendanceList, searchTerm]);

  if (isLoading && attendanceList.length === 0) return <Loader text="Loading attendance..." />;

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1>My Team Attendance</h1>
          <p>View and correct attendance records of employees assigned to you</p>
        </div>
        <div className="date-filter">
          <FiCalendar className="date-icon" />
          <input type="date" className="date-input" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {error && <div className="attendance-error" role="alert">
        {error} <button type="button" onClick={fetchAttendance}>Retry</button>
      </div>}

      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search by employee name..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-actions">
          <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Present', value: 'Present' },
              { label: 'Absent', value: 'Absent' },
              { label: 'Half-Day', value: 'Half-Day' },
              { label: 'Late', value: 'Late' },
              { label: 'Weekly Off', value: 'Weekly Off' },
              { label: 'Holiday', value: 'Holiday' },
              { label: 'Paid Leave', value: 'Paid Leave' },
              { label: 'Unpaid Leave', value: 'Unpaid Leave' },
            ]} />
          <button type="button" className="attendance-refresh" onClick={fetchAttendance} title="Refresh">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {isLoading && <div className="attendance-loading">Refreshing attendance...</div>}
      {!error && <Table columns={columns} data={filteredList} emptyMessage="No attendance records found for this date." />}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedRecord(null); }}
        title="Correct Attendance" size="sm">
        <CorrectAttendance record={selectedRecord} onSubmit={handleCorrectSubmit}
          onCancel={() => { setIsModalOpen(false); setSelectedRecord(null); }} />
      </Modal>
    </div>
  );
}
